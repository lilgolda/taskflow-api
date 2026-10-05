const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [80, 'El nombre no puede superar los 80 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo electrónico no tiene un formato válido'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'member'],
        message: "El rol '{VALUE}' no es válido. Use: admin o member",
      },
      default: 'member',
    },
    // Relación con Team (ref)
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
