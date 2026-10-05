const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const pick = require('../utils/pick');

const ALLOWED_FIELDS = ['name', 'description'];

const teamNotFound = (id) => `Equipo con id ${id} no encontrado`;

// GET /api/teams
const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find().sort('name');
    res.json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id  (incluye los miembros del equipo)
const getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) throw new AppError(teamNotFound(req.params.id), 404);

    const members = await User.find({ team: team._id }).select('name email role').sort('name');

    res.json({ success: true, data: { ...team.toObject(), members } });
  } catch (error) {
    next(error);
  }
};

// POST /api/teams
const createTeam = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    const team = await Team.create(data);

    res.status(201).json({ success: true, message: 'Equipo creado correctamente', data: team });
  } catch (error) {
    next(error);
  }
};

// PUT /api/teams/:id
const updateTeam = async (req, res, next) => {
  try {
    const data = pick(req.body, ALLOWED_FIELDS);
    if (Object.keys(data).length === 0) {
      throw new AppError('Debes enviar al menos un campo para actualizar', 400);
    }

    const team = await Team.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!team) throw new AppError(teamNotFound(req.params.id), 404);

    res.json({ success: true, message: 'Equipo actualizado correctamente', data: team });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/teams/:id
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) throw new AppError(teamNotFound(req.params.id), 404);

    // Los usuarios quedan sin equipo y las tareas del equipo se eliminan
    await User.updateMany({ team: team._id }, { team: null });
    await Task.deleteMany({ team: team._id });

    res.json({ success: true, message: 'Equipo eliminado correctamente', data: team });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id/task-stats  -> Aggregation Pipeline: cantidad de tareas por estado
const getTeamTaskStats = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) throw new AppError(teamNotFound(req.params.id), 404);

    const grouped = await Task.aggregate([
      { $match: { team: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Todos los estados aparecen en la respuesta, aunque tengan 0 tareas
    const byStatus = {};
    Task.STATUSES.forEach((status) => {
      byStatus[status] = 0;
    });
    grouped.forEach((item) => {
      byStatus[item._id] = item.count;
    });
    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

    res.json({
      success: true,
      data: { team: { _id: team._id, name: team.name }, total, byStatus },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamTaskStats,
};
