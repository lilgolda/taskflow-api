const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.param('id', validateObjectId);

router.route('/').get(getUsers).post(createUser);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
