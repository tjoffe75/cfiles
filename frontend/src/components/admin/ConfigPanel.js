import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConfigPanel.css';

const ConfigPanel = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get('/api/config');
                setMaintenanceMode(response.data.maintenance_mode || false);
                setMaintenanceMessage(response.data.maintenance_message || '');
                setLoading(false);
            } catch (err) {
                setError('Failed to load configuration.');
                setLoading(false);
                console.error(err);
            }
        };
        fetchConfig();
    }, []);

    const handleSaveChanges = async () => {
        try {
            await axios.put('/api/config/maintenance_mode', { value: maintenanceMode });
            await axios.put('/api/config/maintenance_message', { value: maintenanceMessage });
            alert('Settings saved successfully!');
        } catch (err) {
            setError('Failed to update maintenance mode.');
            console.error(err);
        }
    };

    if (loading) {
        return <div>Loading configuration...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="config-panel">
            <h2>System Configuration</h2>
            <div className="config-item">
                <label htmlFor="maintenance-mode-toggle">Maintenance Mode</label>
                <label className="switch">
                    <input
                        id="maintenance-mode-toggle"
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
                <p className="description">
                    When enabled, file scanning is paused and a maintenance message is shown to users.
                </p>
            </div>
            <div className="config-item">
                <label htmlFor="maintenance-message-input">Maintenance Message</label>
                <input
                    id="maintenance-message-input"
                    type="text"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="E.g., System is down for maintenance."
                />
                <p className="description">
                    The message to display to users when maintenance mode is active.
                </p>
            </div>
            <button onClick={handleSaveChanges} className="save-button">Save Changes</button>
        </div>
    );
};

export default ConfigPanel;
