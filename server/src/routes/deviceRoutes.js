const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/devices', deviceController.getAllDevices);
router.get('/action-history', deviceController.getActionHistoryPaginated);
router.post('/toggle-device', deviceController.toggleDevice);

module.exports = router;