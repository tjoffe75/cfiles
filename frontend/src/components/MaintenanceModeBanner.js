import React from 'react';
import './MaintenanceModeBanner.css';

const MaintenanceModeBanner = ({ isActive }) => {
    if (!isActive) {
        return null;
    }

    return (
        <div className="maintenance-mode-banner">
            <div className="maintenance-mode-banner-content">
                <p><strong>Maintenance Mode is ON.</strong> The application is currently undergoing maintenance. Users may experience disruptions.</p>
            </div>
        </div>
    );
};

export default MaintenanceModeBanner;
