const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

router.get('/sensors', sensorController.getAllSensors);
router.get('/sensor-data', sensorController.getSensorDataPaginated);

module.exports = router;