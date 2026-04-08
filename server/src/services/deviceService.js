const DeviceModel = require('../models/deviceModel');
const HistoryModel = require('../models/historyModel');
const { getIO } = require('../utils/socket');
const { getMqttClient } = require('../utils/mqttClient');

// Sổ cái theo dõi request (Key = topic response)
const pendingRequests = {};

exports.getAllDevices = async () => {
    return await DeviceModel.getAll();
};

exports.getActionHistoryPaginated = async ({ page, limit, findBy, search, sortBy }) => {
    return await HistoryModel.getPaginated({ page, limit, findBy, search, sortBy });
};

exports.toggleDeviceLogic = async (deviceId) => {
    // 1. Kiểm tra thiết bị
    const device = await DeviceModel.findById(deviceId);
    if (!device) throw new Error("Thiết bị không tồn tại");
    if (device.current_status === 'waiting') throw new Error("Thiết bị đang bận");

    // 2. Xác định Action
    const currentStatus = device.current_status;
    const targetAction = currentStatus === 'on' ? 'off' : 'on';

    console.log(`[LOGIC] Toggle Device ${deviceId}: ${currentStatus} -> ${targetAction}`);

    // --- BẮT ĐẦU XỬ LÝ ---

    // A. Cập nhật DB -> Waiting
    await DeviceModel.updateStatus(deviceId, 'waiting');

    // B. Tạo History -> Waiting
    const historyId = await HistoryModel.create(deviceId, targetAction, 'waiting');

    // C. Báo FE -> Waiting
    getIO().emit(`device_update_${deviceId}`, { status: 'waiting' });

    // D. Gửi lệnh MQTT tới topic chung
    const mqttClient = getMqttClient();
    if (mqttClient) {
        const payload = JSON.stringify({ device_id: deviceId, pin: device.gpio_pin, command: targetAction });
        mqttClient.publish('iot/devicecontrol', payload);
    }

    // E. Setup Timeout (5s)
    const timeoutObj = setTimeout(async () => {
        console.log(`[TIMEOUT] Reverting device ${deviceId}...`);

        // Timeout -> Quay về trạng thái CŨ
        await DeviceModel.updateStatus(deviceId, currentStatus);

        // History -> Cập nhật thành trạng thái CŨ
        await HistoryModel.updateStatus(historyId, currentStatus);

        // Báo FE -> Về cũ
        getIO().emit(`device_update_${deviceId}`, { status: currentStatus });

        delete pendingRequests[deviceId];
    }, 5000);

    // F. Lưu sổ cái (key = deviceId)
    pendingRequests[deviceId] = {
        historyId,
        targetAction,   // Cái muốn đạt được
        currentStatus,  // Cái cũ (để revert)
        timeoutObj
    };

    return { success: true, message: "Đã gửi lệnh, đang chờ phản hồi..." };
};

// Hàm xử lý tin nhắn MQTT nhận về
exports.handleMqttMessage = async (topic, message) => {
    if (topic !== 'iot/deviceresponse') return;

    let parsed;
    try {
        parsed = JSON.parse(message.toString());
    } catch (e) {
        console.error('[MQTT] Response không hợp lệ:', message.toString());
        return;
    }

    const { device_id, result } = parsed;
    const request = pendingRequests[device_id];
    if (!request) return; // Không ai chờ thiết bị này -> bỏ qua

    if (result === `${request.targetAction} success`) {
        clearTimeout(request.timeoutObj); // Hủy Timeout

        // Update DB -> Action mới
        await DeviceModel.updateStatus(device_id, request.targetAction);

        // Update History -> Action mới
        await HistoryModel.updateStatus(request.historyId, request.targetAction);

        // Báo FE -> Action mới
        getIO().emit(`device_update_${device_id}`, { status: request.targetAction });

        // Xóa sổ cái
        delete pendingRequests[device_id];
        console.log(`[SUCCESS] Device ${device_id} updated to ${request.targetAction}`);
    }
};