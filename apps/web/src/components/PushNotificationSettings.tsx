import React, { useState } from 'react';
import { Bell, BellOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export const PushNotificationSettings: React.FC = () => {
  const { user } = useGame();
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotifications(user?.id);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async () => {
    setMessage(null);

    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        setMessage({ type: 'success', text: 'Notifiche push disabilitate' });
      } else {
        setMessage({ type: 'error', text: error || 'Errore durante la disabilitazione' });
      }
    } else {
      // Prima richiedi il permesso se necessario
      if (!isPermissionGranted) {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setMessage({ type: 'error', text: 'Permesso notifiche negato' });
          return;
        }
      }

      const success = await subscribe();
      if (success) {
        setMessage({ type: 'success', text: 'Notifiche push abilitate!' });
      } else {
        setMessage({ type: 'error', text: error || 'Errore durante l\'abilitazione' });
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <BellOff className="text-gray-400" size={20} />
          <div>
            <p className="text-sm font-semibold text-gray-300">Notifiche Push</p>
            <p className="text-xs text-gray-500">Non supportate dal tuo browser</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="text-coral-400" size={20} />
          ) : (
            <BellOff className="text-gray-400" size={20} />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-300">Notifiche Push</p>
            <p className="text-xs text-gray-500">
              {isSubscribed ? 'Abilitate' : 'Disabilitate'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`btn-primary text-sm py-2 px-4 flex items-center gap-2 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Caricamento...</span>
            </>
          ) : isSubscribed ? (
            <>
              <BellOff size={16} />
              <span>Disabilita</span>
            </>
          ) : (
            <>
              <Bell size={16} />
              <span>Abilita</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-3 p-3 rounded-xl flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="text-green-400 flex-shrink-0" size={18} />
            ) : (
              <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
            )}
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !message && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
          <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isSubscribed && (
        <div className="mt-3 p-3 rounded-xl bg-coral-500/10 border border-coral-500/30">
          <p className="text-xs text-coral-300">
            Riceverai notifiche per:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-coral-300/80">
            <li>• Nuove quest personali</li>
            <li>• Nuove quest da verificare</li>
            <li>• Nuove sfide di squadra</li>
            <li>• Notifiche dall'admin</li>
          </ul>
        </div>
      )}
    </div>
  );
};

