// src/socket.js
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

// Đây là "Tai nghe chung" duy nhất cho toàn bộ ứng dụng
const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true
});

export default socket;


// import io from 'socket.io-client';

// const socket = io('http://localhost:3001', {
//     transports: ['websocket'],
//     autoConnect: true
// });

// export default socket; // BẮT BUỘC PHẢI CÓ DÒNG NÀY