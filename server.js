require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Conectar a MongoDB (una sola vez)
    await connectDB();

    // 2. Levantar el servidor HTTP
    app.listen(PORT, () => {
      console.log(`TaskFlow API escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer();
