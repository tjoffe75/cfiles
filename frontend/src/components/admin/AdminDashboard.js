import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <nav className="admin-nav">
        <ul className="admin-menu">
          <li><Link to="/admin/status" className="admin-link">System Status</Link></li>
          <li><Link to="/admin/logs" className="admin-link">View Logs</Link></li>
          <li><Link to="/admin/quarantine" className="admin-link">Manage Quarantine</Link></li>
        </ul>
      </nav>
    </div>
  );
}

export default AdminDashboard;
