import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { FloatingCircusDecorations } from './CircusNeonDecorations';
import { useGame } from '../context/GameContext';

export const Layout: React.FC = () => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { refreshData } = useGame();

  const [isPulling, setIsPulling] = useState(false);
  const [pullPx, setPullPx] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartYRef = useRef<number | null>(null);

  const thresholds = useMemo(() => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    // "più dello schermo" è un gesto forte: usiamo una soglia robusta ma raggiungibile
    const trigger = Math.min(220, Math.round(h * 0.22));
    const max = Math.min(260, Math.round(h * 0.30));
    return { trigger, max };
  }, []);

  const findScrollableParent = (el: HTMLElement | null, stopAt: HTMLElement) => {
    let cur: HTMLElement | null = el;
    while (cur && cur !== stopAt) {
      const style = window.getComputedStyle(cur);
      const overflowY = style.overflowY;
      const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight + 4;
      if (canScroll) return cur;
      cur = cur.parentElement;
    }
    return stopAt;
  };

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
      {/* Pull-to-refresh indicator */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex justify-center pt-safe">
        {(isPulling || isRefreshing) && (
          <div className="mt-2 px-3 py-2 rounded-2xl glass-strong border border-white/10 text-[11px] text-gray-200 flex items-center gap-2">
            <div
              className={`w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={!isRefreshing ? { transform: `rotate(${Math.min(180, (pullPx / thresholds.trigger) * 180)}deg)` } : undefined}
            />
            <span>
              {isRefreshing
                ? 'Aggiorno…'
                : pullPx >= thresholds.trigger
                  ? 'Rilascia per aggiornare'
                  : 'Trascina giù per aggiornare'}
            </span>
          </div>
        )}
      </div>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto scrollbar-hide pb-20 relative z-10"
        onTouchStart={(e) => {
          if (isRefreshing) return;
          const main = mainRef.current;
          if (!main) return;

          const target = e.target as HTMLElement | null;
          const scrollParent = findScrollableParent(target, main);

          // Avvia solo se siamo davvero in cima (main e l'eventuale scroller interno)
          const mainAtTop = main.scrollTop <= 0;
          const parentAtTop = scrollParent === main ? true : scrollParent.scrollTop <= 0;
          if (!mainAtTop || !parentAtTop) return;

          pullStartYRef.current = e.touches[0].clientY;
          setIsPulling(true);
          setPullPx(0);
        }}
        onTouchMove={(e) => {
          if (!isPulling || pullStartYRef.current == null) return;
          const dy = e.touches[0].clientY - pullStartYRef.current;
          if (dy <= 0) {
            setPullPx(0);
            return;
          }
          setPullPx(Math.min(thresholds.max, Math.round(dy)));
        }}
        onTouchEnd={async () => {
          if (!isPulling) return;
          const shouldRefresh = pullPx >= thresholds.trigger;
          setIsPulling(false);
          pullStartYRef.current = null;

          if (!shouldRefresh || isRefreshing) {
            setPullPx(0);
            return;
          }

          try {
            setIsRefreshing(true);
            await refreshData();
          } finally {
            setIsRefreshing(false);
            setPullPx(0);
          }
        }}
        onTouchCancel={() => {
          setIsPulling(false);
          pullStartYRef.current = null;
          setPullPx(0);
        }}
      >
        <Outlet />
      </main>
      
      {/* Bottom Navigation - Floating liquid glass */}
      <BottomNav />
    </div>
  );
};
