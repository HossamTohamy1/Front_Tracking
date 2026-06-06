import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Layout.css';
import { FaShip } from "react-icons/fa";
import { FaBox } from "react-icons/fa";
import { FaMoneyBillWave } from "react-icons/fa";

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
  onClose: () => void;
  isMobile: boolean;
}

interface NavItem {
  label: string;
  path: string;
  roles?: string[];
  icon: React.ReactNode;
}

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);
const ProductsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 5l7-3 7 3v8l-7 3-7-3V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M9 2v14M2 5l7 3 7-3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);
const MyProductsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M6 7h6M6 10h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const ShipmentsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 9h10M8 5l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M7 2H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M12 12l4-3-4-3M16 9H8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',   icon: <DashboardIcon /> },
  { label: 'Browse Products', path: '/products',    icon: <ProductsIcon /> },
  { label: 'My Products',     path: '/my-products', icon: <MyProductsIcon />, roles: ['ImportOffice'] },
  { label: 'Shipments',       path: '/shipments',   icon: <ShipmentsIcon />, roles: ['Customer', 'ImportOffice','Admin'] },
  { label: 'Profile',         path: '/profile',     icon: <ProfileIcon /> },
  { label: 'Container', path: '/containers', icon: <FaBox /> , roles: [ 'ImportOffice','Admin'] },
  { label: 'Cost-calculations', path: '/cost-calculations', icon: <FaMoneyBillWave /> , roles: [ 'ImportOffice','Admin','Customer'] },
{ label: 'Tracking', path: '/tracking', icon: <FaShip />, roles: ['Admin', 'Support', 'ImportOffice', 'Customer'] },

];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose, isMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleNavClick = () => {
    if (isMobile) onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) onClose();
  };


  const isCollapsed = isMobile ? false : collapsed;

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'app-sidebar',
          isCollapsed ? 'app-sidebar--collapsed' : '',
          isMobile && isOpen ? 'app-sidebar--open' : '',
        ].filter(Boolean).join(' ')}
      >
        <nav className="app-sidebar__nav">
          <div className="app-sidebar__section-label">Main</div>

          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `app-sidebar__item${isActive ? ' app-sidebar__item--active' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="app-sidebar__icon">{item.icon}</span>
              <span className="app-sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__bottom">
          <button
            className="app-sidebar__item app-sidebar__item--logout"
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="app-sidebar__icon"><LogoutIcon /></span>
            <span className="app-sidebar__label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;