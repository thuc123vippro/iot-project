const mqtt = require('mqtt');

let client = null;

const connectMQTT = () => {
    // 1. Cấu hình các thông số kết nối
    const brokerUrl = process.env.MQTT_BROKER || 'mqtt://localhost';
    
    const options = {
        port: parseInt(process.env.MQTT_PORT, 10) || 1883,
        username: process.env.MQTT_USER || undefined,
        password: process.env.MQTT_PASS || undefined,
        keepalive: 60,
        clientId: 'nodejs_backend_' + Math.random().toString(16).substring(2, 8),
        clean: true
    };

    // 2. Kết nối với URL và Options
    console.log(`Đang kết nối tới MQTT Broker tại ${brokerUrl}:${options.port}...`);
    client = mqtt.connect(brokerUrl, options);

    client.on('connect', () => {
        console.log(`✅ Đã kết nối thành công tới MQTT Broker (Port ${options.port})`);
        // Lắng nghe phản hồi chung từ tất cả thiết bị
        client.subscribe('iot/deviceresponse');
        // Subscribe topic sensor để nhận dữ liệu nhiệt độ/độ ẩm từ ESP32
        client.subscribe('iot/sensor/all');
    });

    client.on('error', (err) => {
        console.error('❌ Lỗi kết nối MQTT:', err.message);
    });

    client.on('message', (topic, message) => {
        // Xử lý message như cũ
        const deviceService = require('../services/deviceService');
        deviceService.handleMqttMessage(topic, message);
    });
};

const getMqttClient = () => client;

module.exports = { connectMQTT, getMqttClient };