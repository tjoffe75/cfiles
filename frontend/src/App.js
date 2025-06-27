import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import DarkModeToggle from './components/DarkModeToggle';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import LogViewer from './components/admin/LogViewer';
import Quarantine from './components/admin/Quarantine';
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
    <Router>
      <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className="header-container">
              <h1 className="title">FILES - Secure File Scanner</h1>
              <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/admin/dashboard">Admin</Link>
              </div>
              <div className="toggle-container">
                  <DarkModeToggle onChange={toggleDarkMode} isDarkMode={isDarkMode} />
              </div>
          </div>
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <FileUpload onUploadSuccess={handleUploadSuccess} />
                <hr />
                <FileList key={refreshKey} />
              </>
            } />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quarantine" element={<Quarantine />} />
              <Route path="logs" element={<LogViewer />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
