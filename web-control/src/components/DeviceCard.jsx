import React, { useState, useEffect } from 'react';
import { FaFan, FaLightbulb, FaSnowflake } from 'react-icons/fa';
import axios from 'axios';
// import io from 'socket.io-client';

import socket from '../socket';
import { useTheme } from '../context/ThemeContext';

// 1. KHỞI TẠO SOCKET CONNECTION
// Đặt bên ngoài component để tránh tạo lại kết nối mỗi lần component re-render
// URL này phải trùng với PORT server đang chạy (3001)
// const socket = io('http://localhost:3001', {
//     transports: ['websocket'], // Bắt buộc dùng websocket để nhanh hơn
//     autoConnect: true
// });

const DeviceCard = ({ id, name, type, initialStatus }) => {
  const { theme } = useTheme();
  // Status: Trạng thái thực tế từ Server ('on', 'off', 'waiting')
  const [status, setStatus] = useState(initialStatus); 
  
  // VisualState: Trạng thái hiển thị (để giữ icon quay/sáng khi đang waiting)
  const [visualState, setVisualState] = useState('off');
  
  // API URL: Phải khớp với route đã khai báo trong deviceRoutes.js
  const apiUrl = 'http://localhost:3001/api/toggle-device';

  // --- LOGIC 1: Lắng nghe tín hiệu Realtime từ Server ---
  useEffect(() => {
    const eventName = `device_update_${id}`;

    // 2. Thay đổi: Định nghĩa hàm xử lý có tên cụ thể
    const handleUpdate = (data) => {
        console.log(`[Socket ${id}] Nhận tín hiệu mới:`, data.status);
        setStatus(data.status); 
    };

    console.log(`[Socket] Đăng ký lắng nghe kênh: ${eventName}`);
    
    // 3. Sử dụng tai nghe chung để đăng ký
    socket.on(eventName, handleUpdate);

    // 4. Cleanup: Gỡ bỏ chính xác hàm này khi component unmount
    return () => {
        console.log(`[Socket] Gỡ bỏ tai nghe kênh: ${eventName}`);
        socket.off(eventName, handleUpdate);
    };
  }, [id]); // Chỉ chạy lại khi ID t

  // --- LOGIC 2: Xử lý hiệu ứng (Visual) ---
  // Tách biệt hiển thị để UX mượt mà (Waiting không làm tắt đèn/quạt ngay)
  useEffect(() => {
    if (status !== 'waiting') {
      setVisualState(status);
    }
  }, [status]);


  // --- LOGIC 3: Gửi lệnh lên Server ---
  const handleToggle = () => {
    // Chặn spam click khi đang chờ xử lý
    if (status === 'waiting') return;

    console.log(`[API] Gửi lệnh toggle cho ID: ${id}`);

    // Gửi đúng key 'device_id' để khớp với Backend: const { device_id } = req.body;
    axios.post(apiUrl, {
        device_id: id 
    })
    .then(response => {
        console.log("[API] Gửi thành công, đang chờ Socket phản hồi...");
        // KHÔNG setStatus ở đây. Hãy để Socket tự bắn về -> useEffect số 1 bắt được -> cập nhật UI.
        // Điều này đảm bảo trạng thái trên màn hình luôn ĐÚNG với Database.
    })
    .catch(error => {
        console.error("[API] Lỗi gửi tín hiệu:", error);
        alert("Lỗi kết nối đến Server!");
    });
  };

  // Hàm phụ trợ: Tính vị trí nút gạt
  const getSliderPos = () => {
    if (status === 'off') return '2px';     // Trái
    if (status === 'waiting') return '22px'; // Giữa
    return '42px';                          // Phải
  };

  const getDeviceTheme = () => {
    const normalizedType = String(type || '').toLowerCase();
    const isLightMode = theme === 'light';

    if (normalizedType.includes('light')) {
      return {
        iconColor: '#f2b53a',
        cardBg: isLightMode
          ? 'linear-gradient(145deg, rgba(255,250,235,0.96), rgba(255,242,214,0.96))'
          : 'linear-gradient(145deg, rgba(30,43,80,0.92), rgba(22,31,58,0.92))',
        cardBorder: isLightMode ? 'rgba(234, 176, 74, 0.45)' : 'rgba(126, 161, 247, 0.4)'
      };
    }

    if (normalizedType.includes('fan')) {
      return {
        iconColor: '#1da7ff',
        cardBg: isLightMode
          ? 'linear-gradient(145deg, rgba(241,248,255,0.96), rgba(226,241,255,0.96))'
          : 'linear-gradient(145deg, rgba(31,46,88,0.92), rgba(24,33,61,0.92))',
        cardBorder: isLightMode ? 'rgba(116, 173, 255, 0.52)' : 'rgba(115, 173, 255, 0.4)'
      };
    }

    return {
      iconColor: '#21c063',
      cardBg: isLightMode
        ? 'linear-gradient(145deg, rgba(240,252,244,0.96), rgba(228,245,236,0.96))'
        : 'linear-gradient(145deg, rgba(28,45,84,0.92), rgba(21,30,58,0.92))',
      cardBorder: isLightMode ? 'rgba(102, 188, 137, 0.48)' : 'rgba(120, 182, 255, 0.4)'
    };
  };

  const { iconColor, cardBg, cardBorder } = getDeviceTheme();
  const isLightMode = theme === 'light';
  const statusText = status === 'waiting' ? 'Waiting' : (status === 'on' ? 'On' : 'Off');

  return (
    <div className={`device-card ${visualState === 'on' ? 'active' : ''}`} 
         style={{ 
             background: cardBg,
             borderRadius: '22px', 
             padding: '16px 18px', 
           color: 'var(--text-main)',
         marginBottom: 0,
             border: status === 'waiting' ? '1px solid #ffa000' : `1px solid ${cardBorder}`,
             transition: 'border 0.3s'
         }}>
      
      {/* Phần Icon và Tên */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div className={`device-icon`} 
             style={{ 
                color: visualState === 'on' ? iconColor : '#6f7d9f',
                fontSize: '34px',
                // Animation quay nếu là quạt và đang bật
                animation: (visualState === 'on' && type === 'fan') ? 'spin 1s linear infinite' : 'none',
                transition: 'color 0.3s'
             }}>
          {type === 'light' ? <FaLightbulb /> : type === 'fan' ? <FaFan /> : <FaSnowflake />}
        </div>
        <span style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>{name}</span>
      </div>

      {/* Phần Trạng thái chữ và Nút gạt */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isLightMode
          ? 'linear-gradient(145deg, rgba(226, 238, 255, 0.96), rgba(213, 228, 252, 0.92))'
          : 'linear-gradient(145deg, rgba(95, 116, 163, 0.35), rgba(59, 77, 117, 0.2))',
        border: theme === 'light' ? '1px solid rgba(143, 175, 235, 0.45)' : '1px solid rgba(163, 185, 238, 0.28)',
        borderRadius: '14px',
        padding: '6px 8px 6px 10px'
      }}>
        <span style={{ 
            fontWeight: 700,
            fontSize: '2rem',
            color: status === 'waiting' ? '#ffa000' : (status === 'on' ? '#36b56a' : 'var(--text-main)') 
        }}>
          {statusText}
        </span>

        {/* Nút gạt Toggle */}
        <div onClick={handleToggle} style={{ 
          width: '68px', height: '28px', background: theme === 'light' ? '#c7d9f7' : '#21262d', 
          borderRadius: '15px', position: 'relative', cursor: 'pointer',
          opacity: status === 'waiting' ? 0.7 : 1 // Mờ đi chút nếu đang waiting
        }}>
          <div style={{ 
            width: '24px', height: '24px', 
            background: status === 'waiting' ? '#ffa000' : '#fff',
            borderRadius: '50%', position: 'absolute', top: '2px',
            left: getSliderPos(), // Vị trí tính toán
            transition: 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            boxShadow: status === 'on' ? '0 0 10px #fff' : 'none'
          }} />
        </div>
      </div>

      {/* CSS Inline cho animation quay (nếu bạn chưa có file CSS riêng) */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DeviceCard;