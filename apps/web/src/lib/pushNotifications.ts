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
    console.error('Supabase non configurato');
    return false;
  }

  try {
    // Chiama la Edge Function per inviare la notifica push
    // La Edge Function userà web-push per inviare la notifica
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        payload,
      },
    });

    if (error) {
      console.error('Errore invio notifica push:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Errore invio notifica push:', err);
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

