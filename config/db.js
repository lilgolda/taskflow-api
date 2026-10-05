const mongoose = require('mongoose');

// Se llama UNA sola vez desde server.js al iniciar el servidor.
// Mongoose mantiene un pool de conexiones que reutiliza en todas las peticiones.
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Falta la variable MONGODB_URI en el archivo .env');
  }

  const connection = await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || 'taskflow',
    maxPoolSize: Number(process.env.MAX_POOL_SIZE) || 10,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `MongoDB conectado: ${connection.connection.host} (base de datos: ${connection.connection.name})`
  );
};

module.exports = connectDB;
