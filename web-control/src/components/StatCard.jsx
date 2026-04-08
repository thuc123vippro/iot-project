import React, { useState, useEffect } from 'react'; // 1. Thêm useState, useEffect
import { FaThermometerHalf, FaTint, FaLightbulb, FaQuestionCircle } from 'react-icons/fa';
import socket from '../socket'; // 2. Nhớ import socket (đường dẫn tùy folder của bạn)
import { useTheme } from '../context/ThemeContext';

const StatCard = ({ id, name, initialValue, unit, type }) => {
  const { theme } = useTheme();
  // Khởi tạo state từ giá trị ban đầu (từ DB)
  const [currentValue, setCurrentValue] = useState(initialValue);

  useEffect(() => {
    // Kênh nghe bây giờ là đích danh, ví dụ: 'update_Temperature'
    const eventName = `update_${name}`;

    const handleUpdate = (val) => {
        console.log(`[Socket] ${name} nhận đích danh:`, val);
        setCurrentValue(val); // Nhận là dùng luôn, không cần check ID hay Name
    };

    socket.on(eventName, handleUpdate);

    return () => {
        socket.off(eventName, handleUpdate);
    };
}, [name]); // Khi tên cảm biến thay đổi thì đổi kênh nghe

  // Logic tự động chọn Icon
  const getIcon = () => {
    const isLightMode = theme === 'light';

    switch (type) {
      case 'temp':
        return {
          Icon: FaThermometerHalf,
          color: '#ff4a24',
          cardBackground: isLightMode
            ? 'linear-gradient(145deg, rgba(255, 242, 238, 0.95), rgba(255, 232, 226, 0.95))'
            : 'linear-gradient(145deg, rgba(92,33,44,0.95), rgba(44,27,54,0.94))',
          cardGlow: isLightMode ? '0 0 22px rgba(255, 129, 96, 0.28)' : '0 0 28px rgba(255, 70, 40, 0.62)',
          iconShell: isLightMode
            ? 'radial-gradient(circle at 30% 30%, rgba(255,173,140,0.38), rgba(255,236,229,0.96))'
            : 'radial-gradient(circle at 30% 30%, rgba(255,147,94,0.42), rgba(110,26,36,0.94))'
        };
      case 'humid':
        return {
          Icon: FaTint,
          color: '#14b5ff',
          cardBackground: isLightMode
            ? 'linear-gradient(145deg, rgba(235, 247, 255, 0.95), rgba(221, 239, 255, 0.95))'
            : 'linear-gradient(145deg, rgba(36,73,128,0.95), rgba(26,46,95,0.94))',
          cardGlow: isLightMode ? '0 0 24px rgba(92, 181, 255, 0.28)' : '0 0 30px rgba(43, 162, 255, 0.64)',
          iconShell: isLightMode
            ? 'radial-gradient(circle at 30% 30%, rgba(111,207,255,0.38), rgba(235,248,255,0.96))'
            : 'radial-gradient(circle at 30% 30%, rgba(86,195,255,0.46), rgba(24,58,105,0.94))'
        };
      case 'light':
        return {
          Icon: FaLightbulb,
          color: '#ffc533',
          cardBackground: isLightMode
            ? 'linear-gradient(145deg, rgba(255, 250, 234, 0.95), rgba(255, 243, 211, 0.95))'
            : 'linear-gradient(145deg, rgba(94,84,34,0.95), rgba(51,49,58,0.94))',
          cardGlow: isLightMode ? '0 0 24px rgba(255, 206, 83, 0.3)' : '0 0 30px rgba(255, 212, 50, 0.62)',
          iconShell: isLightMode
            ? 'radial-gradient(circle at 30% 30%, rgba(255,232,136,0.42), rgba(255,246,216,0.96))'
            : 'radial-gradient(circle at 30% 30%, rgba(255,231,126,0.46), rgba(112,95,29,0.94))'
        };
      default:
        return {
          Icon: FaQuestionCircle,
          color: '#ccc',
          cardBackground: isLightMode
            ? 'linear-gradient(145deg, rgba(244, 248, 255, 0.95), rgba(236, 242, 252, 0.95))'
            : 'linear-gradient(145deg, rgba(35,39,52,0.9), rgba(27,30,40,0.92))',
          cardGlow: 'none',
          iconShell: isLightMode ? 'rgba(234, 241, 252, 0.95)' : 'rgba(35,39,52,0.92)'
        };
    }
  };

  const { Icon, color, cardBackground, cardGlow, iconShell } = getIcon();

  return (
    <div className={`stat-card ${type}`} style={{
      background: cardBackground,
      padding: '16px 20px',
      borderRadius: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      border: '1px solid rgba(176, 199, 255, 0.24)',
      boxShadow: cardGlow,
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    }}>
      <div>
        {/* 3. SỬA LỖI Ở ĐÂY: Dùng currentValue thay vì value */}
        {/* Thêm check null: Nếu chưa có số thì hiện dấu -- */}
        <div style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>
            {currentValue !== null && currentValue !== undefined ? currentValue : '--'}{unit}
        </div>
        <div style={{ color: 'var(--text-main)', fontSize: '1.72rem', marginTop: '8px', fontWeight: 500 }}>{name}</div>
      </div>

      <div style={{
        width: '74px',
        height: '74px',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: iconShell,
        border: '1px solid rgba(186, 206, 255, 0.34)',
        boxShadow: 'inset 0 0 18px rgba(255,255,255,0.08)'
      }}>
        <Icon size={44} color={color} />
      </div>
    </div>
  );
};

export default StatCard;