import React from 'react';
import DarkModeToggle from './DarkModeToggle';
import './MainNavbar.css';

const MainNavbar = ({ isDarkMode, toggleDarkMode }) => (
  <nav className="main-navbar">
    <div className="main-navbar-flex-row">
      <div className="main-navbar-logo">
        <img src="/logo-placeholder.svg" alt="cfiles logo" className="app-logo" />
      </div>
      <div className="main-navbar-center">
        <span className="app-title">cfiles</span>
      </div>
      <div className="main-navbar-toggle">
        <DarkModeToggle onChange={toggleDarkMode} isDarkMode={isDarkMode} />
      </div>
    </div>
  </nav>
);

export default MainNavbar;
