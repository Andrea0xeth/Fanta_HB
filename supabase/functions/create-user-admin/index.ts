// Edge Function per creare utenti usando Admin API
// Bypassa la validazione email di Supabase Auth
// Deploy: supabase functions deploy create-user-admin

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    let requestBody
    try {
      requestBody = await req.json()
    } catch (err) {
      console.error('Error parsing request body:', err)
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

    const { email, password, user_metadata } = requestBody

    if (!email || !password) {
      console.error('Missing required fields:', { email: !!email, password: !!password })
      return new Response(
        JSON.stringify({ error: 'email and password are required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // Crea client Supabase con Service Role Key per usare Admin API
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
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

    console.log('Creating user with:', { email: email.trim().toLowerCase(), hasPassword: !!password })
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Usa Admin API per creare l'utente senza validazione email
    // email_confirm: false significa che l'email non deve essere confermata
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Imposta come confermato automaticamente
      user_metadata: user_metadata || {},
    })

    if (createError) {
      console.error('Error creating user:', {
        message: createError.message,
        status: createError.status,
        code: (createError as any).code,
        details: (createError as any).details,
        hint: (createError as any).hint,
      })
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user',
          details: createError.message,
          code: createError.status || (createError as any).code,
          hint: (createError as any).hint,
        }),
        { 
          status: createError.status || 422, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'User created but no user data returned' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          } 
        }
      )
    }

    // Restituisci i dati dell'utente (senza password)
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          email_confirmed_at: userData.user.email_confirmed_at,
          created_at: userData.user.created_at,
          user_metadata: userData.user.user_metadata,
        },
        // NOTA: Non restituiamo la sessione qui - il client dovrà fare signInWithPassword
        // per ottenere la sessione
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
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack,
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

