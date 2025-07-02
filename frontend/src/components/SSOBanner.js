import React, { useState, useEffect } from 'react';
import './SSOBanner.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const SSOBanner = () => {
    const [ssoConfig, setSsoConfig] = useState({});

    useEffect(() => {
        const fetchSSOConfig = async () => {
            try {
                const response = await fetch(`${API_URL}/api/sso-config`);
                if (response.ok) {
                    const data = await response.json();
                    setSsoConfig(data);
                } else {
                    setSsoConfig({});
                }
            } catch (error) {
                setSsoConfig({});
            }
        };

        fetchSSOConfig();
    }, []);

    if (ssoConfig.enabled) return null;
    return (
        <div className="sso-banner">
            <span className="sso-icon" role="img" aria-label="info">ℹ️</span>
            SSO/RBAC is <b>OFF</b> (Development mode): The application is not protected by AD/SSO. All users have full access.
        </div>
    );
};

export default SSOBanner;
