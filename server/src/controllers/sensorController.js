const sensorService = require('../services/sensorService');
const { parseTableQuery, ALLOWED } = require('../utils/queryValidator');

exports.getAllSensors = async (req, res) => {
    try {
        const sensors = await sensorService.getAllSensors();
        res.json(sensors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSensorDataPaginated = async (req, res) => {
    const { page, limit, findBy, sortBy, search, errors } =
        parseTableQuery(req.query, ALLOWED.sensor.findBy, ALLOWED.sensor.sortBy);

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Tham số không hợp lệ', details: errors });
    }

    try {
        const unit = String(req.query.unit || '').trim();
        const result = await sensorService.getSensorDataPaginated({ page, limit, findBy, search, sortBy, unit });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
