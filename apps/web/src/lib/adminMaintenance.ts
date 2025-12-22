import { supabase } from './supabase';

type AdminAction =
  | 'delete_users'
  | 'reset_user_points'
  | 'clear_prove_quest'
  | 'delete_completed_gare';

type AdminMaintenanceResponse =
  | { success: true; [k: string]: any }
  | { error: string; details?: string };

export async function adminMaintenance(
  action: AdminAction,
  payload: Record<string, unknown> = {}
): Promise<AdminMaintenanceResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl) return { error: 'SUPABASE_URL mancante' };

  // Require a real Supabase session for these destructive ops
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return {
      error: 'Sessione mancante',
      details: 'Per le operazioni di manutenzione devi essere loggato con email/password (sessione Supabase).',
    };
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    const text = await res.text();
    return { error: `Risposta non valida (${res.status})`, details: text.slice(0, 500) };
  }

  if (!res.ok) {
    return { error: data?.error || 'Errore', details: data?.details || `HTTP ${res.status}` };
  }

  return data as AdminMaintenanceResponse;
}


