# TaskFlow API

API REST para gestionar **usuarios, equipos y tareas** en equipo. Construida con **Node.js, Express y MongoDB (Mongoose)**, conectada a **MongoDB Atlas**. Proyecto final del curso.

## Tecnologías

- Node.js 18 o superior
- Express 4
- MongoDB Atlas + Mongoose 8
- dotenv (variables de entorno) y cors (para conectar el frontend React)

## Instalación y ejecución

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/lilgolda/taskflow-api.git
   cd taskflow-api
   npm install
   ```

2. Crea tu archivo `.env` a partir del ejemplo:

   ```bash
   # Windows (PowerShell o CMD)
   copy .env.example .env

   # Mac / Linux
   cp .env.example .env
   ```

3. Abre `.env` y coloca tu cadena de conexión real de MongoDB Atlas (ver la sección siguiente).

4. Inicia el servidor:

   ```bash
   npm run dev     # desarrollo (se reinicia solo al guardar cambios)
   npm start       # producción
   ```

5. Abre `http://localhost:3000/`. Debe responder `TaskFlow API funcionando`.

### Cómo obtener la cadena de conexión en MongoDB Atlas

1. En Atlas crea un cluster gratuito.
2. En **Database Access** crea un usuario con contraseña.
3. En **Network Access** agrega tu IP (o `0.0.0.0/0` solo para desarrollo).
4. En **Connect → Drivers** copia la cadena `mongodb+srv://...` y reemplaza `<usuario>` y `<password>`.
5. Pégala en `MONGODB_URI` dentro de tu `.env`. La base de datos se indica aparte en `DB_NAME`.

## Variables de entorno

| Variable        | Obligatoria | Descripción                                                        | Ejemplo                                   |
| --------------- | ----------- | ------------------------------------------------------------------ | ----------------------------------------- |
| `PORT`          | No          | Puerto del servidor (por defecto 3000)                             | `3000`                                    |
| `MONGODB_URI`   | **Sí**      | Cadena de conexión de MongoDB Atlas                                | `mongodb+srv://usuario:clave@cluster...`  |
| `DB_NAME`       | No          | Nombre de la base de datos, usado con la opción `dbName`          | `taskflow`                                |
| `MAX_POOL_SIZE` | No          | Tamaño máximo del pool de conexiones (por defecto 10)             | `10`                                      |
| `NODE_ENV`      | No          | `development` o `production`                                       | `development`                             |

> El archivo `.env.example` no contiene credenciales reales.

## Estructura del proyecto

```
taskflow-api/
├── server.js              Conecta a MongoDB (una sola vez) y levanta el servidor
├── app.js                 Configura Express, rutas y manejo de errores
├── config/
│   └── db.js              Conexión a MongoDB con dbName y pool de conexiones
├── models/                Esquemas de Mongoose: User, Team, Task
├── controllers/           Lógica de cada endpoint (async/await + try/catch)
├── routes/                Define las URLs y las conecta con los controladores
├── middleware/
│   ├── errorHandler.js    Manejo centralizado de errores
│   ├── notFound.js        Rutas inexistentes (404)
│   └── validateObjectId.js  Valida el :id de las URLs (400)
├── utils/                 Funciones de apoyo (AppError, pick, consultas...)
├── requests.http          Colección de pruebas (un ejemplo por endpoint)
├── .env.example
└── README.md
```

Recorrido de una petición: **ruta** (`routes/`) → **controlador** (`controllers/`) → **modelo** (`models/`) → **MongoDB Atlas**.

## Modelos

**User**: `name` (2-80 caracteres), `email` (único, formato válido), `role` (`admin` o `member`, por defecto `member`), `team` (referencia a Team, opcional).

**Team**: `name` (único, 2-60 caracteres), `description` (máx. 300 caracteres).

**Task**: `title` (3-120 caracteres), `description` (máx. 500), `status` (`todo`, `in-progress` o `done`, por defecto `todo`), `priority` (entero de 1 a 5, por defecto 3), `dueDate`, `completedAt` (la llena la API al marcar la tarea como `done`), `assignedTo` (referencia a User) y `team` (referencia a Team, obligatorio).

Todos incluyen `createdAt` y `updatedAt` automáticamente.

## Endpoints

### Usuarios: `/api/users`

