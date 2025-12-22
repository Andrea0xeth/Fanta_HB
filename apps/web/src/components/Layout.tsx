import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { FloatingCircusDecorations } from './CircusNeonDecorations';

export const Layout: React.FC = () => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top when route changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="h-screen bg-dark flex flex-col overflow-hidden relative">
      {/* Floating circus decorations in background */}
      <FloatingCircusDecorations />
      
      {/* Main content - scrollable, content passes under navbar */}
      <main ref={mainRef} className="flex-1 overflow-y-auto scrollbar-hide pb-20 relative z-10">
        <Outlet />
      </main>
      
      {/* Bottom Navigation - Floating liquid glass */}
      <BottomNav />
    </div>
  );
};
