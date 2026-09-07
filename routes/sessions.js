const express = require('express');
const router = express.Router();
const { createSession, getHistory, getLatest } = require('../controllers/sessionController');

router.post('/', createSession); // POST /api/sessions
router.get('/:userId/latest', getLatest); // GET /api/sessions/:userId/latest
router.get('/:userId', getHistory); // GET /api/sessions/:userId?limit=&since=&validOnly=

module.exports = router;
