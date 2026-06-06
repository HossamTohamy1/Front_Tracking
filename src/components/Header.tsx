import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePWAInstall } from '../auth/usePWAInstall';
import './Layout.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isInstallable, installApp } = usePWAInstall();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          className={`app-header__toggle${sidebarOpen ? ' app-header__toggle--open' : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span /><span /><span />
        </button>
        <div className="app-header__logo">TRADE <span>APP</span></div>
      </div>

      <div className="app-header__center" />

      <div className="app-header__right">
        {/* ── PWA Install Button ── */}
        {isInstallable && (
          <button
            className="app-header__install-btn"
            onClick={installApp}
            title="Install App"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v8M5 7l3 3 3-3"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
              <path
                d="M2 12h12"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span>Install App</span>
          </button>
        )}

        {/* ── Profile Dropdown ── */}
        <div className="app-header__profile" ref={dropdownRef}>
          <button
            className="app-header__profile-btn"
            onClick={() => setDropdownOpen((o) => !o)}
          >
            <div className="app-header__avatar">
              {user ? getInitials(user.fullName) : 'TA'}
            </div>
            <div className="app-header__user-info">
              <span className="app-header__user-name">{user?.fullName ?? 'User'}</span>
              <span className="app-header__user-role">{user?.role ?? ''}</span>
            </div>
            <svg
              className={`app-header__chevron${dropdownOpen ? ' open' : ''}`}
              width="12" height="12" viewBox="0 0 12 12" fill="none"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {dropdownOpen && (
            <div className="app-header__dropdown">
              <div className="app-header__dropdown-user">
                <div className="app-header__dropdown-avatar">
                  {user ? getInitials(user.fullName) : 'TA'}
                </div>
                <div>
                  <div className="app-header__dropdown-name">{user?.fullName}</div>
                  <div className="app-header__dropdown-email">{user?.email}</div>
                </div>
              </div>
              <div className="app-header__dropdown-divider" />
              <button
                className="app-header__dropdown-item"
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                My Profile
              </button>
              <div className="app-header__dropdown-divider" />
              <button
                className="app-header__dropdown-item app-header__dropdown-item--danger"
                onClick={handleLogout}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;