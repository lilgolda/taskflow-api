const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');
const findOrFail = require('../utils/findOrFail');
const { getStringQuery, getObjectIdQuery } = require('../utils/query');

const ALLOWED_FIELDS = ['name', 'email', 'role', 'team'];

const userNotFound = (id) => `Usuario con id ${id} no encontrado`;

// Si el body trae un equipo, verifica que exista (404 si no)
const checkTeam = async (teamId) => {
  if (teamId) {
    await findOrFail(Team, teamId, 'El equipo indicado no existe');
  }
};

// GET /api/users  (filtros opcionales: ?team=<id>&role=admin)
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    const team = getObjectIdQuery(req.query, 'team');
    const role = getStringQuery(req.query, 'role');
    if (team) filter.team = team;
    if (role) filter.role = role;

    const users = await User.find(filter).populate('team', 'name').sort('name');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('team', 'name description');
    if (!user) throw new AppError(userNotFound(req.params.id), 404);

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    await checkTeam(data.team);

    const user = await User.create(data);
    await user.populate('team', 'name');

    res.status(201).json({ success: true, message: 'Usuario creado correctamente', data: user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    if (Object.keys(data).length === 0) {
      throw new AppError('Debes enviar al menos un campo para actualizar', 400);
    }
    await checkTeam(data.team);

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).populate('team', 'name');
    if (!user) throw new AppError(userNotFound(req.params.id), 404);

    res.json({ success: true, message: 'Usuario actualizado correctamente', data: user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new AppError(userNotFound(req.params.id), 404);

    // Las tareas de este usuario quedan sin asignar
    await Task.updateMany({ assignedTo: user._id }, { assignedTo: null });

    res.json({ success: true, message: 'Usuario eliminado correctamente', data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
