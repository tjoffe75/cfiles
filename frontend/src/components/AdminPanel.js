import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [logs, setLogs] = useState([]);
  const [quarantinedFiles, setQuarantinedFiles] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchQuarantinedFiles();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:8000/logs/realtime');
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchQuarantinedFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/quarantine/files');
      const data = await response.json();
      setQuarantinedFiles(data.quarantined_files);
    } catch (error) {
      console.error('Error fetching quarantined files:', error);
    }
  };

  const handleReleaseFile = async (fileId) => {
    try {
      const response = await fetch(`http://localhost:8000/quarantine/files/${fileId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('File released successfully!');
        fetchQuarantinedFiles();
      } else {
        alert('Failed to release file.');
      }
    } catch (error) {
      console.error('Error releasing file:', error);
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>

      <section>
        <h3>Logs</h3>
        <ul>
          {logs.map((log, index) => (
            <li key={index}>{log}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Quarantined Files</h3>
        <ul>
          {quarantinedFiles.map((file, index) => (
            <li key={index}>
              {file} <button onClick={() => handleReleaseFile(file)}>Release</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminPanel;
