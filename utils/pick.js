// Devuelve solo los campos permitidos del body (evita que el cliente modifique campos internos).
const pick = (source, fields) => {
  const data = source && typeof source === 'object' ? source : {};
  return fields.reduce((result, field) => {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }
    return result;
  }, {});
};

module.exports = pick;
