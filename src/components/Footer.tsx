import React from 'react';
import './Layout.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <span>© {new Date().getFullYear()} Trade App — Global Logistics &amp; Ledger</span>
      <div className="app-footer__links">
        <span>Privacy</span>
        <span>Terms</span>
        <span>Support</span>
        <span>v1.0.0</span>
      </div>
    </footer>
  );
};

export default Footer;