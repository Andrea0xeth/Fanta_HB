import { supabase, isSupabaseConfigured } from './supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  url?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Invia una notifica push a un utente specifico
 * Questa funzione chiama una Edge Function di Supabase che gestisce l'invio effettivo
 */
export const sendPushNotification = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.error('[Push] Supabase non configurato');
    return false;
  }

  try {
    console.log('[Push] Invio notifica a utente:', userId, payload);
    
    // Usa supabase.functions.invoke che gestisce automaticamente CORS e autenticazione
    // Il client Supabase gestisce correttamente le richieste cross-origin
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        payload,
      },
    });

    console.log('[Push] Risposta Edge Function:', { data, error });

    if (error) {
      console.error('[Push] Errore invio notifica push:', error);
      // Se l'errore contiene un messaggio, mostralo
      if (error.message) {
        console.error('[Push] Messaggio errore:', error.message);
      }
      return false;
    }

    // La Edge Function restituisce { success: true, sent: number, failed: number, ... }
    if (data) {
      if (typeof data === 'object' && 'error' in data) {
        console.error('[Push] Errore nella risposta:', data.error);
        return false;
      }
      
      if ('success' in data) {
        const sent = data.sent || 0;
        const total = data.total || 0;
        console.log(`[Push] Notifiche inviate: ${sent}/${total}`);
        
        if (data.success === true && sent > 0) {
          return true;
        } else if (sent === 0 && total > 0) {
          console.warn('[Push] Nessuna notifica inviata (utente potrebbe non avere subscription attive)');
          return false;
        } else if (total === 0) {
          console.warn('[Push] Nessuna subscription trovata per l\'utente');
          return false;
        }
      }
    }

    // Se non c'è una risposta strutturata, considera fallimento
    console.warn('[Push] Risposta non valida dalla Edge Function');
    return false;
  } catch (err: any) {
    console.error('[Push] Errore invio notifica push:', err);
    // Mostra un messaggio più dettagliato
    if (err.message) {
      console.error('[Push] Dettagli errore:', err.message);
    }
    if (err.stack) {
      console.error('[Push] Stack trace:', err.stack);
    }
    return false;
  }
};

/**
 * Invia notifiche push a più utenti
 */
export const sendPushNotificationToUsers = async (
  userIds: string[],
  payload: PushNotificationPayload
): Promise<number> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase non configurato');
    return 0;
  }

  let successCount = 0;

  // Invia a tutti gli utenti (in parallelo, ma con limite)
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(userId => sendPushNotification(userId, payload));
    const results = await Promise.allSettled(promises);
    successCount += results.filter(r => r.status === 'fulfilled' && r.value).length;
  }

  return successCount;
};

/**
 * Invia notifica push a tutti gli utenti di una squadra
 */
export const sendPushNotificationToSquadra = async (
  squadraId: string,
  payload: PushNotificationPayload
): Promise<number> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase non configurato');
    return 0;
  }

  try {
    // Ottieni tutti gli utenti della squadra
    const { data: users, error } = await supabase
      .from('users')
      .select('id')
      .eq('squadra_id', squadraId);

    if (error || !users || users.length === 0) {
      console.error('Errore recupero utenti squadra:', error);
      return 0;
    }

    const userIds = (users as Array<{ id: string }>).map(u => u.id);
    return await sendPushNotificationToUsers(userIds, payload);
  } catch (err) {
    console.error('Errore invio notifica a squadra:', err);
    return 0;
  }
};

/**
 * Invia notifica push a tutti gli utenti (admin only)
 */
export const sendPushNotificationToAll = async (
  payload: PushNotificationPayload
): Promise<number> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase non configurato');
    return 0;
  }

  try {
    // Ottieni tutti gli utenti
    const { data: users, error } = await supabase
      .from('users')
      .select('id');

    if (error || !users || users.length === 0) {
      console.error('Errore recupero utenti:', error);
      return 0;
    }

    const userIds = (users as Array<{ id: string }>).map(u => u.id);
    return await sendPushNotificationToUsers(userIds, payload);
  } catch (err) {
    console.error('Errore invio notifica a tutti:', err);
    return 0;
  }
};

