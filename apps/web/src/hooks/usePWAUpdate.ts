import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePWAUpdateOptions {
  autoUpdateDelay?: number; // Tempo in ms prima dell'aggiornamento automatico (0 = disabilitato)
}

export const usePWAUpdate = (options: UsePWAUpdateOptions = {}) => {
  const { autoUpdateDelay = 0 } = options;
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const autoUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateServiceWorkerRef = useRef<(() => Promise<void>) | null>(null);

  const updateServiceWorker = useCallback(async () => {
    const currentRegistration = registration;
    if (!currentRegistration || !currentRegistration.waiting) {
      return;
    }

    // Cancella l'aggiornamento automatico se era programmato
    if (autoUpdateTimeoutRef.current) {
      clearTimeout(autoUpdateTimeoutRef.current);
      autoUpdateTimeoutRef.current = null;
    }

    setIsUpdating(true);

    try {
      // Invia un messaggio al service worker in attesa per attivarlo
      currentRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Attendi che il nuovo service worker prenda il controllo
      await new Promise<void>((resolve) => {
        const handleControllerChange = () => {
          resolve();
        };
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, { once: true });
        
        // Fallback: se dopo 3 secondi non c'è stato il cambio, ricarica comunque
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
          resolve();
        }, 3000);
      });

      // Ricarica la pagina per usare la nuova versione
      window.location.reload();
    } catch (error) {
      console.error('Error updating service worker:', error);
      setIsUpdating(false);
      // In caso di errore, prova comunque a ricaricare
      window.location.reload();
    }
  }, [registration]);

  // Salva il riferimento alla funzione per usarla dentro l'useEffect
  useEffect(() => {
    updateServiceWorkerRef.current = updateServiceWorker;
  }, [updateServiceWorker]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let registrationInstance: ServiceWorkerRegistration | null = null;
    
    // Helper per chiamare update() che potrebbe non essere nel tipo standard
    const updateRegistration = (reg: ServiceWorkerRegistration) => {
      if ('update' in reg && typeof reg.update === 'function') {
        reg.update();
      }
    };

    // Funzione per registrare o recuperare il service worker
    const getRegistration = async (): Promise<ServiceWorkerRegistration> => {
      // Prova prima a recuperare una registrazione esistente
      if (navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        return reg;
      }
      
      // Se non c'è, registra il service worker
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        return reg;
      } catch (error) {
        console.error('Error registering service worker:', error);
        // Se la registrazione fallisce, prova comunque a recuperare ready
        return await navigator.serviceWorker.ready;
      }
    };

    // Funzione per controllare se c'è un aggiornamento
    const checkForUpdate = async () => {
      try {
        // Registra o recupera il service worker
        const reg = await getRegistration();
        registrationInstance = reg;
        setRegistration(reg);

        // Controlla se c'è un service worker in attesa
        if (reg.waiting) {
          setUpdateAvailable(true);
          
          // Se è configurato l'aggiornamento automatico, programma il reload
          if (autoUpdateDelay > 0 && !autoUpdateTimeoutRef.current && updateServiceWorkerRef.current) {
            autoUpdateTimeoutRef.current = setTimeout(() => {
              updateServiceWorkerRef.current?.();
            }, autoUpdateDelay);
          }
          return;
        }

        // Controlla se c'è un service worker in installazione
        if (reg.installing) {
          const installingWorker = reg.installing;
          
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // C'è un nuovo service worker installato e pronto
              setUpdateAvailable(true);
              
              // Se è configurato l'aggiornamento automatico, programma il reload
              if (autoUpdateDelay > 0 && !autoUpdateTimeoutRef.current && updateServiceWorkerRef.current) {
                autoUpdateTimeoutRef.current = setTimeout(() => {
                  updateServiceWorkerRef.current?.();
                }, autoUpdateDelay);
              }
            }
          });
        }

        // Ascolta gli aggiornamenti periodici
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nuovo service worker installato
                setUpdateAvailable(true);
                
                // Se è configurato l'aggiornamento automatico, programma il reload
                if (autoUpdateDelay > 0 && !autoUpdateTimeoutRef.current && updateServiceWorkerRef.current) {
                  autoUpdateTimeoutRef.current = setTimeout(() => {
                    updateServiceWorkerRef.current?.();
                  }, autoUpdateDelay);
                }
              }
            });
          }
        });

      } catch (error) {
        console.error('Error checking for PWA update:', error);
      }
    };

    // Ascolta i messaggi dal service worker
    const handleControllerChange = () => {
      // Il service worker è stato aggiornato, ricarica la pagina
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Controlla immediatamente
    checkForUpdate();

    // Controlla periodicamente (ogni ora)
    const interval = setInterval(() => {
      if (registrationInstance) {
        updateRegistration(registrationInstance);
      }
      checkForUpdate();
    }, 60 * 60 * 1000);

    // Controlla quando la pagina torna in focus
    const handleVisibilityChange = () => {
      if (!document.hidden && registrationInstance) {
        updateRegistration(registrationInstance);
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (autoUpdateTimeoutRef.current) {
        clearTimeout(autoUpdateTimeoutRef.current);
      }
    };
    // Nota: updateServiceWorker è accessibile tramite ref, non serve nelle dipendenze
  }, [autoUpdateDelay]);

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    // Cancella l'aggiornamento automatico se era programmato
    if (autoUpdateTimeoutRef.current) {
      clearTimeout(autoUpdateTimeoutRef.current);
      autoUpdateTimeoutRef.current = null;
    }
  };

  return {
    updateAvailable,
    isUpdating,
    updateServiceWorker,
    dismissUpdate,
  };
};

