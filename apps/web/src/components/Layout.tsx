import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { FloatingCircusDecorations } from './CircusNeonDecorations';

export const Layout: React.FC = () => {
  return (
    <div className="h-screen bg-dark flex flex-col overflow-hidden relative">
      {/* Floating circus decorations in background */}
      <FloatingCircusDecorations />

      {/* Contrast scrim: improves readability over decorations */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      
      {/* Main content - scrollable, content passes under navbar */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20 relative z-10">
        <Outlet />
      </main>
      
      {/* Bottom Navigation - Floating liquid glass */}
      <BottomNav />
    </div>
  );
};
