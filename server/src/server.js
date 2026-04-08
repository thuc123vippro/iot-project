require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./utils/socket');
const { connectMQTT } = require('./utils/mqttClient');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const sensorService = require('./services/sensorService');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// Init IO & MQTT
initSocket(server);
connectMQTT();

// const startServer = async () => {
//     // Gọi khởi tạo Map và lắng nghe MQTT trước
//     await sensorService.init();

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// };

// startServer();


// Routes
app.use('/api', deviceRoutes);
app.use('/api', sensorRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// const PORT = process.env.PORT || 3001;
// server.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
const startServer = async () => {
    try {
        // CHÈN VÀO ĐÂY: Nó chỉ là một lệnh load dữ liệu vào RAM
        // Nếu chẳng may DB lỗi, nó sẽ rơi vào catch chứ không làm treo server
        await sensorService.init(); 
        
        const PORT = process.env.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`🚀 Sensor Service & Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Lỗi khởi động hệ thống cảm biến:", error);
        // Ngay cả khi cảm biến lỗi, ta vẫn có thể chạy server cho thiết bị
        server.listen(3001); 
    }
};

startServer();