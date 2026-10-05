const mongoose = require('mongoose');

const STATUSES = ['todo', 'in-progress', 'done'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título de la tarea es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [120, 'El título no puede superar los 120 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: "El estado '{VALUE}' no es válido. Use: todo, in-progress o done",
      },
      default: 'todo',
    },
    // 1 = prioridad más baja, 5 = más alta
    priority: {
      type: Number,
      min: [1, 'La prioridad mínima es 1'],
      max: [5, 'La prioridad máxima es 5'],
      default: 3,
      validate: {
        validator: Number.isInteger,
        message: 'La prioridad debe ser un número entero',
      },
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Lo llena la API automáticamente cuando status pasa a "done"
    completedAt: {
      type: Date,
      default: null,
    },
    // Relaciones (ref)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: [true, 'El equipo es obligatorio'],
    },
  },
  { timestamps: true, versionKey: false }
);

// Acelera las consultas por equipo y estado
taskSchema.index({ team: 1, status: 1 });

const Task = mongoose.model('Task', taskSchema);
Task.STATUSES = STATUSES;

module.exports = Task;
