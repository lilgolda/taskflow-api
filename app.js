const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors()); // permite que el frontend React consuma la API
app.use(express.json()); // lee el body en formato JSON

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API funcionando',
    endpoints: ['/api/users', '/api/teams', '/api/tasks'],
  });
});

app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);

// Siempre al final: rutas inexistentes y manejo centralizado de errores
app.use(notFound);
app.use(errorHandler);

module.exports = app;
