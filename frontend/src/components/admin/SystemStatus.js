import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

function SystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // In a real application, you would fetch this from your backend API
        // For now, we'll use mock data and simulate a network request
        const mockStatus = {
          database: 'Connected',
          clamav: 'Connected',
          rabbitmq: 'Connected',
          uptime: '12d 4h 32m',
          scannedFiles: 12345,
          quarantinedFiles: 67
        };
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        setStatus(mockStatus);
      } catch (err) {
        setError('Failed to fetch system status. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return <div className="loading">Loading system status...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="system-status-container">
      <h2>System Status</h2>
      <div className="status-grid">
        <div className="status-item">
          <span className="status-label">Database:</span>
          <span className={`status-value ${status?.database?.toLowerCase()}`}>{status?.database}</span>
        </div>
        <div className="status-item">
          <span className="status-label">ClamAV:</span>
          <span className={`status-value ${status?.clamav?.toLowerCase()}`}>{status?.clamav}</span>
        </div>
        <div className="status-item">
          <span className="status-label">RabbitMQ:</span>
          <span className={`status-value ${status?.rabbitmq?.toLowerCase()}`}>{status?.rabbitmq}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Uptime:</span>
          <span className="status-value">{status?.uptime}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Total Files Scanned:</span>
          <span className="status-value">{status?.scannedFiles}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Files in Quarantine:</span>
          <span className="status-value">{status?.quarantinedFiles}</span>
        </div>
      </div>
    </div>
  );
}

export default SystemStatus;
