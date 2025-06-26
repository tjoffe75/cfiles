import React from 'react';
import './DarkModeToggle.css';

const DarkModeToggle = ({ onChange, isDarkMode }) => {
  return (
    <label className="switch">
      <input type="checkbox" onChange={onChange} checked={isDarkMode} />
      <span className="slider round"></span>
    </label>
  );
};

export default DarkModeToggle;
