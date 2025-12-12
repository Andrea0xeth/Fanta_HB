/**
 * Funzioni per inviare notifiche tramite OneSignal API
 */

export interface OneSignalNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: any;
}

/**
 * Invia una notifica tramite l'endpoint API di OneSignal
 * L'endpoint gestisce l'autenticazione con la REST API Key
 * 
 * NOTA: Le serverless functions di Vercel sono gratuite fino a 100GB-hours/mese
 */
export const sendOneSignalNotification = async (
  payload: OneSignalNotificationPayload,
  filters?: Array<{ field: string; key: string; relation: string; value: string }>
): Promise<boolean> => {
  try {
    const response = await fetch('/api/onesignal/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload,
        filters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success === true;
  } catch (err: any) {
    console.error('[OneSignal] Errore invio notifica:', err);
    return false;
  }
};

/**
 * Invia notifica a un utente specifico (tramite tag)
 */
export const sendOneSignalNotificationToUser = async (
  userId: string,
  payload: OneSignalNotificationPayload
): Promise<boolean> => {
  return sendOneSignalNotification(payload, [
    { field: 'tag', key: 'user_id', relation: '=', value: userId },
  ]);
};

/**
 * Invia notifica a tutti gli utenti
 */
export const sendOneSignalNotificationToAll = async (
  payload: OneSignalNotificationPayload
): Promise<boolean> => {
  return sendOneSignalNotification(payload);
};

