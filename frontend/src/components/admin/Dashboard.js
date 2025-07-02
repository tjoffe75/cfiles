import React from 'react';
import Card from './Card';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="admin-dashboard">
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Welcome to the admin dashboard. System overview will be displayed here.</p>
            
            <div className="dashboard-cards-grid">
                <Card title="Total Scans">
                    <p className="kpi-metric">1,234</p>
                </Card>
                
                <Card title="Infected Files">
                    <p className="kpi-metric">56</p>
                </Card>
                
                <Card title="System Status">
                    <p className="status-ok">All systems operational</p>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
