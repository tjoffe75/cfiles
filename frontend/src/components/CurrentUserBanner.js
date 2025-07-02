import React, { useState, useEffect } from 'react';
import './CurrentUserBanner.css';

const CurrentUserBanner = () => {
    const [ssoEnabled, setSsoEnabled] = useState(true); // Assume true until checked
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSsoStatus = async () => {
            setIsLoading(true);
            try {
                const apiUrl = process.env.REACT_APP_API_URL || '';
                // Corrected endpoint to fetch simple SSO status
                const response = await fetch(`${apiUrl}/config/sso-status`);
                
                if (!response.ok) {
                    // If the endpoint fails, default to not showing the banner for safety.
                    setSsoEnabled(true); 
                    console.error('Failed to fetch SSO status, hiding banner as a precaution.');
                    return;
                }

                const data = await response.json();
                
                // The banner should ONLY appear when RBAC/SSO is explicitly disabled.
                setSsoEnabled(data.enabled === true);

            } catch (err) {
                console.error("Failed to fetch SSO settings:", err);
                // If there's a network error, assume SSO is on to be safe.
                setSsoEnabled(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSsoStatus();
    }, []);

    // Don't render anything while loading the setting
    if (isLoading) {
        return null;
    }

    // This is the core logic: only show the banner if SSO is NOT enabled.
    if (ssoEnabled) {
        return null;
    }

    // Render a clear warning banner when SSO is disabled.
    return (
        <div className="current-user-banner disabled">
            RBAC/SSO is disabled. The application is running in open mode.
        </div>
    );
};

export default CurrentUserBanner;
