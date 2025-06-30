import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SideNav = () => {
    const location = useLocation();
    return (
        <div className="side-nav">
            <h3>Filesapp</h3>
            <ul className="main-menu">
                <li>
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        <span role="img" aria-label="Home">🏠</span> <span className="nav-label">Home / Upload</span>
                    </Link>
                </li>
                <li>
                    <Link to="/admin/dashboard" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
                        <span role="img" aria-label="Admin">🛠️</span> <span className="nav-label">Admin</span>
                    </Link>
                    <ul className="admin-submenu">
                        <li><Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}><span role="img" aria-label="Dashboard">📊</span> <span className="nav-label">Dashboard</span></Link></li>
                        <li><Link to="/admin/quarantine" className={location.pathname === '/admin/quarantine' ? 'active' : ''}><span role="img" aria-label="Quarantine">🦠</span> <span className="nav-label">Quarantine</span></Link></li>
                        <li><Link to="/admin/logs" className={location.pathname === '/admin/logs' ? 'active' : ''}><span role="img" aria-label="Log Viewer">📜</span> <span className="nav-label">Log Viewer</span></Link></li>
                        <li><Link to="/admin/config" className={location.pathname === '/admin/config' ? 'active' : ''}><span role="img" aria-label="Config">⚙️</span> <span className="nav-label">Configuration</span></Link></li>
                    </ul>
                </li>
            </ul>
        </div>
    );
};

export default SideNav;
