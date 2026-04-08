const { getIO } = require('../utils/socket');
const { getMqttClient } = require('../utils/mqttClient');
const SensorModel = require('../models/sensorModel');

let sensorMap = {};
exports.init = async () => {
    try {
        const sensors = await SensorModel.getAll();
        // Chuyển mảng thành Object: { "Temperature": 1, "Humidity": 2, ... }
        sensorMap = sensors.reduce((acc, sensor) => {
            acc[sensor.name] = sensor.sensor_id;
            return acc;
        }, {});
        
        console.log("✅ [SENSOR] Map initialized:", sensorMap);

        // Sau khi có Map, bắt đầu lắng nghe MQTT
        this.startListening();
    } catch (err) {
        console.error("❌ [SENSOR] Init failed:", err.message);
    }
};

/**
 * 2. Lắng nghe tin nhắn từ MQTT
 */
exports.startListening = () => {
    const mqttClient = getMqttClient();
    const topic = 'iot/sensor/all';

    mqttClient.subscribe(topic, (err) => {
        if (!err) console.log(`[MQTT] Subscribed to topic: ${topic}`);
    });

    mqttClient.on('message', async (incomingTopic, message) => {
        if (incomingTopic === topic) {
            await this.handleIncomingData(message);
        }
    });
};

/**
 * 3. Xử lý gói tin JSON nhận được
 * Gói tin mẫu: {"Temperature": 28.5, "Humidity": 60}
 */
exports.handleIncomingData = async (message) => {
    try {
        const data = JSON.parse(message.toString());
        
        // Duyệt qua từng cặp key:value trong JSON
        for (const [name, value] of Object.entries(data)) {
            const sensorId = sensorMap[name];

            if (sensorId) {
                // A. Lưu lịch sử vào Database (chạy ngầm, không cần await để tránh lag luồng chính)
                SensorModel.saveHistory(sensorId, value).catch(err => 
                    console.error(`[DB Error] Save sensor ${name} failed:`, err)
                );

                // B. Bắn Socket.io cho Frontend
                // FE nhận được qua kênh 'sensor_update'
                getIO().emit(`update_${name}`, value);

                // console.log(`[SENSOR] Updated: ${name} -> ${value}`);
            } else {
                console.warn(`[SENSOR] Unknown sensor name: ${name}`);
            }
        }
    } catch (error) {
        console.error("[SENSOR] Data parse error:", error.message);
    }
};



exports.getAllSensors = async () => {
    return await SensorModel.getAll();
};

exports.getSensorDataPaginated = async ({ page, limit, findBy, search, sortBy, unit }) => {
    return await SensorModel.getSensorDataPaginated({ page, limit, findBy, search, sortBy, unit });
};