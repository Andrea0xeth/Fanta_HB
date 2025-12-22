import { supabase } from './supabase';

type AdminAction =
  | 'delete_users'
  | 'reset_user_points'
  | 'clear_prove_quest'
  | 'delete_completed_gare'
  | 'reshuffle_teams';

type AdminMaintenanceResponse =
  | { success: true; [k: string]: any }
  | { error: string; details?: string };

export async function adminMaintenance(
  action: AdminAction,
  payload: Record<string, unknown> = {}
): Promise<AdminMaintenanceResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl) return { error: 'SUPABASE_URL mancante' };

  // Prefer Supabase session token if present (email/password).
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const adminTokenKey = 'admin_maintenance_token';
  let adminToken = localStorage.getItem(adminTokenKey) || '';

  if (!token && !adminToken) {
    const entered = window.prompt('Inserisci PIN Manutenzione Admin');
    adminToken = (entered || '').trim();
    if (adminToken) localStorage.setItem(adminTokenKey, adminToken);
  }

  if (!token && !adminToken) {
    return { error: 'PIN mancante', details: 'Inserisci il PIN per usare la Manutenzione.' };
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-maintenance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(adminToken ? { 'x-admin-token': adminToken } : {}),
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
    // If PIN is wrong, clear it so the next call will prompt again.
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(adminTokenKey);
    }
    return { error: data?.error || 'Errore', details: data?.details || `HTTP ${res.status}` };
  }

  return data as AdminMaintenanceResponse;
}


