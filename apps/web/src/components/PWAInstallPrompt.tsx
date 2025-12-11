import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  delay?: number; // Delay in milliseconds before showing the prompt
  autoShow?: boolean; // Automatically show the prompt when installable
  forceShow?: boolean; // Force show the prompt regardless of other conditions (except isInstalled)
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  delay = 500,
  autoShow = true,
  forceShow = false
}) => {
  const { isInstallable, isInstalled, isIOS, promptInstall, canShowPrompt } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  // Monitor isInstalled and close prompt automatically when app is installed
  useEffect(() => {
    if (isInstalled) {
      setShowPrompt(false);
      return;
    }

    // Periodic check to detect if app was installed (in case events don't fire)
    const checkInterval = setInterval(() => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
      if (standalone) {
        setShowPrompt(false);
        clearInterval(checkInterval);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [isInstalled]);

  // Prevent closing with ESC key or other keyboard shortcuts
  useEffect(() => {
    if (!showPrompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent ESC, F5, Ctrl+R, etc.
      if (e.key === 'Escape' || 
          e.key === 'F5' || 
          (e.ctrlKey && e.key === 'r') ||
          (e.ctrlKey && e.key === 'R') ||
          (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevent page unload while prompt is showing
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [showPrompt]);

  useEffect(() => {
    // FORCE SHOW: Auto-show prompt if not installed and auto-show is enabled
    // Show regardless of browser support - we'll show instructions for all platforms
    // If forceShow is true, always show if not installed
    const shouldShow = forceShow 
      ? (!isInstalled) 
      : (autoShow && !isInstalled);
    
    if (shouldShow) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInstalled, autoShow, delay, isInstallable, canShowPrompt, isIOS, forceShow]);

  const handleInstall = async () => {
    // If we have the deferred prompt, use it
    if (promptInstall) {
      await promptInstall();
      // Don't close manually - let the useEffect handle it when isInstalled becomes true
      // The prompt will close automatically via the useEffect that monitors isInstalled
    }
    // If no prompt available, the user must install manually
    // The prompt will remain open until isInstalled becomes true
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Always show prompt if not installed (we'll handle iOS vs Android differently)
  // This ensures the prompt appears regardless of browser API support
  // Note: We check showPrompt state to control visibility

  // iOS instructions (no programmatic install)
  if (isIOS) {
    return (
      <AnimatePresence>
        {showPrompt && (
          <>
            {/* Overlay scuro che blocca l'interazione - NON CHIUDIBILE */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9998] pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // NON permettere la chiusura cliccando sull'overlay
              }}
              onContextMenu={(e) => e.preventDefault()}
            />
            
            {/* Prompt modale centrale - NON CHIUDIBILE */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // NON permettere la chiusura cliccando fuori dal modale
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="glass rounded-3xl p-6 shadow-2xl max-w-md w-full border-2 border-coral-500/30 relative">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-coral-500 to-turquoise-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-2xl flex items-center justify-center gap-2">
                      <Sparkles className="w-6 h-6 text-party-300" />
                      Installa l'app
                      <Sparkles className="w-6 h-6 text-party-300" />
                    </h3>
                    <p className="text-gray-300 text-base">
                      Per continuare, devi aggiungere questa app alla tua schermata Home!
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      Su iOS devi farlo manualmente dal browser
                    </p>
                  </div>
                  
                  <div className="bg-dark/70 rounded-xl p-4 w-full border border-white/10">
                    <p className="text-sm text-gray-300 mb-3 font-semibold">Come installare (iOS):</p>
                    <ol className="text-sm text-gray-200 space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">1.</span>
                        <span>Tocca il pulsante <span className="font-semibold text-white">Condividi</span> <span className="text-gray-400">(□↑)</span> in basso nella barra del browser</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">2.</span>
                        <span>Scorri e seleziona <span className="font-semibold text-white">"Aggiungi alla schermata Home"</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">3.</span>
                        <span>Conferma con <span className="font-semibold text-white">"Aggiungi"</span> in alto a destra</span>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="w-full p-3 bg-coral-500/20 rounded-lg border border-coral-500/30">
                    <p className="text-sm text-coral-300 text-center font-semibold">
                      ⚠️ Devi installare l'app per continuare
                    </p>
                    <p className="text-xs text-coral-400/80 text-center mt-1">
                      Il modale si chiuderà automaticamente quando l'app sarà installata
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Android/Chrome install prompt
  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay scuro che blocca l'interazione - NON CHIUDIBILE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9998] pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // NON permettere la chiusura cliccando sull'overlay
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Prompt modale centrale - NON CHIUDIBILE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              // NON permettere la chiusura cliccando fuori dal modale
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="glass rounded-3xl p-6 shadow-2xl max-w-md w-full border-2 border-coral-500/30 relative">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-coral-500 to-turquoise-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Download className="w-10 h-10 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-2xl flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-party-300" />
                    Installa l'app
                    <Sparkles className="w-6 h-6 text-party-300" />
                  </h3>
                  <p className="text-gray-300 text-base">
                    Installa questa app per un'esperienza migliore e per giocare offline!
                  </p>
                </div>
                
                <div className="w-full space-y-3">
                  {isInstallable ? (
                    <>
                      <button
                        onClick={handleInstall}
                        className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold shadow-xl"
                      >
                        <Download size={22} />
                        Installa ora (automatico)
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Clicca per aprire il prompt di installazione del browser
                      </p>
                    </>
                  ) : (
                    <div className="bg-dark/70 rounded-xl p-4 w-full border border-white/10">
                      <p className="text-sm text-gray-300 mb-2 font-semibold">Come installare manualmente:</p>
                      <ol className="text-sm text-gray-200 space-y-1.5 text-left">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">1.</span>
                          <span>Clicca sul menu del browser (tre puntini in alto a destra)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">2.</span>
                          <span>Seleziona <span className="font-semibold text-white">"Installa app"</span> o <span className="font-semibold text-white">"Aggiungi alla schermata Home"</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">3.</span>
                          <span>Conferma l'installazione nel popup del browser</span>
                        </li>
                      </ol>
                      <p className="text-xs text-gray-400 mt-2 italic">
                        Il browser non supporta l'installazione automatica, devi farlo manualmente
                      </p>
                    </div>
                  )}
                  
                  <div className="w-full p-3 bg-coral-500/20 rounded-lg border border-coral-500/30">
                    <p className="text-sm text-coral-300 text-center font-semibold">
                      ⚠️ Devi installare l'app per continuare
                    </p>
                    <p className="text-xs text-coral-400/80 text-center mt-1">
                      Il modale si chiuderà automaticamente quando l'app sarà installata
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
