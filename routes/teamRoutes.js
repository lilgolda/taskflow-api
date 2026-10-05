const express = require('express');
const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamTaskStats,
} = require('../controllers/teamController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.param('id', validateObjectId);

router.route('/').get(getTeams).post(createTeam);
router.get('/:id/task-stats', getTeamTaskStats);
router.route('/:id').get(getTeamById).put(updateTeam).delete(deleteTeam);

module.exports = router;
