const AppError = require('./AppError');

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// Lee un parámetro de la URL (?clave=valor) y exige que sea texto.
const getStringQuery = (query, key) => {
  const value = query[key];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new AppError(`El parámetro '${key}' debe ser un texto`, 400);
  }
  return value.trim();
};

// Igual que el anterior, pero además exige un id de MongoDB válido.
const getObjectIdQuery = (query, key) => {
  const value = getStringQuery(query, key);
  if (value !== undefined && !OBJECT_ID_REGEX.test(value)) {
    throw new AppError(`El parámetro '${key}' no es un id válido`, 400);
  }
  return value;
};

// Lee un entero positivo (página, límite, etc.).
const getPositiveIntQuery = (query, key, defaultValue, max = Infinity) => {
  const value = getStringQuery(query, key);
  if (value === undefined) return defaultValue;
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    throw new AppError(`El parámetro '${key}' debe ser un número entero mayor o igual a 1`, 400);
  }
  return Math.min(Number(value), max);
};

module.exports = { OBJECT_ID_REGEX, getStringQuery, getObjectIdQuery, getPositiveIntQuery };
