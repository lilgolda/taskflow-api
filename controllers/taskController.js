const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const findOrFail = require('../utils/findOrFail');
const {
  getStringQuery,
  getObjectIdQuery,
  getPositiveIntQuery,
} = require('../utils/query');

const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo', 'team'];
const SORTABLE_FIELDS = ['title', 'status', 'priority', 'dueDate', 'createdAt', 'updatedAt'];

const taskNotFound = (id) => `Tarea con id ${id} no encontrada`;

const populateTask = (query) =>
  query.populate('assignedTo', 'name email').populate('team', 'name');

// Verifica que el equipo y el usuario existan, y que el usuario pertenezca a ese equipo.
const checkReferences = async (teamId, assignedToId) => {
  if (teamId) {
    await findOrFail(Team, teamId, 'El equipo indicado no existe');
  }
  if (assignedToId) {
    const user = await findOrFail(User, assignedToId, 'El usuario asignado no existe');
    if (teamId && String(user.team) !== String(teamId)) {
      throw new AppError('El usuario asignado no pertenece al equipo de la tarea', 400);
    }
  }
};

// Construye el filtro de MongoDB a partir de la URL.
// Ejemplo: ?status=todo,in-progress&priority=4&search=api
const buildFilter = (query) => {
  const filter = {};

  const status = getStringQuery(query, 'status');
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    const invalid = statuses.find((s) => !Task.STATUSES.includes(s));
    if (invalid) {
      throw new AppError(
        `El estado '${invalid}' no es válido. Use: ${Task.STATUSES.join(', ')}`,
        400
      );
    }
    filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  const priority = getStringQuery(query, 'priority');
  if (priority) {
    if (!/^[1-5]$/.test(priority)) {
      throw new AppError('El parámetro priority debe ser un número entre 1 y 5', 400);
    }
    filter.priority = Number(priority);
  }

  const team = getObjectIdQuery(query, 'team');
  if (team) filter.team = team;

  const assignedTo = getObjectIdQuery(query, 'assignedTo');
  if (assignedTo) filter.assignedTo = assignedTo;

  const search = getStringQuery(query, 'search');
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escaped, $options: 'i' };
  }

  return filter;
};

// Convierte ?sort=-priority,createdAt en { priority: -1, createdAt: 1 }
const buildSort = (query) => {
  const sortParam = getStringQuery(query, 'sort');
  if (!sortParam) return { createdAt: -1, _id: 1 };

  const sort = {};
  sortParam.split(',').forEach((rawField) => {
    const field = rawField.trim();
    const direction = field.startsWith('-') ? -1 : 1;
    const name = field.replace(/^[-+]/, '');
    if (!SORTABLE_FIELDS.includes(name)) {
      throw new AppError(
        `No se puede ordenar por '${name}'. Campos permitidos: ${SORTABLE_FIELDS.join(', ')}`,
        400
      );
    }
    sort[name] = direction;
  });
  sort._id = 1; // desempate para que la paginación sea estable
  return sort;
};

// GET /api/tasks  -> consulta avanzada: filtros + orden + paginación
// Ejemplo: /api/tasks?status=todo&sort=-priority&page=1&limit=10
const getTasks = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query);
    const page = getPositiveIntQuery(req.query, 'page', 1);
    const limit = getPositiveIntQuery(req.query, 'limit', 10, 100);

    const [tasks, total] = await Promise.all([
      populateTask(Task.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: tasks.length,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await populateTask(Task.findById(req.params.id));
    if (!task) throw new AppError(taskNotFound(req.params.id), 404);

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    await checkReferences(data.team, data.assignedTo);

    if (data.status === 'done') data.completedAt = new Date();

    const task = await Task.create(data);
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'team', select: 'name' },
    ]);

    res.status(201).json({ success: true, message: 'Tarea creada correctamente', data: task });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tasks/:id   (también sirve para marcar una tarea como terminada: { "status": "done" })
const updateTask = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    if (Object.keys(data).length === 0) {
      throw new AppError('Debes enviar al menos un campo para actualizar', 400);
    }

    const current = await findOrFail(Task, req.params.id, taskNotFound(req.params.id));

    // Valida equipo y usuario con los valores finales (los nuevos o los que ya tenía)
    const finalTeam = data.team !== undefined ? data.team : current.team;
    const finalAssignedTo = data.assignedTo !== undefined ? data.assignedTo : current.assignedTo;
    await checkReferences(finalTeam, finalAssignedTo);

    if (data.status !== undefined) {
      data.completedAt = data.status === 'done' ? new Date() : null;
    }

    const task = await populateTask(
      Task.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    );
    if (!task) throw new AppError(taskNotFound(req.params.id), 404);

    res.json({ success: true, message: 'Tarea actualizada correctamente', data: task });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) throw new AppError(taskNotFound(req.params.id), 404);

    res.json({ success: true, message: 'Tarea eliminada correctamente', data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
