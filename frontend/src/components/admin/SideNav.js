import React from 'react';
import { Link } from 'react-router-dom';

const SideNav = () => {
    return (
        <div className="side-nav">
            <h3>Admin Menu</h3>
            <ul>
                <li><Link to="/admin/dashboard">Dashboard</Link></li>
                <li><Link to="/admin/quarantine">Quarantine</Link></li>
                <li><Link to="/admin/logs">Log Viewer</Link></li>
                <li><Link to="/admin/config">Configuration</Link></li>
                <hr />
                <li><Link to="/">Back to Upload</Link></li>
            </ul>
        </div>
    );
};

export default SideNav;
