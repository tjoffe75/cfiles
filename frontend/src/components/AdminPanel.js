import React, { useState, useEffect } from 'react';
import LogViewer from './LogViewer';
import Quarantine from './Quarantine';
import ConfigPanel from './ConfigPanel';

const AdminPanel = () => {
    const [logs, setLogs] = useState([]);
    const [quarantinedFiles, setQuarantinedFiles] = useState([]);

    useEffect(() => {
        // Fetch initial data
        fetchLogs();
        fetchQuarantinedFiles();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs/realtime');
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const fetchQuarantinedFiles = async () => {
        try {
            const response = await fetch('/api/quarantine/files');
            const data = await response.json();
            setQuarantinedFiles(data);
        } catch (error) {
            console.error('Error fetching quarantined files:', error);
        }
    };

    const handleAction = async (fileId, action) => {
        try {
            const response = await fetch(`/api/quarantine/files/${fileId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });
            if (response.ok) {
                fetchQuarantinedFiles(); // Refresh the list
            } else {
                console.error('Error performing action on quarantined file');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="admin-panel">
            <h2>Admin Panel</h2>
            <LogViewer logs={logs} />
            <Quarantine quarantinedFiles={quarantinedFiles} onAction={handleAction} />
            <ConfigPanel />
        </div>
    );
};

export default AdminPanel;
