import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Configurazione Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper per verificare se Supabase è configurato
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl) && 
         Boolean(supabaseAnonKey) &&
         supabaseUrl !== 'https://your-project.supabase.co';
};

// Storage bucket name per file upload
export const STORAGE_BUCKET = 'prove-quest';

// Helper per upload file
export const uploadProofFile = async (
  file: File, 
  userId: string, 
  questId: string
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${questId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

// Helper per eliminare file
export const deleteProofFile = async (filePath: string): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  return !error;
};
