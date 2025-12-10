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
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Debug logging
    console.log('PWAInstallPrompt - isInstalled:', isInstalled, 'isInstallable:', isInstallable, 'canShowPrompt:', canShowPrompt, 'isIOS:', isIOS);

    // Check if user has previously dismissed the prompt (only for 1 hour now)
    const dismissedKey = 'pwa-install-dismissed';
    const dismissedTime = localStorage.getItem(dismissedKey);
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // Reduced from 24 hours to 1 hour

    if (dismissedTime && parseInt(dismissedTime) > oneHourAgo) {
      console.log('PWAInstallPrompt - User dismissed within last hour');
      setDismissed(true);
      return;
    }

    // FORCE SHOW: Auto-show prompt if not installed and auto-show is enabled
    // Show regardless of browser support - we'll show instructions for all platforms
    // If forceShow is true, ignore dismissed state
    const shouldShow = forceShow 
      ? (!isInstalled) 
      : (autoShow && !isInstalled && !dismissed);
    
    if (shouldShow) {
      console.log('PWAInstallPrompt - Will show prompt after delay:', delay);
      const timer = setTimeout(() => {
        console.log('PWAInstallPrompt - Showing prompt now!');
        setShowPrompt(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      console.log('PWAInstallPrompt - Not showing:', { autoShow, isInstalled, dismissed, forceShow });
    }
  }, [isInstalled, autoShow, delay, dismissed, isInstallable, canShowPrompt, isIOS, forceShow]);

  const handleInstall = async () => {
    // If we have the deferred prompt, use it
    if (promptInstall) {
      const installed = await promptInstall();
      if (installed) {
        setShowPrompt(false);
      }
    } else {
      // If no prompt available, just close and let user install manually
      // (This handles cases where beforeinstallprompt wasn't fired)
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for only 1 hour (much shorter)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    // Show again after 1 hour
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 60 * 60 * 1000);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) {
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
            {/* Overlay scuro che blocca l'interazione */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Prompt modale centrale */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
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
                      Per un'esperienza migliore, aggiungi questa app alla tua schermata Home!
                    </p>
                  </div>
                  
                  <div className="bg-dark/70 rounded-xl p-4 w-full border border-white/10">
                    <p className="text-sm text-gray-300 mb-3 font-semibold">Come installare:</p>
                    <ol className="text-sm text-gray-200 space-y-2 text-left">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">1.</span>
                        <span>Tocca il pulsante <span className="font-semibold text-white">Condividi</span> <span className="text-gray-400">(□↑)</span> in basso</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">2.</span>
                        <span>Seleziona <span className="font-semibold text-white">"Aggiungi alla schermata Home"</span></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-coral-400">3.</span>
                        <span>Conferma con <span className="font-semibold text-white">"Aggiungi"</span></span>
                      </li>
                    </ol>
                  </div>
                  
                  <button
                    onClick={handleDismiss}
                    className="w-full px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm underline"
                  >
                    Ho capito, continua
                  </button>
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
          {/* Overlay scuro che blocca l'interazione */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Prompt modale centrale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
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
                    <button
                      onClick={handleInstall}
                      className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold shadow-xl"
                    >
                      <Download size={22} />
                      Installa ora
                    </button>
                  ) : (
                    <div className="bg-dark/70 rounded-xl p-4 w-full border border-white/10">
                      <p className="text-sm text-gray-300 mb-2 font-semibold">Come installare:</p>
                      <ol className="text-sm text-gray-200 space-y-1.5 text-left">
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">1.</span>
                          <span>Clicca sul menu del browser (tre puntini)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">2.</span>
                          <span>Seleziona <span className="font-semibold text-white">"Installa app"</span> o <span className="font-semibold text-white">"Aggiungi alla schermata Home"</span></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-coral-400">3.</span>
                          <span>Conferma l'installazione</span>
                        </li>
                      </ol>
                    </div>
                  )}
                  
                  <button
                    onClick={handleDismiss}
                    className="w-full px-4 py-2.5 text-gray-400 hover:text-white transition-colors text-sm underline"
                  >
                    Dopo, continua senza installare
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
