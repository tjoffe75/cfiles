import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';

const AdminLayout = () => {
    return (
        <div className="admin-layout">
            <SideNav />
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
