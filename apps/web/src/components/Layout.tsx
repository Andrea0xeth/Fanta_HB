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
  const animationFrameRef = useRef<number | null>(null);

  const thresholds = useMemo(() => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    // Soglia molto più bassa e resistenza elastica
    const trigger = Math.min(80, Math.round(h * 0.10));
    const max = Math.min(100, Math.round(h * 0.12));
    return { trigger, max };
  }, []);

  // Funzione per calcolare la resistenza elastica
  const calculateElasticPull = (dy: number): number => {
    if (dy <= thresholds.trigger) {
      return dy;
    }
    // Resistenza elastica dopo la soglia
    const excess = dy - thresholds.trigger;
    const resistance = 0.3; // 30% del movimento in eccesso
    return thresholds.trigger + (excess * resistance);
  };

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

  // Verifica se l'elemento è dentro un modale
  const isInsideModal = (el: HTMLElement | null): boolean => {
    let cur: HTMLElement | null = el;
    while (cur) {
      const zIndex = window.getComputedStyle(cur).zIndex;
      const zIndexNum = parseInt(zIndex, 10);
      // I modali hanno generalmente z-index >= 50
      if (!isNaN(zIndexNum) && zIndexNum >= 50) {
        return true;
      }
      // Controlla anche le classi comuni dei modali
      if (cur.classList.contains('fixed') && (cur.classList.contains('inset-0') || cur.classList.contains('z-50') || cur.classList.contains('z-[50]'))) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
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
      
      {/* Pull-to-refresh indicator - FUORI dal contenuto scrollabile, sopra l'header */}
      {pullPx > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-30 flex justify-center pt-safe pointer-events-none"
          style={{ 
            transform: `translateY(${Math.max(0, pullPx - 20)}px)`,
          }}
        >
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
        </div>
      )}
      
      {/* Main content - scrollable, content passes under navbar */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto scrollbar-hide pb-20 relative z-10"
        style={{
          transform: pullPx > 0 ? `translateY(${pullPx}px)` : undefined,
          transition: isRefreshing || !isPulling ? 'transform 0.15s ease-out' : 'none',
          willChange: isPulling ? 'transform' : undefined, // Ottimizzazione performance
        }}
        onTouchStart={(e) => {
          if (isRefreshing) return;
          const main = mainRef.current;
          if (!main) return;

          const target = e.target as HTMLElement | null;
          
          // Disabilita pull-to-refresh se si tocca dentro un modale
          if (isInsideModal(target)) {
            return;
          }

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
          
          // Cancella animazione frame precedente
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          // Usa requestAnimationFrame per fluidità
          animationFrameRef.current = requestAnimationFrame(() => {
            const dy = e.touches[0].clientY - (pullStartYRef.current || 0);
            if (dy <= 0) {
              setPullPx(0);
              return;
            }
            
            // Applica resistenza elastica
            const elasticPull = calculateElasticPull(dy);
            const clampedPull = Math.min(thresholds.max, Math.round(elasticPull));
            setPullPx(clampedPull);
          });
        }}
        onTouchEnd={async () => {
          // Cancella animazione frame
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          
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
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
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
