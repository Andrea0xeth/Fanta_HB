// Edge Function per inviare notifiche push
// Deploy: supabase functions deploy send-push-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Importa web-push tramite esm.sh (compatibile con Deno/Supabase)
// esm.sh converte moduli npm in moduli Deno-compatibili
import webpush from "https://esm.sh/web-push@3.6.6"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
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
            'Access-Control-Allow-Origin': '*',
          } 
        }
      )
    }

    const { user_id, payload } = await req.json()

    if (!user_id || !payload) {
      return new Response(
        JSON.stringify({ error: 'user_id and payload are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verifica chiavi VAPID
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ 
          error: 'VAPID keys not configured',
          message: 'Configura VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nelle variabili d\'ambiente della Edge Function'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase
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
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          count: 0,
          message: 'No active subscriptions found for this user'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Prepara il payload della notifica
    const notificationPayload = JSON.stringify({
      title: payload.title || '30diCiaccioGame',
      body: payload.body || payload.message || 'Nuova notifica',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-192x192.png',
      tag: payload.tag || payload.id || 'default',
      data: payload.data || payload,
      url: payload.url || '/',
      requireInteraction: payload.requireInteraction || false,
      actions: payload.actions || [],
    })

    // Configura VAPID
    webpush.setVapidDetails(
      'mailto:admin@30diciaccio.it',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    // Invia notifiche a tutte le subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          await webpush.sendNotification(
            subscription,
            notificationPayload
          )

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

    // Crea notifica nel database per tracciamento
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
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        } 
      }
    )
  } catch (error: any) {
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})

