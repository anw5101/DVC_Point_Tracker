import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getBreadcrumb = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/charts')) return 'Point Charts';
    if (pathname.startsWith('/calculator')) return 'Trip Calculator';
    if (pathname.startsWith('/contracts')) return 'My Contracts';
    if (pathname.startsWith('/trends')) return 'Trends';
    if (pathname === '/login') return 'Log In';
    return 'Dashboard';
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-content">
        <header className="top-header">
          <div className="top-header-left">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Menu"
            >
              <Menu size={24} />
            </button>
            <div className="breadcrumb">
              {getBreadcrumb(location.pathname)}
            </div>
          </div>
          
          <div className="top-header-right">
            <span className="badge badge-blue">v1.0 MVP</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
