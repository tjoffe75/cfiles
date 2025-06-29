import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import DarkModeToggle from './components/DarkModeToggle';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import LogViewer from './components/admin/LogViewer';
import Quarantine from './components/admin/Quarantine';
import ConfigPanel from './components/admin/ConfigPanel';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  // useRef to hold the WebSocket instance and timers to prevent re-renders from affecting them
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  const fetchFiles = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/files/`);
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
    fetchFiles(); // Initial fetch of all files

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/status';
    let retryCount = 0;

    const connect = () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket is already connected.");
        return;
      }

      console.log("Attempting to connect WebSocket...");
      setWsStatus('Connecting...');
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
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

        console.log('WebSocket message received:', messageData);
        
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
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            fetch(`${apiUrl}/files/`)
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

      ws.current.onclose = () => {
        console.log('WebSocket disconnected.');
        setWsStatus('Disconnected. Reconnecting...');
        
        // Exponential backoff for reconnection
        const delay = Math.min(1000 * (2 ** retryCount), 30000); // Max 30 seconds
        retryCount++;
        
        console.log(`Will attempt to reconnect in ${delay / 1000} seconds.`);
        reconnectTimer.current = setTimeout(connect, delay);
      };
    };

    connect();

    // Cleanup function on component unmount
    return () => {
      console.log("Cleaning up WebSocket connection.");
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleUploadSuccess = (newFile) => {
    // No longer need to call fetchFiles(). 
    // The WebSocket message will handle adding the new file to the list.
    console.log('Upload successful for:', newFile.filename);
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

  return (
    <Router>
      <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className="header-container">
              <h1 className="title">cfiles</h1>
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
                <FileList files={files} error={error} />
              </>
            } />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quarantine" element={<Quarantine />} />
              <Route path="logs" element={<LogViewer />} />
              <Route path="config" element={<ConfigPanel />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
