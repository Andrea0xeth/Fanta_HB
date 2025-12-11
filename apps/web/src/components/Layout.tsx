import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
  return (
    <div className="h-screen bg-dark flex flex-col overflow-hidden">
      {/* Main content - no scroll, uses flex */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
