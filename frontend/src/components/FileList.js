import React, { useState, useEffect } from 'react';

const FileList = ({ refreshKey }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/files/');
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

    fetchFiles();

    let ws;
    let connectInterval;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/status');

      ws.onopen = () => {
        console.log('WebSocket connected');
        setError(null); // Clear any previous error
        // Clear reconnect interval on successful connection
        if (connectInterval) {
          clearInterval(connectInterval);
          connectInterval = null;
        }
      };

      ws.onmessage = (event) => {
        if (event.data === 'ping') {
          // This is a keep-alive message, ignore it.
          return;
        }
        console.log('WebSocket message received:', event.data);
        const message = JSON.parse(event.data);
        setFiles(prevFiles =>
          prevFiles.map(file => {
            if (file.id === message.file_id) {
              const updatedFile = {
                ...file,
                scan_status: message.status,
                scan_details: message.details,
              };
              if (message.checksum) {
                updatedFile.checksum = message.checksum;
              }
              return updatedFile;
            }
            return file;
          })
        );
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error.');
        ws.close(); // Close the connection on error to trigger onclose
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        // Set up a reconnect interval if not already set
        if (!connectInterval) {
          connectInterval = setInterval(() => {
            connect();
          }, 3000); // Try to reconnect every 3 seconds
        }
      };
    };

    connect(); // Initial connection attempt

    // Clean up the WebSocket connection and interval when the component unmounts
    return () => {
      if (ws) {
        ws.close();
      }
      if (connectInterval) {
        clearInterval(connectInterval);
      }
    };
  }, [refreshKey]); // Re-run effect if refreshKey changes

  const getStatusClass = (status) => {
    switch (status) {
      case 'clean':
        return 'status-clean';
      case 'infected':
        return 'status-infected';
      case 'scanning':
        return 'status-scanning';
      case 'pending':
        return 'status-pending';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  return (
    <div className="file-list">
      <h2>Uploaded Files</h2>
      {error && <p className="error-message">Error fetching files: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Status</th>
            <th>Checksum</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.filename}</td>
              <td className={getStatusClass(file.scan_status)}>
                {file.scan_status}
              </td>
              <td>{file.checksum}</td>
              <td>
                {file.scan_status === 'clean' && (
                  <a href={`http://localhost:8000/download/${file.id}`} download>
                    Download
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
