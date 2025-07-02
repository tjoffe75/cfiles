import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'; // Import Link
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import DarkModeToggle from './components/DarkModeToggle';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import LogViewer from './components/admin/LogViewer';
import Quarantine from './components/admin/Quarantine';
import ConfigPanel from './components/admin/ConfigPanel';
import SsoStatusBanner from './components/SsoStatusBanner'; // Corrected import
import MaintenanceModeBanner from './components/MaintenanceModeBanner';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [wsStatus, setWsStatus] = useState('Connecting...');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isSsoEnabled, setIsSsoEnabled] = useState(true); // Centralized state for SSO
  const [bannerHeight, setBannerHeight] = useState(0);

  // useRef to hold the WebSocket instance and timers to prevent re-renders from affecting them
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const bannersRef = useRef(null); // Ref for the banners container

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      setError(error.message);
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
        try {
            const response = await fetch(`/api/config/maintenance-mode`);
            if (response.ok) {
                const data = await response.json();
                setIsMaintenanceMode(data.maintenance_mode);
            }
        } catch (error) {
            console.error('Failed to fetch maintenance status:', error);
        }
    };

    const fetchSsoStatus = async () => {
      try {
        const response = await fetch(`/api/config/sso-status`);
        if (response.ok) {
          const data = await response.json();
          setIsSsoEnabled(data.sso_enabled);
        } else {
          setIsSsoEnabled(false);
        }
      } catch (error) {
        console.error('Failed to fetch SSO status:', error);
        setIsSsoEnabled(false);
      }
    };

    fetchMaintenanceStatus();
    fetchSsoStatus();

    // Poll for status updates every 5 seconds
    const intervalId = setInterval(() => {
        fetchMaintenanceStatus();
        fetchSsoStatus();
    }, 5000); // 5000 ms = 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchFiles(); // Initial fetch of all files

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/status`;
    let retryCount = 0;

    const connect = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // WebSocket is already connected.
        return;
      }

      // console.log("Attempting to connect WebSocket...");
      setWsStatus('Connecting...');
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        // console.log('WebSocket connected');
        setWsStatus('Connected');
        setError(null);
        retryCount = 0; // Reset retry count on successful connection
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        const messageData = JSON.parse(event.data);

        // Handle ping-pong to keep the connection alive
        if (messageData.type === 'ping') {
          console.debug('Ping received, sending pong.');
          ws.current.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // console.log('WebSocket message received:', messageData);
        
        setFiles(prevFiles => {
          const filesMap = new Map(prevFiles.map(f => [f.id, f]));
          const updatedFile = {
            ...(filesMap.get(messageData.file_id) || { id: messageData.file_id }),
            scan_status: messageData.status,
            scan_details: messageData.details,
            checksum: messageData.checksum,
          };
          filesMap.set(messageData.file_id, updatedFile);

          // If it's a new file, we might not have all details (like filename)
          // A robust way is to re-fetch the full file info
          if (!prevFiles.some(f => f.id === messageData.file_id)) {
            fetch(`/api/files/`)
              .then(res => res.json())
              .then(allFiles => setFiles(allFiles))
              .catch(err => console.error("Failed to re-fetch files after update:", err));
          }

          return Array.from(filesMap.values()).sort((a, b) => (a.id < b.id) ? 1 : -1);
        });
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error. Check console for details.');
        // onclose will be called next
      };

      ws.current.onclose = (event) => {
        // console.log('WebSocket disconnected.');
        setWsStatus('Disconnected. Reconnecting...');
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * (2 ** retryCount), 30000); // Max 30 seconds
        retryCount++;
        
        // console.log(`Will attempt to reconnect in ${delay / 1000} seconds.`);
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    connect();

    // Cleanup function on component unmount
    return () => {
      // console.log("Cleaning up WebSocket connection.");
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // This effect observes the height of the banners container and updates the header accordingly
  useEffect(() => {
    const bannerElement = bannersRef.current;
    if (!bannerElement) return;

    const resizeObserver = new ResizeObserver(() => {
      setBannerHeight(bannerElement.offsetHeight);
    });

    resizeObserver.observe(bannerElement);

    return () => resizeObserver.disconnect(); // Clean up observer on unmount
  }, []); // Runs once on mount

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleUploadSuccess = (newFile) => {
    // No longer need to call fetchFiles(). 
    // The WebSocket message will handle adding the new file to the list.
    // console.log('Upload successful for:', newFile.filename);
  };

  const transformStatusUpdate = (update) => {
    // Transforms a WebSocket status message to match the file object structure
    return {
      scan_status: update.status,
      scan_details: update.details,
      checksum: update.checksum || null,
    };
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const mainContent = (
    <div className="main-content">
      <Routes>
        {/* Route for the main file upload/file list view */}
        <Route path="/" element={
          <div className="upload-area-container">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            <FileList files={files} error={error} />
          </div>
        } />

        {/* Routes for the admin panel */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="logs" element={<LogViewer />} />
          <Route path="quarantine" element={<Quarantine />} />
          <Route path="config" element={<ConfigPanel />} />
        </Route>
      </Routes>
    </div>
  );

  return (
    <Router>
      <div className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="app-banners" ref={bannersRef}>
          <SsoStatusBanner isEnabled={isSsoEnabled} />
          {isMaintenanceMode && <MaintenanceModeBanner isActive={isMaintenanceMode} />}
        </div>
        <header className="app-header" style={{ top: bannerHeight }}>
          <div className="header-left">
            <img src="/logo-placeholder.svg" alt="Logo" className="logo" />
          </div>
          <div className="header-center">
            <h1 className="app-title">cfiles</h1>
          </div>
          <div className="header-right">
            <Link to="/admin" className="admin-link">Admin</Link>
            <DarkModeToggle onChange={toggleDarkMode} isDarkMode={isDarkMode} />
          </div>
        </header>
        <div className="app-content">
          {mainContent}
        </div>
      </div>
    </Router>
  );
}

export default App;