| Método | Ruta             | Descripción                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/api/users`     | Listar usuarios (filtros: `?team=<id>&role=admin`) |
| GET    | `/api/users/:id` | Obtener un usuario                             |
| POST   | `/api/users`     | Crear un usuario                               |
| PUT    | `/api/users/:id` | Actualizar un usuario                          |
| DELETE | `/api/users/:id` | Eliminar un usuario (sus tareas quedan sin asignar) |

### Equipos: `/api/teams`

| Método | Ruta                         | Descripción                                              |
| ------ | ---------------------------- | -------------------------------------------------------- |
| GET    | `/api/teams`                 | Listar equipos                                           |
| GET    | `/api/teams/:id`             | Obtener un equipo con sus miembros                       |
| POST   | `/api/teams`                 | Crear un equipo                                          |
| PUT    | `/api/teams/:id`             | Actualizar un equipo                                     |
| DELETE | `/api/teams/:id`             | Eliminar un equipo (sus usuarios quedan sin equipo y sus tareas se eliminan) |
| GET    | `/api/teams/:id/task-stats`  | **Aggregation Pipeline**: cantidad de tareas por estado  |

### Tareas: `/api/tasks`

| Método | Ruta             | Descripción                                              |
| ------ | ---------------- | -------------------------------------------------------- |
| GET    | `/api/tasks`     | Listar tareas con **filtros, orden y paginación**        |
| GET    | `/api/tasks/:id` | Obtener una tarea                                        |
| POST   | `/api/tasks`     | Crear una tarea                                          |
| PUT    | `/api/tasks/:id` | Actualizar una tarea (también sirve para marcarla como `done`) |
| DELETE | `/api/tasks/:id` | Eliminar una tarea                                       |

## Consultas avanzadas

### 1. Filtros, orden y paginación en `GET /api/tasks`

| Parámetro    | Descripción                                                     | Ejemplo                    |
| ------------ | --------------------------------------------------------------- | -------------------------- |
| `status`     | Uno o varios estados separados por coma                         | `status=todo,in-progress`  |
| `priority`   | Prioridad exacta (1 a 5)                                        | `priority=4`               |
| `team`       | Id del equipo                                                   | `team=65f...`              |
| `assignedTo` | Id del usuario asignado                                         | `assignedTo=65f...`        |
| `search`     | Busca texto dentro del título                                   | `search=login`             |
| `sort`       | Campos separados por coma; `-` delante = descendente. Permitidos: `title`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt` | `sort=-priority,dueDate` |
| `page`       | Número de página (por defecto 1)                                | `page=2`                   |
| `limit`      | Resultados por página (por defecto 10, máximo 100)              | `limit=5`                  |

Ejemplo:

```
GET /api/tasks?status=todo&sort=-priority&page=1&limit=10
```

La respuesta incluye los datos y la información de paginación:

```json
{
  "success": true,
  "count": 2,
  "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false },
  "data": [ ... ]
}
```

### 2. Aggregation Pipeline: tareas por estado de un equipo

```
GET /api/teams/:id/task-stats
```

```json
{
  "success": true,
  "data": {
    "team": { "_id": "65f...", "name": "Equipo Frontend" },
    "total": 3,
    "byStatus": { "todo": 1, "in-progress": 1, "done": 1 }
  }
}
```

## Manejo de errores

Todos los errores usan el mismo formato, generado por `middleware/errorHandler.js`:

```json
{
  "success": false,
  "status": 400,
  "message": "Error de validación",
  "errors": [ { "field": "email", "message": "El correo electrónico no tiene un formato válido" } ]
}
```

| Código | Cuándo ocurre                                                                 |
| ------ | ----------------------------------------------------------------------------- |
| `400`  | Datos inválidos, id mal formado, JSON roto o parámetros de consulta incorrectos |
| `404`  | El recurso (o un equipo/usuario referenciado) no existe, o la ruta no existe  |
| `409`  | Registro duplicado (por ejemplo, un email o nombre de equipo repetido)        |
| `500`  | Solo errores inesperados del servidor                                         |

## Reglas de negocio

- Un usuario solo puede ser asignado a una tarea de **su propio equipo**.
- Al marcar una tarea como `done`, se guarda `completedAt` automáticamente; si vuelve a otro estado, se limpia.
- La API solo acepta los campos permitidos de cada modelo; el resto del body se ignora.

## Pruebas

El archivo `requests.http` contiene al menos un ejemplo por endpoint, más ejemplos de errores 400, 404 y 409. Para usarlo:

1. Instala la extensión **REST Client** en VS Code.
2. Abre `requests.http` y pulsa **Send Request** sobre cada petición, de arriba hacia abajo.

Las primeras peticiones guardan los ids automáticamente para que las siguientes funcionen sin copiar nada.

## Autor

Proyecto final de curso. Ramon Osvaldo Rodriguez Martinez