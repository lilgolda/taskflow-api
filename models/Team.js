const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del equipo es obligatorio'],
      unique: true,
      trim: true,
      minlength: [2, 'El nombre del equipo debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre del equipo no puede superar los 60 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'La descripción no puede superar los 300 caracteres'],
      default: '',
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Team', teamSchema);
