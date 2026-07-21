import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, LayoutDashboard, TableProperties, Calculator, Wallet, TrendingUp, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">DVC Tracker</span>
            <span className="sidebar-brand-sub">Point Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">MAIN</div>
            <NavLink 
              to="/" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              end
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink 
              to="/charts" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <TableProperties size={20} />
              <span>Point Charts</span>
            </NavLink>
            <NavLink 
              to="/calculator" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Calculator size={20} />
              <span>Trip Calculator</span>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">MANAGE</div>
            <NavLink 
              to="/contracts" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Wallet size={20} />
              <span>My Contracts</span>
            </NavLink>
            <NavLink 
              to="/trends" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <TrendingUp size={20} />
              <span>Trends & Analytics</span>
            </NavLink>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-section-title">ACCOUNT</div>
            {currentUser ? (
              <button 
                onClick={() => logout()}
                className="sidebar-link"
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
              >
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            ) : (
              <NavLink 
                to="/login" 
                className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <LogIn size={20} />
                <span>Log In</span>
              </NavLink>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
