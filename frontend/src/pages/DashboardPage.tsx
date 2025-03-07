import React from 'react';
import SidebarComponent from "../components/SidebarComponent.tsx";

const DashboardPage: React.FC = () => {
    return (
        <div className="flex min-h-screen">
            <div className="">
                <SidebarComponent/>
            </div>
            <div>
                <p>The place for the dashboard page.</p>
            </div>
        </div>

    );
};

export default DashboardPage