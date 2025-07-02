import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card'; // Import the Card component
import './ConfigPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SSO_KEYS = [
    'RBAC_SSO_ENABLED',
    'SHOW_CURRENT_USER_IN_ADMIN',
    'AD_ENDPOINT',
    'AD_CLIENT_ID',
    'AD_CLIENT_SECRET',
    'AD_GROUP_USERS',
    'AD_GROUP_ADMINS',
];

const ConfigPanel = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editValues, setEditValues] = useState({});
    const [ssoStatus, setSsoStatus] = useState({ enabled: false });
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maintenanceLoading, setMaintenanceLoading] = useState(true);
    const [maintenanceSaving, setMaintenanceSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_URL}/config/system-settings`);
                setSettings(response.data);
                // Prepare edit values
                const values = {};
                response.data.forEach(s => { values[s.id] = s.value; });
                setEditValues(values);
                setLoading(false);
            } catch (err) {
                setError('Failed to load configuration.');
                setLoading(false);
                console.error(err);
            }
        };
        const fetchSsoStatus = async () => {
            try {
                const resp = await axios.get(`${API_URL}/config/sso-status`);
                setSsoStatus(resp.data);
            } catch (e) {
                setSsoStatus({ enabled: false });
            }
        };
        const fetchMaintenance = async () => {
            try {
                const resp = await axios.get(`${API_URL}/config/maintenance-mode`);
                setMaintenanceMode(resp.data.maintenance_mode);
            } catch (e) {
                setMaintenanceMode(false);
            }
            setMaintenanceLoading(false);
        };
        fetchSettings();
        fetchSsoStatus();
        fetchMaintenance();
    }, []);

    const handleChange = (id, value) => {
        setEditValues(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (setting) => {
        setSaving(true);
        try {
            await axios.put(`${API_URL}/config/system-settings/${setting.id}`, {
                key: setting.key,
                value: editValues[setting.id]
            });
            alert('Setting saved!');
        } catch (err) {
            setError('Failed to save setting.');
            console.error(err);
        }
        setSaving(false);
    };

    const handleMaintenanceToggle = async () => {
        setMaintenanceSaving(true);
        try {
            const resp = await axios.post(`${API_URL}/config/maintenance-mode`, { enabled: !maintenanceMode });
            setMaintenanceMode(resp.data.maintenance_mode);
        } catch (e) {
            setError('Failed to update maintenance mode.');
        }
        setMaintenanceSaving(false);
    };

    const validateSetting = (setting, value) => {
        const ssoEnabledSetting = settings.find(s => s.key === 'RBAC_SSO_ENABLED');
        const ssoEnabled = ssoEnabledSetting && editValues[ssoEnabledSetting.id] === 'true';

        if (setting.key === 'AD_ENDPOINT' && ssoEnabled) {
            try {
                if (!value) return 'Endpoint krävs när SSO är på.';
                new URL(value);
            } catch {
                return 'Ogiltig URL.';
            }
        }
        if ((setting.key === 'AD_CLIENT_ID' || setting.key === 'AD_CLIENT_SECRET') && ssoEnabled) {
            if (!value) return 'Fältet krävs när SSO är på.';
        }
        if ((setting.key === 'AD_GROUP_USERS' || setting.key === 'AD_GROUP_ADMINS') && ssoEnabled) {
            if (!value) return 'Gruppnamn krävs när SSO är på.';
        }
        return '';
    };

    const ssoSettings = settings.filter(s => SSO_KEYS.includes(s.key));
    const otherSettings = settings.filter(s => !SSO_KEYS.includes(s.key) && s.key !== 'MAINTENANCE_MODE');
    const ssoEnabledSetting = settings.find(s => s.key === 'RBAC_SSO_ENABLED');
    const ssoEnabled = ssoEnabledSetting && editValues[ssoEnabledSetting.id] === 'true';

    if (loading) return <div>Loading configuration...</div>;
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="config-panel">
            <h1 className="config-title">Configuration</h1>
            {error && <div className="error-message">{error}</div>}

            <Card title="Maintenance Mode">
                {maintenanceLoading ? (
                    <div>Loading maintenance mode...</div>
                ) : (
                    <div className="config-item">
                        <label title="Enable/disable maintenance mode">MAINTENANCE_MODE</label>
                        <div className="config-control">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={maintenanceMode}
                                    onChange={handleMaintenanceToggle}
                                    disabled={maintenanceSaving}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span className="switch-status">{maintenanceMode ? 'ON' : 'OFF'}</span>
                        </div>
                    </div>
                )}
            </Card>

            <Card title="AD/SSO Settings">
                <div className="config-list">
                    {ssoSettings.map(setting => (
                        <div className="config-item" key={setting.id}>
                            <div className="config-item-details">
                                <label title={setting.description || ''}>{setting.key}</label>
                                {setting.description && (
                                    <div className="setting-description">{setting.description}</div>
                                )}
                                {setting.key !== 'RBAC_SSO_ENABLED' && validateSetting(setting, editValues[setting.id]) &&
                                    <div className="error-message">
                                        {validateSetting(setting, editValues[setting.id])}
                                    </div>
                                }
                            </div>
                            <div className="config-control">
                                {setting.key === 'RBAC_SSO_ENABLED' ? (
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={editValues[setting.id] === 'true'}
                                            onChange={e => handleChange(setting.id, e.target.checked ? 'true' : 'false')}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                ) : (
                                    <input
                                        type="text"
                                        value={editValues[setting.id] || ''}
                                        onChange={e => handleChange(setting.id, e.target.value)}
                                        placeholder={setting.description || ''}
                                        disabled={!ssoEnabled}
                                    />
                                )}
                                <button className="save-button" onClick={() => handleSave(setting)} disabled={saving || (setting.key !== 'RBAC_SSO_ENABLED' && (!ssoEnabled || !!validateSetting(setting, editValues[setting.id])))}>
                                    Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Other Settings">
                <div className="config-list">
                    {otherSettings.map(setting => (
                        <div className="config-item" key={setting.id}>
                            <div className="config-item-details">
                                <label title={setting.description || ''}>{setting.key}</label>
                                {setting.description && (
                                    <div className="setting-description">{setting.description}</div>
                                )}
                            </div>
                            <div className="config-control">
                                {setting.value === 'true' || setting.value === 'false' ? (
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={editValues[setting.id] === 'true'}
                                            onChange={e => handleChange(setting.id, e.target.checked ? 'true' : 'false')}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                ) : (
                                    <input
                                        type="text"
                                        value={editValues[setting.id] || ''}
                                        onChange={e => handleChange(setting.id, e.target.value)}
                                        placeholder={setting.description || ''}
                                    />
                                )}
                                <button className="save-button" onClick={() => handleSave(setting)} disabled={saving}>
                                    Save
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default ConfigPanel;
