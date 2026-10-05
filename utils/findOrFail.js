const AppError = require('./AppError');

// Busca un documento por id. Si no existe lanza un error 404 con el mensaje indicado.
const findOrFail = async (Model, id, notFoundMessage) => {
  const document = await Model.findById(id);
  if (!document) {
    throw new AppError(notFoundMessage, 404);
  }
  return document;
};

module.exports = findOrFail;
