import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const EmployeeDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (Fixed position logic is usually inside the component) */}
      <Sidebar />

      {/* Main Content Wrapper */}
      {/* 1. flex-1: Takes up all remaining width next to sidebar */}
      {/* 2. overflow-y-auto: Allows THIS area to scroll independently */}
      {/* 3. relative: Helps with positioning dropdowns/modals inside */}
      <main className="flex-1 overflow-y-auto h-full relative">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeDashboard;