const socketIo = require('socket.io');

let io;

exports.initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Cho phép FE truy cập
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('disconnect', () => console.log('Client disconnected'));
    });
};

exports.getIO = () => {
    if (!io) throw new Error("Socket chưa được khởi tạo!");
    return io;
};