import React, { useState, useEffect } from 'react';
import Card from './Card';
import './LogViewer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/logs/`);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="log-viewer">
        <div className="log-viewer-header">
            <h1 className="log-viewer-title">Application Logs</h1>
            <button onClick={fetchLogs} disabled={loading} className="refresh-button">
                {loading ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
        <Card>
            {error && <p className="error-message">Error fetching logs: {error}</p>}
            <pre className="log-container">
                {loading && !error ? (
                    <p>Loading logs...</p>
                ) : logs.length > 0 ? (
                    logs.map((log, index) => (
                        <div key={index} className={`log-entry log-${log.level.toLowerCase()}`}>
                            <span className="log-timestamp">{log.timestamp}</span>
                            <span className="log-level">{log.level}</span>
                            <span className="log-message">{log.message}</span>
                        </div>
                    ))
                ) : (
                    !error && <p>No logs found.</p>
                )}
            </pre>
        </Card>
    </div>
  );
}

export default LogViewer;
