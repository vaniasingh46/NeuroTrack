const express = require('express');
const router = express.Router();
const { getUser, createUser, recalibrate } = require('../controllers/userController');

router.get('/:userId', getUser);
router.post('/', createUser);
router.post('/:userId/recalibrate', recalibrate);

module.exports = router;
