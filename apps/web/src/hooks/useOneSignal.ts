import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}

export interface UseOneSignalReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

export const useOneSignal = (): UseOneSignalReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica supporto e stato iniziale
  useEffect(() => {
    const checkOneSignal = async () => {
      if (!window.OneSignal) {
        // Aspetta che OneSignal sia caricato
        await new Promise<void>((resolve) => {
          if (window.OneSignal) {
            resolve();
          } else {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.OneSignalDeferred.push(() => {
              resolve();
            });
          }
        });
      }

      if (window.OneSignal) {
        setIsSupported(true);
        
        // Verifica se l'utente è già iscritto
        const isOptedIn = await window.OneSignal.isPushNotificationsEnabled();
        setIsSubscribed(isOptedIn);
      } else {
        setIsSupported(false);
      }
    };

    checkOneSignal();
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!window.OneSignal) {
      throw new Error('OneSignal non è ancora caricato');
    }

    try {
      await window.OneSignal.registerForPushNotifications();
      return 'granted';
    } catch (err: any) {
      console.error('[OneSignal] Errore richiesta permesso:', err);
      return 'denied';
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!window.OneSignal) {
      setError('OneSignal non è ancora caricato');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verifica se è già iscritto
      const isOptedIn = await window.OneSignal.isPushNotificationsEnabled();
      
      if (isOptedIn) {
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      // Richiedi permesso e iscriviti
      await window.OneSignal.registerForPushNotifications();
      
      // Verifica di nuovo lo stato
      const newState = await window.OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(newState);
      setIsLoading(false);
      
      return newState;
    } catch (err: any) {
      console.error('[OneSignal] Errore iscrizione:', err);
      setError(err.message || 'Errore durante l\'iscrizione alle notifiche');
      setIsLoading(false);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!window.OneSignal) {
      setError('OneSignal non è ancora caricato');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      await window.OneSignal.setSubscription(false);
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[OneSignal] Errore disiscrizione:', err);
      setError(err.message || 'Errore durante la disiscrizione');
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  };
};

