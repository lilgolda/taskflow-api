// Middleware centralizado de errores (debe registrarse al final en app.js).
// Todas las respuestas de error tienen el mismo formato:
// { success: false, status: 400, message: "...", errors?: [...] }
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let errors;

  if (err.isOperational) {
    // Errores que lanzamos nosotros con AppError (404, 400 personalizados, etc.)
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details || undefined;
  } else if (err.name === 'ValidationError') {
    // Falló una validación del modelo (required, enum, min/max, match...)
    statusCode = 400;
    message = 'Error de validación';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    // Valor con tipo incorrecto (por ejemplo un id mal formado)
    statusCode = 400;
    const value = typeof err.value === 'object' ? JSON.stringify(err.value) : err.value;
    message = `El valor '${value}' no es válido para el campo '${err.path}'`;
  } else if (err.code === 11000) {
    // Registro duplicado (índice unique)
    statusCode = 409;
    const fields = Object.keys(err.keyValue || {});
    const detail = fields.map((f) => `${f} '${err.keyValue[f]}'`).join(', ');
    message = `Ya existe un registro con ese valor: ${detail || 'campo duplicado'}`;
    errors = fields.map((f) => ({ field: f, message: 'Este valor ya está registrado' }));
  } else if (err.type === 'entity.parse.failed') {
    // JSON mal escrito en el body
    statusCode = 400;
    message = 'El cuerpo de la petición no es un JSON válido';
  } else if (err.statusCode >= 400 && err.statusCode < 500) {
    // Otros errores 4xx de Express (por ejemplo body demasiado grande)
    statusCode = err.statusCode;
    message = err.message;
  }

  if (statusCode === 500) {
    console.error(err);
  }

  const body = { success: false, status: statusCode, message };
  if (errors) body.errors = errors;
  if (statusCode === 500 && process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
