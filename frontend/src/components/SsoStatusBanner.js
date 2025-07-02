import React from 'react';
import './SsoStatusBanner.css';

const SsoStatusBanner = ({ isEnabled }) => {
    // If SSO is enabled, we don't need to show the banner.
    if (isEnabled) {
        return null;
    }

    // Render the banner only when SSO is explicitly disabled.
    return (
        <div className="sso-status-banner disabled">
            RBAC/SSO is disabled. The application is running in open mode.
        </div>
    );
};

export default SsoStatusBanner;
