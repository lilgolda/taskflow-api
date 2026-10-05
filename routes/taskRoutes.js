const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.param('id', validateObjectId);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

module.exports = router;
