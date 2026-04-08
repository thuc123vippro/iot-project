import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaThLarge, FaDatabase, FaHistory, FaUser, FaBolt } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const Sidebar = () => {
  const menu = [
    { path: '/', name: 'Dashboard', icon: <FaThLarge /> },
    { path: '/sensor', name: 'Data Sensor', icon: <FaDatabase /> },
    { path: '/history', name: 'Action History', icon: <FaHistory /> },
    { path: '/profile', name: 'Profile', icon: <FaUser /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <FaBolt className="sidebar-brand-icon" /> SmartHome
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon} {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <ThemeToggle />
      </div>
    </aside>
  );
};
export default Sidebar;