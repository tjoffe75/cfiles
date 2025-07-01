import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ConfigPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SSO_KEYS = [
    'RBAC_SSO_ENABLED',
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
        fetchSettings();
        fetchSsoStatus();
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

    const validateSetting = (setting, value) => {
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

    if (loading) return <div>Loading configuration...</div>;
    if (error) return <div className="error-message">{error}</div>;

    // Gruppera inställningar
    const ssoSettings = settings.filter(s => SSO_KEYS.includes(s.key));
    const otherSettings = settings.filter(s => !SSO_KEYS.includes(s.key));

    // Hitta RBAC_SSO_ENABLED setting
    const ssoEnabledSetting = ssoSettings.find(s => s.key === 'RBAC_SSO_ENABLED');
    const ssoEnabled = ssoEnabledSetting ? editValues[ssoEnabledSetting.id] === 'true' : false;

    return (
        <div className="config-panel">
            <h2>System Configuration</h2>
            {/* SSO/RBAC-banner visas endast när RBAC/SSO är avslaget */}
            {!ssoEnabled && (
                <div className="dev-warning-banner">
                    <b>SSO/RBAC är AV (Utvecklingsläge):</b> Applikationen är inte skyddad av AD/SSO. Alla användare har full åtkomst.
                </div>
            )}
            <div className="config-section">
                <h3>AD/SSO Settings</h3>
                <div className="config-list">
                    {ssoSettings.map(setting => (
                        <div className="config-item" key={setting.id}>
                            <label title={setting.description || ''}>{setting.key}</label>
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
                            {setting.description && (
                                <div className="setting-description">{setting.description}</div>
                            )}
                            {setting.key !== 'RBAC_SSO_ENABLED' && (
                                validateSetting(setting, editValues[setting.id]) &&
                                <div className="error-message" style={{marginTop:4,marginBottom:4}}>
                                    {validateSetting(setting, editValues[setting.id])}
                                </div>
                            )}
                            <button className="save-button" onClick={() => handleSave(setting)} disabled={saving || (setting.key !== 'RBAC_SSO_ENABLED' && (!ssoEnabled || !!validateSetting(setting, editValues[setting.id])))}>
                                Save
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="config-section">
                <h3>Other Settings</h3>
                <div className="config-list">
                    {otherSettings.map(setting => (
                        <div className="config-item" key={setting.id}>
                            <label title={setting.description || ''}>{setting.key}</label>
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
                            {setting.description && (
                                <div className="setting-description">{setting.description}</div>
                            )}
                            <button className="save-button" onClick={() => handleSave(setting)} disabled={saving}>
                                Save
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConfigPanel;
