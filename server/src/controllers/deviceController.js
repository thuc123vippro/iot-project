const deviceService = require('../services/deviceService');
const { parseTableQuery, ALLOWED } = require('../utils/queryValidator');

exports.getAllDevices = async (req, res) => {
    try {
        const devices = await deviceService.getAllDevices();
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getActionHistoryPaginated = async (req, res) => {
    const { page, limit, findBy, sortBy, search, errors } =
        parseTableQuery(req.query, ALLOWED.history.findBy, ALLOWED.history.sortBy);

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: 'Tham số không hợp lệ', details: errors });
    }

    try {
        const result = await deviceService.getActionHistoryPaginated({ page, limit, findBy, search, sortBy });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.toggleDevice = async (req, res) => {
    try {
        const { device_id } = req.body;

        if (!device_id) {
            return res.status(400).json({ message: 'device_id là bắt buộc' });
        }

        const result = await deviceService.toggleDeviceLogic(device_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
