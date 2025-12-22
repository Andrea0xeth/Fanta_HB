import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-admin-token, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

type Action =
  | 'delete_users'
  | 'reset_user_points'
  | 'clear_prove_quest'
  | 'delete_completed_gare'

type JsonObject = Record<string, unknown>

function jsonResponse(status: number, body: JsonObject) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

async function getAuthUserIdOrThrow(supabaseUrl: string, serviceRoleKey: string, req: Request): Promise<string> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : authHeader
  if (!token) throw new Error('Missing Authorization bearer token')

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: serviceRoleKey,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Invalid session token (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { id?: string }
  if (!data?.id) throw new Error('Invalid token: missing user id')
  return data.id
}

function isValidAdminToken(req: Request): boolean {
  const expected = Deno.env.get('ADMIN_MAINTENANCE_TOKEN') || ''
  if (!expected) return false
  const provided = req.headers.get('x-admin-token') || ''
  return provided === expected
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse(500, {
      error: 'Server configuration error',
      details: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch (e) {
    return jsonResponse(400, { error: 'Invalid JSON', details: e instanceof Error ? e.message : String(e) })
  }

  const action = payload?.action as Action | undefined
  if (!action) return jsonResponse(400, { error: 'Missing action' })

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify admin: allow either Supabase session (email/password) OR admin PIN token
  const pinOk = isValidAdminToken(req)
  if (!pinOk) {
    let callerId = ''
    try {
      callerId = await getAuthUserIdOrThrow(supabaseUrl, supabaseServiceKey, req)
    } catch (e) {
      return jsonResponse(401, {
        error: 'Unauthorized',
        details: 'Missing/invalid auth. Provide Authorization Bearer token or x-admin-token.',
      })
    }

    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from('users')
      .select('id,is_admin')
      .eq('id', callerId)
      .single()

    if (adminErr || !adminRow) return jsonResponse(403, { error: 'Forbidden', details: 'Admin profile not found' })
    if (!adminRow.is_admin) return jsonResponse(403, { error: 'Forbidden', details: 'Not an admin user' })
  }

  try {
    if (action === 'delete_users') {
      const userIds = (payload?.userIds as string[] | undefined) || []
      if (userIds.length === 0) return jsonResponse(400, { error: 'Missing userIds' })

      // Delete profiles (cascade handles related tables)
      const { error: delProfilesErr } = await supabaseAdmin.from('users').delete().in('id', userIds)
      if (delProfilesErr) throw delProfilesErr

      // Best-effort: delete auth users (some passkey-only users may not exist in auth)
      const authDeleted: string[] = []
      const authFailed: Array<{ id: string; error: string }> = []
      for (const id of userIds) {
        try {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
          if (error) throw error
          authDeleted.push(id)
        } catch (e) {
          authFailed.push({ id, error: e instanceof Error ? e.message : String(e) })
        }
      }

      return jsonResponse(200, {
        success: true,
        deleted_profiles: userIds.length,
        deleted_auth: authDeleted.length,
        auth_failed: authFailed,
      })
    }

    if (action === 'reset_user_points') {
      const userIds = (payload?.userIds as string[] | undefined) || []
      if (userIds.length === 0) return jsonResponse(400, { error: 'Missing userIds' })

      const alsoDeleteBonus = Boolean(payload?.alsoDeleteBonus)

      const { error: resetErr } = await supabaseAdmin.from('users').update({ punti_personali: 0 }).in('id', userIds)
      if (resetErr) throw resetErr

      if (alsoDeleteBonus) {
        const { error: delBonusErr } = await supabaseAdmin.from('bonus_punti').delete().in('user_id', userIds)
        if (delBonusErr) throw delBonusErr
      }

      return jsonResponse(200, { success: true, updated_users: userIds.length, deleted_bonus: alsoDeleteBonus })
    }

    if (action === 'clear_prove_quest') {
      const scope = (payload?.scope as string | undefined) || 'in_verifica'
      if (scope !== 'in_verifica' && scope !== 'all') {
        return jsonResponse(400, { error: 'Invalid scope. Use in_verifica or all.' })
      }

      if (scope === 'all') {
        const { error: delAllErr } = await supabaseAdmin.from('prove_quest').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (delAllErr) throw delAllErr

        // Reset completed_at for all assignments
        const { error: resetAssignErr } = await supabaseAdmin
          .from('user_quest_assignments')
          .update({ completed_at: null })
          .not('completed_at', 'is', null)
        if (resetAssignErr) throw resetAssignErr

        return jsonResponse(200, { success: true, scope, cleared: 'all' })
      }

      // scope === 'in_verifica'
      const { data: proofs, error: selErr } = await supabaseAdmin
        .from('prove_quest')
        .select('id,quest_id,user_id')
        .eq('stato', 'in_verifica')

      if (selErr) throw selErr
      const proofIds = (proofs || []).map((p: any) => p.id as string)
      const questIds = Array.from(new Set((proofs || []).map((p: any) => p.quest_id as string)))
      const userIds = Array.from(new Set((proofs || []).map((p: any) => p.user_id as string)))

      if (proofIds.length === 0) {
        return jsonResponse(200, { success: true, scope, deleted_proofs: 0 })
      }

      const { error: delErr } = await supabaseAdmin.from('prove_quest').delete().in('id', proofIds)
      if (delErr) throw delErr

      // Reset completed_at for affected assignments (approx: user IN + quest IN)
      if (userIds.length > 0 && questIds.length > 0) {
        const { error: resetAssignErr } = await supabaseAdmin
          .from('user_quest_assignments')
          .update({ completed_at: null })
          .in('user_id', userIds)
          .in('quest_id', questIds)
        if (resetAssignErr) throw resetAssignErr
      }

      return jsonResponse(200, { success: true, scope, deleted_proofs: proofIds.length })
    }

    if (action === 'delete_completed_gare') {
      const giorni = (payload?.giorni as number[] | undefined) || null

      let gareQuery = supabaseAdmin
        .from('gare')
        .select('id,vincitore_id,punti_in_palio,giorno,stato')
        .eq('stato', 'completata')

      if (giorni && Array.isArray(giorni) && giorni.length > 0) {
        gareQuery = gareQuery.in('giorno', giorni as any)
      }

      const { data: gare, error: gareErr } = await gareQuery
      if (gareErr) throw gareErr

      const garaIds = (gare || []).map((g: any) => g.id as string)
      if (garaIds.length === 0) return jsonResponse(200, { success: true, deleted_gare: 0, rolled_back: 0 })

      // Classifiche points
      const { data: classRows, error: classErr } = await supabaseAdmin
        .from('classifiche_gare')
        .select('gara_id,squadra_id,punti_assegnati')
        .in('gara_id', garaIds)
      if (classErr) throw classErr

      const deltaBySquadra = new Map<string, number>()
      for (const row of classRows || []) {
        const sid = (row as any).squadra_id as string
        const pts = Number((row as any).punti_assegnati || 0)
        deltaBySquadra.set(sid, (deltaBySquadra.get(sid) || 0) + pts)
      }

      // Winner-only points (gare without classifica)
      const classGaraIds = new Set((classRows || []).map((r: any) => r.gara_id as string))
      for (const g of gare || []) {
        const gid = (g as any).id as string
        if (classGaraIds.has(gid)) continue
        const winner = (g as any).vincitore_id as string | null
        const pts = Number((g as any).punti_in_palio || 0)
        if (winner) {
          deltaBySquadra.set(winner, (deltaBySquadra.get(winner) || 0) + pts)
        }
      }

      const squadreToUpdate = Array.from(deltaBySquadra.keys())
      if (squadreToUpdate.length > 0) {
        const { data: squadre, error: squadreErr } = await supabaseAdmin
          .from('squadre')
          .select('id,punti_squadra')
          .in('id', squadreToUpdate)
        if (squadreErr) throw squadreErr

        for (const s of squadre || []) {
          const id = (s as any).id as string
          const current = Number((s as any).punti_squadra || 0)
          const delta = deltaBySquadra.get(id) || 0
          const next = Math.max(0, current - delta)
          const { error: updErr } = await supabaseAdmin.from('squadre').update({ punti_squadra: next }).eq('id', id)
          if (updErr) throw updErr
        }
      }

      // Delete completed gare (classifiche_gare cascades)
      const { error: delGareErr } = await supabaseAdmin.from('gare').delete().in('id', garaIds)
      if (delGareErr) throw delGareErr

      return jsonResponse(200, {
        success: true,
        deleted_gare: garaIds.length,
        rolled_back_squadre: squadreToUpdate.length,
      })
    }

    return jsonResponse(400, { error: 'Unsupported action', action })
  } catch (e) {
    return jsonResponse(500, { error: 'Operation failed', details: e instanceof Error ? e.message : String(e) })
  }
})


