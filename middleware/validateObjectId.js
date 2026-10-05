const AppError = require('../utils/AppError');
const { OBJECT_ID_REGEX } = require('../utils/query');

// Se usa con router.param('id', ...) para validar el :id de todas las rutas.
// Un id con formato incorrecto responde 400 antes de llegar a la base de datos.
const validateObjectId = (req, res, next, id) => {
  if (!OBJECT_ID_REGEX.test(id)) {
    return next(new AppError(`El id '${id}' no es válido`, 400));
  }
  next();
};

module.exports = validateObjectId;
