import React from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => (
  <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
    <Sidebar />
    <main style={{ flex: 1, padding: '30px', overflow: 'hidden', minWidth: 0, background: 'var(--main-surface-bg)' }}>
      {children}
    </main>
  </div>
);
export default MainLayout;