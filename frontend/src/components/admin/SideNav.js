import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SideNav = () => {
    const location = useLocation();
    return (
        <div className="side-nav">
            <h3>Admin Menu</h3>
            <ul className="admin-menu">
                <li><Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}>📊 Dashboard</Link></li>
                <li><Link to="/admin/quarantine" className={location.pathname === '/admin/quarantine' ? 'active' : ''}>🦠 Quarantine</Link></li>
                <li><Link to="/admin/logs" className={location.pathname === '/admin/logs' ? 'active' : ''}>📜 Log Viewer</Link></li>
                <li><Link to="/admin/config" className={location.pathname === '/admin/config' ? 'active' : ''}>⚙️ Configuration</Link></li>
                <hr />
                <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>⬅️ Back to Upload</Link></li>
            </ul>
        </div>
    );
};

export default SideNav;
