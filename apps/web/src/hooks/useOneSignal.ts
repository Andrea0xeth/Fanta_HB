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
  subscribe: (userId?: string, squadraId?: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

export const useOneSignal = (): UseOneSignalReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper per verificare se l'utente è iscritto (compatibile con diverse versioni API)
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    if (!window.OneSignal) return false;

    try {
      // Prova diversi metodi API a seconda della versione
      if (typeof window.OneSignal.isPushNotificationsEnabled === 'function') {
        return await window.OneSignal.isPushNotificationsEnabled();
      } else if (window.OneSignal.User && typeof window.OneSignal.User.PushSubscription?.optedIn === 'function') {
        return await window.OneSignal.User.PushSubscription.optedIn();
      } else if (typeof window.OneSignal.getSubscription === 'function') {
        const subscription = await window.OneSignal.getSubscription();
        return subscription === true || (subscription && subscription.optedIn === true);
      } else if (window.OneSignal.User?.PushSubscription?.optedIn !== undefined) {
        return window.OneSignal.User.PushSubscription.optedIn;
      }
      return false;
    } catch (err) {
      console.warn('[OneSignal] Errore verifica stato iscrizione:', err);
      return false;
    }
  };

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
        const isOptedIn = await checkSubscriptionStatus();
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

  const subscribe = useCallback(async (userId?: string, squadraId?: string): Promise<boolean> => {
    if (!window.OneSignal) {
      setError('OneSignal non è ancora caricato');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verifica se è già iscritto prima di procedere
      const isOptedIn = await checkSubscriptionStatus();
      
      // Se non è iscritto, richiedi permesso e iscriviti
      if (!isOptedIn) {
        // Usa registerForPushNotifications se disponibile
        if (typeof window.OneSignal.registerForPushNotifications === 'function') {
          await window.OneSignal.registerForPushNotifications();
        } else if (typeof window.OneSignal.showSlidedownPrompt === 'function') {
          // Fallback per versioni più vecchie
          await window.OneSignal.showSlidedownPrompt();
        } else {
          // Ultimo fallback: richiedi permesso manualmente
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            setError('Permesso notifiche negato');
            setIsLoading(false);
            return false;
          }
        }
        
        // Attendi un momento per assicurarsi che l'iscrizione sia completata
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Imposta i tag dell'utente se forniti (per segmentazione)
      // Usa sendTags (plurale) se disponibile, altrimenti sendTag (singolare)
      if (userId || squadraId) {
        const tags: { [key: string]: string } = {};
        if (userId) {
          tags.user_id = userId;
        }
        if (squadraId) {
          tags.squadra_id = squadraId;
        }

        // Usa OneSignal.push() per assicurarsi che OneSignal sia pronto
        if (typeof window.OneSignal.push === 'function') {
          window.OneSignal.push(() => {
            // Prova prima con sendTags (API più recente)
            if (typeof window.OneSignal!.sendTags === 'function') {
              window.OneSignal!.sendTags(tags);
            } else if (typeof window.OneSignal!.sendTag === 'function') {
              // Fallback alla versione singolare
              for (const [key, value] of Object.entries(tags)) {
                window.OneSignal!.sendTag(key, value);
              }
            }
          });
        } else {
          // Fallback diretto se push non è disponibile
          if (typeof window.OneSignal.sendTags === 'function') {
            await window.OneSignal.sendTags(tags);
          } else if (typeof window.OneSignal.sendTag === 'function') {
            for (const [key, value] of Object.entries(tags)) {
              await window.OneSignal.sendTag(key, value);
            }
          } else {
            console.warn('[OneSignal] sendTags/sendTag non disponibile, i tag non verranno impostati');
          }
        }
      }
      
      // Verifica di nuovo lo stato
      const newState = await checkSubscriptionStatus();
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
      // Rimuovi i tag prima di disiscrivere
      if (typeof window.OneSignal.deleteTags === 'function') {
        await window.OneSignal.deleteTags(['user_id', 'squadra_id']);
      } else if (typeof window.OneSignal.deleteTag === 'function') {
        await window.OneSignal.deleteTag('user_id');
        await window.OneSignal.deleteTag('squadra_id');
      }

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

