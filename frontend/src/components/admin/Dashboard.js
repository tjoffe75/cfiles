import React from 'react';

const Dashboard = () => {
    return (
        <div className="admin-dashboard-content">
            <h2>Admin Dashboard</h2>
            <p>Welcome to the admin dashboard. System overview will be displayed here.</p>
            {/* Placeholder for KPI cards */}
            <div className="kpi-cards">
                <div className="card">
                    <h3>Total Scans</h3>
                    <p>1,234</p>
                </div>
                <div className="card">
                    <h3>Infected Files</h3>
                    <p>56</p>
                </div>
                <div className="card">
                    <h3>System Status</h3>
                    <p>All systems operational</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
