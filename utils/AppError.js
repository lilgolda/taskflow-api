// Error "esperado" con un código HTTP. El errorHandler lo convierte en respuesta JSON.
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = AppError;
