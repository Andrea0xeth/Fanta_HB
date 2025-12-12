/**
 * Worker Node.js per inviare notifiche push
 * 
 * Questo worker:
 * 1. Legge le notifiche dalla coda (push_notifications_queue)
 * 2. Recupera le subscription degli utenti
 * 3. Invia le notifiche usando web-push
 * 4. Aggiorna lo stato nella coda
 * 
 * Deploy su: Vercel (cron job), Railway, o servizio simile
 */

// ES modules per compatibilità con il progetto
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurazione
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richiesti');
  process.exit(1);
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('❌ VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY sono richiesti');
  process.exit(1);
}

// Configura web-push
webpush.setVapidDetails(
  'mailto:admin@30diciaccio.it',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Processa una notifica dalla coda
 */
async function processNotification(notification) {
  console.log(`📤 Processing notification ${notification.id} for user ${notification.user_id}`);
  
  try {
    // Aggiorna status a 'processing'
    await supabase
      .from('push_notifications_queue')
      .update({ 
        status: 'processing',
        attempts: notification.attempts + 1
      })
      .eq('id', notification.id);

    // Recupera le subscription dell'utente
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', notification.user_id)
      .eq('enabled', true);

    if (subError) {
      throw new Error(`Error fetching subscriptions: ${subError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`⚠️  No active subscriptions for user ${notification.user_id}`);
      // Marca come inviata (non c'è nulla da inviare)
      await supabase
        .from('push_notifications_queue')
        .update({ 
          status: 'sent',
          processed_at: new Date().toISOString(),
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
      return { success: true, sent: 0, total: 0 };
    }

    // Prepara il payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/pwa-192x192.png',
      badge: notification.badge || '/pwa-192x192.png',
      tag: notification.id,
      data: {
        ...notification.data,
        url: notification.url || '/',
      },
      url: notification.url || '/',
    });

    // Invia a tutte le subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(subscription, payload);
          return { success: true, subscriptionId: sub.id };
        } catch (err) {
          console.error(`❌ Error sending to subscription ${sub.id}:`, err.message);
          
          // Se la subscription è invalida, disabilitala
          if (err.statusCode === 410 || err.status === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ enabled: false })
              .eq('id', sub.id);
            return { 
              success: false, 
              subscriptionId: sub.id, 
              error: 'Subscription expired',
              disabled: true 
            };
          }

          if (err.statusCode === 400 || err.status === 400) {
            await supabase
              .from('push_subscriptions')
              .update({ enabled: false })
              .eq('id', sub.id);
            return { 
              success: false, 
              subscriptionId: sub.id, 
              error: 'Invalid subscription',
              disabled: true 
            };
          }

          return { 
            success: false, 
            subscriptionId: sub.id, 
            error: err.message 
          };
        }
      })
    );

    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.success === true
    ).length;

    const failed = results.filter(r => 
      r.status === 'rejected' || 
      (r.status === 'fulfilled' && r.value.success === false)
    ).length;

    // Aggiorna status
    if (successful > 0) {
      await supabase
        .from('push_notifications_queue')
        .update({ 
          status: 'sent',
          processed_at: new Date().toISOString(),
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
      
      console.log(`✅ Sent ${successful}/${subscriptions.length} notifications`);
    } else {
      // Tutte fallite, marca come failed dopo 3 tentativi
      if (notification.attempts >= 3) {
        await supabase
          .from('push_notifications_queue')
          .update({ 
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_message: `All ${subscriptions.length} subscriptions failed`
          })
          .eq('id', notification.id);
      } else {
        // Riprova più tardi
        await supabase
          .from('push_notifications_queue')
          .update({ 
            status: 'pending',
            processed_at: null
          })
          .eq('id', notification.id);
      }
    }

    return { success: successful > 0, sent: successful, failed, total: subscriptions.length };
  } catch (error) {
    console.error(`❌ Error processing notification ${notification.id}:`, error);
    
    // Marca come failed dopo 3 tentativi
    if (notification.attempts >= 3) {
      await supabase
        .from('push_notifications_queue')
        .update({ 
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', notification.id);
    } else {
      // Riprova più tardi
      await supabase
        .from('push_notifications_queue')
        .update({ 
          status: 'pending',
          processed_at: null,
          error_message: error.message
        })
        .eq('id', notification.id);
    }
    
    throw error;
  }
}

/**
 * Processa tutte le notifiche pending
 */
async function processQueue() {
  console.log('🔄 Starting push notification worker...');
  
  try {
    // Recupera le notifiche pending (max 10 alla volta)
    const { data: notifications, error } = await supabase
      .from('push_notifications_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Error fetching queue: ${error.message}`);
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ No pending notifications');
      return;
    }

    console.log(`📋 Found ${notifications.length} pending notifications`);

    // Processa ogni notifica
    for (const notification of notifications) {
      await processNotification(notification);
      // Piccola pausa tra le notifiche
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Queue processing completed');
  } catch (error) {
    console.error('❌ Error in queue processing:', error);
    throw error;
  }
}

// Esegui se chiamato direttamente (solo per test locale)
if (import.meta.url === `file://${process.argv[1]}`) {
  processQueue()
    .then(() => {
      console.log('✅ Worker completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Worker failed:', error);
      process.exit(1);
    });
}

export { processQueue, processNotification };

