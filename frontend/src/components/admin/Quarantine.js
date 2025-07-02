import React, { useState, useEffect } from 'react';
import Card from './Card';
import './Quarantine.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Quarantine = () => {
    const [quarantinedFiles, setQuarantinedFiles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchQuarantinedFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/quarantine/`);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            setQuarantinedFiles(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuarantinedFiles();
    }, []);

    const handleAction = async (fileId, action) => {
        try {
            const response = await fetch(`${API_URL}/quarantine/${fileId}/action`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: action }), // action can be 'release' or 'delete'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${action} file.`);
            }
            // Refresh the list after action
            fetchQuarantinedFiles();
        } catch (err) {
            setError(err.message);
            console.error(`Failed to ${action} file:`, err);
        }
    };

    return (
        <div className="quarantine-page">
            <div className="quarantine-header">
                <h1 className="quarantine-title">Quarantined Files</h1>
                <button onClick={fetchQuarantinedFiles} disabled={loading} className="refresh-button">
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
            <Card>
                {error && <p className="error-message">Error: {error}</p>}
                {loading ? (
                    <p>Loading quarantined files...</p>
                ) : quarantinedFiles.length > 0 ? (
                    <table className="quarantine-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Quarantined At</th>
                                <th>Virus/Threat</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quarantinedFiles.map(file => (
                                <tr key={file.id}>
                                    <td>{file.filename}</td>
                                    <td>{new Date(file.quarantined_at).toLocaleString()}</td>
                                    <td>{file.scan_details}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleAction(file.id, 'release')} className="btn-release">Release</button>
                                            <button onClick={() => handleAction(file.id, 'delete')} className="btn-delete">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    !error && <p>No files in quarantine.</p>
                )}
            </Card>
        </div>
    );
};

export default Quarantine;
