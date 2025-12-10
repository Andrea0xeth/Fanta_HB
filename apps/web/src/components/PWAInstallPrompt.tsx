import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallPromptProps {
  delay?: number; // Delay in milliseconds before showing the prompt
  autoShow?: boolean; // Automatically show the prompt when installable
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  delay = 500,
  autoShow = true 
}) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt (only for 1 hour now)
    const dismissedKey = 'pwa-install-dismissed';
    const dismissedTime = localStorage.getItem(dismissedKey);
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // Reduced from 24 hours to 1 hour

    if (dismissedTime && parseInt(dismissedTime) > oneHourAgo) {
      setDismissed(true);
      return;
    }

    // Auto-show prompt immediately (or after minimal delay) if installable
    if (autoShow && isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, autoShow, delay, dismissed]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
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

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

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
                  <button
                    onClick={handleInstall}
                    className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base font-bold shadow-xl"
                  >
                    <Download size={22} />
                    Installa ora
                  </button>
                  
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
