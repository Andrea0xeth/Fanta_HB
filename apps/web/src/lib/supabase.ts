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
  try {
    // Nota: Non verifichiamo la sessione Supabase Auth perché usiamo WebAuthn
    // Le policy RLS permetteranno l'upload se configurate correttamente
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${questId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Proof] Inizio upload:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId,
      questId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || (fileExt === 'mov' || fileExt === 'mp4' ? 'video/quicktime' : 'application/octet-stream'),
      });

    if (error) {
      console.error('[Upload Proof] Errore upload:', error);
      console.error('[Upload Proof] Dettagli errore:', {
        message: error.message,
      });
      
      // Se l'errore è relativo ai permessi, fornisci un messaggio più chiaro
      if (error.message?.includes('new row violates row-level security') || 
          error.message?.includes('permission denied') ||
          error.message?.includes('row-level security policy')) {
        throw new Error('Permessi insufficienti per caricare il file. Verifica che le policy di storage siano configurate correttamente.');
      }
      
      throw new Error(`Errore durante l'upload: ${error.message || 'Errore sconosciuto'}`);
    }

    if (!data) {
      throw new Error('Nessun dato restituito dall\'upload');
    }

    console.log('[Upload Proof] Upload completato:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Impossibile ottenere l\'URL pubblico del file');
    }

    console.log('[Upload Proof] URL pubblico:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Upload Proof] Errore completo:', error);
    throw error; // Rilancia l'errore per gestirlo nel contesto
  }
};

// Helper per eliminare file
export const deleteProofFile = async (filePath: string): Promise<boolean> => {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  return !error;
};

// Helper per upload avatar utente
export const uploadAvatar = async (
  file: File, 
  userId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Avatar] Inizio upload:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('[Upload Avatar] Errore upload:', error);
      console.error('[Upload Avatar] Dettagli errore:', {
        message: error.message,
      });
      
      // Se l'errore è relativo ai permessi, fornisci un messaggio più chiaro
      if (error.message?.includes('new row violates row-level security') || 
          error.message?.includes('permission denied')) {
        throw new Error('Permessi insufficienti per caricare l\'immagine. Verifica le policy del bucket storage.');
      }
      
      throw new Error(`Errore upload: ${error.message || 'Errore sconosciuto'}`);
    }

    if (!data) {
      throw new Error('Nessun dato restituito dall\'upload');
    }

    console.log('[Upload Avatar] Upload completato:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Impossibile ottenere l\'URL pubblico del file');
    }

    console.log('[Upload Avatar] URL pubblico:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Upload Avatar] Errore completo:', error);
    throw error; // Rilancia l'errore per gestirlo nel contesto
  }
};

// Helper per upload foto chat squadra
export const uploadChatPhoto = async (
  file: File,
  userId: string,
  squadraId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `chat/${squadraId}/${userId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Chat Photo] Inizio upload:', {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      userId,
      squadraId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('[Upload Chat Photo] Errore upload:', error);
      if (error.message?.includes('new row violates row-level security') || 
          error.message?.includes('permission denied')) {
        throw new Error('Permessi insufficienti per caricare la foto. Verifica le policy del bucket storage.');
      }
      throw new Error(`Errore upload: ${error.message || 'Errore sconosciuto'}`);
    }

    if (!data) {
      throw new Error('Nessun dato restituito dall\'upload');
    }

    console.log('[Upload Chat Photo] Upload completato:', data.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!urlData?.publicUrl) {
      throw new Error('Impossibile ottenere l\'URL pubblico del file');
    }

    console.log('[Upload Chat Photo] URL pubblico:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Upload Chat Photo] Errore completo:', error);
    throw error;
  }
};
