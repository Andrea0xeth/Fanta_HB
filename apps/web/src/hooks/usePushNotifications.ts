import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

// VAPID public key - DEVI SOSTITUIRE CON LA TUA CHIAVE VAPID
// Per generare le chiavi VAPID, usa: npm install -g web-push && web-push generate-vapid-keys
// O usa un servizio online come https://web-push-codelab.glitch.me/
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export const usePushNotifications = (userId?: string): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica supporto notifiche push
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        'showNotification' in ServiceWorkerRegistration.prototype;
      
      setIsSupported(supported);
      
      if (supported && 'Notification' in window) {
        setIsPermissionGranted(Notification.permission === 'granted');
      }
    };

    checkSupport();
  }, []);

  // Verifica se l'utente è già iscritto
  useEffect(() => {
    if (!isSupported || !userId || !isSupabaseConfigured()) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Verifica se la subscription è salvata nel database
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('endpoint', subscription.endpoint)
            .eq('enabled', true)
            .single();

          setIsSubscribed(!!data);
        } else {
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('Errore verifica subscription:', err);
        setIsSubscribed(false);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  // Richiedi permesso notifiche
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Le notifiche non sono supportate dal browser');
    }

    const permission = await Notification.requestPermission();
    setIsPermissionGranted(permission === 'granted');
    
    return permission;
  }, []);

  // Converti base64 URL safe a Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Iscriviti alle notifiche push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Le notifiche push non sono supportate dal browser');
      return false;
    }

    if (!userId) {
      setError('Devi essere autenticato per abilitare le notifiche');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      setError('VAPID public key non configurata. Contatta l\'amministratore.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Richiedi permesso se non già concesso
      if (Notification.permission === 'default') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setError('Permesso notifiche negato');
          setIsLoading(false);
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        setError('Permesso notifiche negato');
        setIsLoading(false);
        return false;
      }

      // Registra service worker se non già registrato
      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch (err) {
        // Prova a registrare il service worker
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        await navigator.serviceWorker.ready;
      }

      // Iscriviti al push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Estrai i dati della subscription
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Salva nel database
      const { error: dbError } = await (supabase
        .from('push_subscriptions') as any)
        .upsert({
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
          user_agent: navigator.userAgent,
          enabled: true,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (dbError) {
        console.error('Errore salvataggio subscription:', dbError);
        // Annulla la subscription se non riusciamo a salvarla
        await subscription.unsubscribe();
        setError('Errore durante il salvataggio della subscription');
        setIsLoading(false);
        return false;
      }

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Errore iscrizione push:', err);
      setError(err instanceof Error ? err.message : 'Errore durante l\'iscrizione');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId, requestPermission]);

  // Disiscriviti dalle notifiche push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Disiscrivi dal browser
        await subscription.unsubscribe();

        // Disabilita nel database
        const { error: dbError } = await (supabase
          .from('push_subscriptions') as any)
          .update({ enabled: false })
          .eq('user_id', userId)
          .eq('endpoint', subscription.endpoint);

        if (dbError) {
          console.error('Errore aggiornamento subscription:', dbError);
        }
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Errore disiscrizione push:', err);
      setError(err instanceof Error ? err.message : 'Errore durante la disiscrizione');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId]);

  return {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  };
};

// Helper per convertire ArrayBuffer a base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

