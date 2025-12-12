/**
 * Endpoint per processare manualmente le notifiche push dalla coda
 * 
 * Può essere chiamato:
 * - Manualmente dalla pagina admin (POST)
 * - Via cron job esterno (GET con secret opzionale)
 */

// ES modules per compatibilità con il progetto
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurazione
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Inizializza Supabase e web-push
let supabase;
let webpushConfigured = false;

function initServices() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richiesti');
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY sono richiesti');
  }

  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }

  if (!webpushConfigured) {
    webpush.setVapidDetails(
      'mailto:admin@30diciaccio.it',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    webpushConfigured = true;
  }
}

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
        attempts: (notification.attempts || 0) + 1
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
        ...(notification.data || {}),
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
      const attempts = (notification.attempts || 0) + 1;
      if (attempts >= 3) {
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
    const attempts = (notification.attempts || 0) + 1;
    if (attempts >= 3) {
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
    initServices();

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
      return { success: true, processed: 0 };
    }

    console.log(`📋 Found ${notifications.length} pending notifications`);

    // Processa ogni notifica
    let processed = 0;
    for (const notification of notifications) {
      await processNotification(notification);
      processed++;
      // Piccola pausa tra le notifiche
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ Queue processing completed');
    return { success: true, processed };
  } catch (error) {
    console.error('❌ Error in queue processing:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Accetta sia GET (per cron esterni) che POST (per chiamate manuali)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Per GET (cron esterni), verifica secret se configurato
  if (req.method === 'GET') {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Per POST (chiamate manuali), verifica che l'utente sia admin
  // Nota: La verifica admin dovrebbe essere fatta lato frontend
  // Qui accettiamo tutte le POST (il frontend controllerà i permessi)

  try {
    console.log(`🔄 Starting push notification worker via ${req.method}...`);
    const result = await processQueue();
    
    return res.status(200).json({ 
      success: true,
      message: 'Queue processed successfully',
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('❌ Error processing queue:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
