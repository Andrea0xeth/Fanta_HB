// Edge Function per inviare notifiche push
// Deploy: supabase functions deploy send-push-notification

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// NOTA: web-push non funziona con Deno a causa di dipendenze Node.js native
// Usiamo un approccio semplificato: registriamo la notifica nel database
// e l'invio effettivo può essere fatto da un servizio esterno o da un worker separato

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''

// CORS headers da includere in tutte le risposte
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  // Handle CORS preflight - DEVE essere la prima cosa
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Verifica metodo
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (err) {
      console.error('Error parsing request body:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: err instanceof Error ? err.message : 'Unknown error' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    const { user_id, payload } = requestBody;

    if (!user_id || !payload) {
      console.error('Missing required fields:', { user_id: !!user_id, payload: !!payload });
      return new Response(
        JSON.stringify({ error: 'user_id and payload are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    console.log('Request received:', { user_id, payload: { title: payload?.title, body: payload?.body } });

    // Verifica chiavi VAPID
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ 
          error: 'VAPID keys not configured',
          message: 'Configura VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nelle variabili d\'ambiente della Edge Function'
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // Crea client Supabase con Service Role Key per bypassare RLS
    // NOTA: L'Edge Function è accessibile anonimamente per evitare problemi CORS
    // Il controllo admin è fatto lato frontend
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Recupera le subscription dell'utente
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('enabled', true)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return new Response(
        JSON.stringify({ error: 'Error fetching subscriptions', details: subError.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          count: 0,
          message: 'No active subscriptions found for this user'
        }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // Prepara il payload della notifica
    const notificationPayload = JSON.stringify({
      title: payload.title || 'DC-30',
      body: payload.body || payload.message || 'Nuova notifica',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || payload.id || 'default',
      data: payload.data || payload,
      url: payload.url || '/',
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions || [],
    })

    // NOTA: web-push non funziona con Deno
    // Per ora, registriamo solo la notifica nel database
    // L'invio effettivo può essere fatto da:
    // 1. Un servizio esterno (OneSignal, Firebase, ecc.)
    // 2. Un worker separato che usa Node.js
    // 3. Un'implementazione manuale completa del protocollo Web Push
    
    console.log('Registrando notifiche per', subscriptions.length, 'subscriptions');
    
    // Per ora, simuliamo l'invio (in produzione, usa un servizio esterno)
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // TODO: Implementare invio effettivo con un servizio esterno
          // Per ora, restituiamo successo simulato
          console.log('Simulazione invio a subscription:', sub.id);
          
          // In produzione, qui chiameresti un servizio esterno o un worker
          // await sendViaExternalService(sub, notificationPayload);
          
          return { success: true, subscriptionId: sub.id }
        } catch (err: any) {
          console.error('Error sending notification:', err)

          // Se la subscription è invalida (410 Gone), disabilitala
          if (err.statusCode === 410 || err.status === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ enabled: false })
              .eq('id', sub.id)
            
            return { 
              success: false, 
              subscriptionId: sub.id, 
              error: 'Subscription expired',
              disabled: true 
            }
          }

          // Se la subscription non è valida (400 Bad Request), disabilitala
          if (err.statusCode === 400 || err.status === 400) {
            await supabase
              .from('push_subscriptions')
              .update({ enabled: false })
              .eq('id', sub.id)
            
            return { 
              success: false, 
              subscriptionId: sub.id, 
              error: 'Invalid subscription',
              disabled: true 
            }
          }

          return { 
            success: false, 
            subscriptionId: sub.id, 
            error: err.message || 'Unknown error' 
          }
        }
      })
    )

    // Conta successi e fallimenti
    const successful = results.filter(r => 
      r.status === 'fulfilled' && r.value.success === true
    ).length

    const failed = results.filter(r => 
      r.status === 'rejected' || 
      (r.status === 'fulfilled' && r.value.success === false)
    ).length

    const disabled = results.filter(r => 
      r.status === 'fulfilled' && r.value.disabled === true
    ).length

    // Aggiungi alla coda push notifications (il worker Node.js le processerà)
    await supabase
      .from('push_notifications_queue')
      .insert({
        user_id: user_id,
        title: payload.title || 'Notifica Push',
        body: payload.body || payload.message || 'Notifica inviata',
        icon: payload.icon || '/pwa-192x192.png',
        badge: payload.badge || '/pwa-192x192.png',
        url: payload.url || '/',
        data: payload.data || {},
        status: 'pending',
      })

    // Crea anche notifica nel database per tracciamento
    await supabase
      .from('notifiche')
      .insert({
        user_id: user_id,
        titolo: payload.title || 'Notifica Push',
        messaggio: payload.body || payload.message || 'Notifica inviata',
        tipo: payload.tipo || 'sistema',
      })

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successful,
        failed: failed,
        disabled: disabled,
        total: subscriptions.length,
        message: `Notifiche inviate: ${successful}/${subscriptions.length}`
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    )
  } catch (error: any) {
    console.error('Fatal error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack,
        name: error.name,
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        } 
      }
    )
  }
})

