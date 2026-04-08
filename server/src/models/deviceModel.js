const db = require('../config/db');

const DeviceModel = {
    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM devices WHERE device_id = ?', [id]);
        return rows[0];
    },
    updateStatus: async (id, status) => {
        return await db.query('UPDATE devices SET current_status = ? WHERE device_id = ?', [status, id]);
    },
    getAll: async () => {
        const [rows] = await db.query('SELECT device_id, name, type, current_status, gpio_pin FROM devices');
        return rows;
    }
};

module.exports = DeviceModel;