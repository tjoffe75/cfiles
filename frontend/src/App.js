import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import DarkModeToggle from './components/DarkModeToggle';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleUploadSuccess = () => {
    // Increment the key to trigger a re-fetch in FileList
    setRefreshKey(oldKey => oldKey + 1);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="header-container">
            <h1 className="title">FILES - Secure File Scanner</h1>
            <div className="toggle-container">
                <DarkModeToggle onChange={toggleDarkMode} isDarkMode={isDarkMode} />
            </div>
        </div>
      <main>
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        <hr />
        <FileList key={refreshKey} />
      </main>
    </div>
  );
}

export default App;
