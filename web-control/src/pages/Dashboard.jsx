import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import socket from '../socket';
import StatCard from '../components/StatCard';
import DeviceCard from '../components/DeviceCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import './Dashboard.css';

const MAX_CHART_POINTS = 30;

const formatTime = (raw) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '--:--:--';

  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const getSensorKey = (name = '') => {
  const normalized = String(name).toLowerCase();
  if (normalized.includes('temp')) return 't';
  if (normalized.includes('humid')) return 'h';
  if (normalized.includes('light') || normalized.includes('lux')) return 'l';
  return null;
};

const keepLatest = (arr) => arr.slice(-MAX_CHART_POINTS);

const Dashboard = () => {
  const { theme } = useTheme();
  const [devices, setDevices] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [tempHumidData, setTempHumidData] = useState([]);
  const [lightData, setLightData] = useState([]);

  const chartPalette = theme === 'light'
    ? {
      grid: '#c7d6ef',
      axis: '#5f7fb7',
      tooltipBg: '#ffffff',
      tooltipColor: '#254782'
    }
    : {
      grid: '#333',
      axis: '#8b949e',
      tooltipBg: '#161b22',
      tooltipColor: '#dbe8ff'
    };

  const latestSensorValueRef = useRef({ t: null, h: null, l: null });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resDevices, resSensors, resHistory] = await Promise.all([
          axios.get('http://localhost:3001/api/devices'),
          axios.get('http://localhost:3001/api/sensors'),
          axios.get('http://localhost:3001/api/sensor-data', {
            params: { page: 1, limit: 150, sortBy: 'newest' }
          })
        ]);

        setDevices(resDevices.data);
        setSensors(resSensors.data);

        const currentValues = { t: null, h: null, l: null };
        (resSensors.data || []).forEach((sensor) => {
          const key = getSensorKey(sensor.name || sensor.type);
          if (key) currentValues[key] = Number(sensor.lastest_value);
        });

        const historyRows = (resHistory.data?.data || []).slice().reverse();

        const thBuffer = [];
        const lightBuffer = [];

        historyRows.forEach((row) => {
          const key = getSensorKey(row.sensor_name);
          if (!key) return;

          const numericValue = Number(row.value);
          if (!Number.isFinite(numericValue)) return;

          const time = formatTime(row.created_at);
          currentValues[key] = numericValue;

          if (key === 'l') {
            lightBuffer.push({ time, l: numericValue });
          } else {
            thBuffer.push({
              time,
              t: currentValues.t,
              h: currentValues.h
            });
          }
        });

        latestSensorValueRef.current = currentValues;
        setTempHumidData(keepLatest(thBuffer));
        setLightData(keepLatest(lightBuffer));
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const bindSensorSocket = (sensorName) => {
      const key = getSensorKey(sensorName);
      if (!key) return null;

      const eventName = `update_${sensorName}`;
      const handler = (value) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return;

        const time = formatTime(new Date());
        latestSensorValueRef.current[key] = numericValue;

        if (key === 'l') {
          setLightData((prev) => keepLatest([...prev, { time, l: numericValue }]));
          return;
        }

        setTempHumidData((prev) => keepLatest([
          ...prev,
          {
            time,
            t: latestSensorValueRef.current.t,
            h: latestSensorValueRef.current.h
          }
        ]));
      };

      socket.on(eventName, handler);

      return () => socket.off(eventName, handler);
    };

    const cleanups = (sensors || []).map((sensor) => bindSensorSocket(sensor.name)).filter(Boolean);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [sensors]);

  return (
    <div className="dashboard-root">
      <div className="dashboard-stats">
        {sensors.length === 0 && <p style={{ color: 'var(--dashboard-placeholder)' }}>Đang tải cảm biến...</p>}
        {sensors.map((sensor)=> (
          <StatCard 
            key={sensor.sensor_id}
            id={sensor.sensor_id}  
            name={sensor.name}
            initialValue={sensor.lastest_value}
            unit={sensor.unit}
            type={sensor.type}
          />
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-chart-card">
          <h4 className="dashboard-chart-title">Temperature & Humidity</h4>
          <div className="dashboard-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tempHumidData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
                <XAxis dataKey="time" stroke={chartPalette.axis} />
                <YAxis stroke={chartPalette.axis} />
                <Tooltip contentStyle={{ backgroundColor: chartPalette.tooltipBg, border: 'none', borderRadius: '10px', color: chartPalette.tooltipColor }} />
                <Area type="monotone" dataKey="t" stroke="#ff3d00" fill="rgba(255,61,0,0.1)" />
                <Area type="monotone" dataKey="h" stroke="#00e5ff" fill="rgba(0,229,255,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card">
          <h4 className="dashboard-chart-title">Light Level</h4>
          <div className="dashboard-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lightData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartPalette.grid} vertical={false} />
                <XAxis dataKey="time" stroke={chartPalette.axis} />
                <YAxis stroke={chartPalette.axis} />
                <Tooltip contentStyle={{ backgroundColor: chartPalette.tooltipBg, border: 'none', borderRadius: '10px', color: chartPalette.tooltipColor }} />
                <Area type="monotone" dataKey="l" stroke="#ffc400" fill="rgba(255,196,0,0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-devices">
        {devices.length === 0 && <p style={{ color: 'var(--dashboard-placeholder)' }}>Đang tải thiết bị...</p>}
        {devices.map((device) => (
          <DeviceCard 
            key={device.device_id}
            id={device.device_id}
            name={device.name}
            type={device.type}
            initialStatus={device.current_status}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;