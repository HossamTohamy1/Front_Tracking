import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './Layout.css';

const MOBILE_BP = 640;

const Layout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BP);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const checkMobile = useCallback(() => {
    const mobile = window.innerWidth <= MOBILE_BP;
    setIsMobile(mobile);
    if (mobile) {
      // لما بييجي موبايل: اقفل الـ drawer
      setMobileOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const handleClose = () => {
    setMobileOpen(false);
  };

  const shellClass = ['app-shell', !isMobile && collapsed ? 'app-shell--collapsed' : '']
    .filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <Header
        onToggleSidebar={handleToggleSidebar}
        sidebarOpen={isMobile ? mobileOpen : !collapsed}
      />
      <Sidebar
        isOpen={mobileOpen}
        collapsed={!isMobile && collapsed}
        onClose={handleClose}
        isMobile={isMobile}
      />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;