// Edge Function alternativa per inviare notifiche push
// Usa solo fetch nativo, senza librerie esterne
// Usa questo se la libreria web-push non funziona

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''

// Helper per convertire base64 URL safe a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Helper per inviare notifica push usando fetch
async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<void> {
  // NOTA: Questa è un'implementazione semplificata
  // Per una implementazione completa, devi:
  // 1. Generare l'encryption key usando VAPID
  // 2. Cifrare il payload
  // 3. Creare gli header corretti
  
  // Per ora, questa funzione registra solo la notifica
  // Per un'implementazione completa, usa una libreria web-push funzionante
  // o implementa manualmente il protocollo Web Push (RFC 8030)
  
  throw new Error('Implementazione alternativa richiede libreria web-push funzionante. Usa index.ts con la libreria corretta.')
}

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
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const { user_id, payload } = await req.json()

    if (!user_id || !payload) {
      return new Response(
        JSON.stringify({ error: 'user_id and payload are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Crea client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Recupera subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('enabled', true)

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, count: 0, message: 'No subscriptions found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Crea notifica nel database
    await supabase
      .from('notifiche')
      .insert({
        user_id: user_id,
        titolo: payload.title || 'Notifica Push',
        messaggio: payload.body || payload.message || 'Notifica inviata',
        tipo: payload.tipo || 'sistema',
      })

    // NOTA: Per inviare effettivamente le notifiche push, serve una libreria web-push funzionante
    // o un'implementazione completa del protocollo Web Push
    
    return new Response(
      JSON.stringify({ 
        success: true,
        subscriptions_found: subscriptions.length,
        message: 'Notifica registrata. Per inviare push effettivi, usa index.ts con libreria web-push funzionante.'
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})

