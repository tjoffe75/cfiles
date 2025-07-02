import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTachometerAlt, FaShieldVirus, FaClipboardList, FaCogs, FaTools } from 'react-icons/fa';
import './SideNav.css';

const SideNav = () => {
    const location = useLocation();
    return (
        <div className="side-nav">
            <h3>Admin Panel</h3>
            <ul className="main-menu">
                <li>
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        <FaHome className="nav-icon" /> <span className="nav-label">Home / Upload</span>
                    </Link>
                </li>
                <li>
                    <Link to="/admin/dashboard" className={location.pathname.startsWith('/admin') ? 'active' : ''}>
                        <FaTools className="nav-icon" /> <span className="nav-label">Admin</span>
                    </Link>
                    <ul className="admin-submenu">
                        <li><Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}><FaTachometerAlt className="nav-icon" /> <span className="nav-label">Dashboard</span></Link></li>
                        <li><Link to="/admin/quarantine" className={location.pathname === '/admin/quarantine' ? 'active' : ''}><FaShieldVirus className="nav-icon" /> <span className="nav-label">Quarantine</span></Link></li>
                        <li><Link to="/admin/logs" className={location.pathname === '/admin/logs' ? 'active' : ''}><FaClipboardList className="nav-icon" /> <span className="nav-label">Log Viewer</span></Link></li>
                        <li><Link to="/admin/config" className={location.pathname === '/admin/config' ? 'active' : ''}><FaCogs className="nav-icon" /> <span className="nav-label">Configuration</span></Link></li>
                    </ul>
                </li>
            </ul>
        </div>
    );
};

export default SideNav;
