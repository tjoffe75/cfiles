import React, { useState, useEffect } from 'react';
import './LogViewer.css';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/logs')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setLogs(data))
      .catch(error => {
        console.error('Fetch error:', error);
        setError(error.message);
      });
  }, []);

  return (
    <div>
      <h2>Application Logs</h2>
      {error && <p className="error">Error fetching logs: {error}</p>}
      <pre className="log-container">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className={`log-entry log-${log.level}`}>
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-level">{log.level}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        ) : (
          !error && <p>No logs found.</p>
        )}
      </pre>
    </div>
  );
}

export default LogViewer;
