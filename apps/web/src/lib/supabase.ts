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
    let fileToUpload = file;
    let fileExt = file.name.split('.').pop() || 'jpg';
    
    // Se è un'immagine, comprimila prima dell'upload (max 1920x1920, qualità 0.7)
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file, 1920, 1920, 0.7);
      fileExt = 'jpg'; // Sempre JPG dopo compressione
      
      console.log('[Upload Proof] Immagine compressa:', {
        originalSize: file.size,
        compressedSize: fileToUpload.size,
        compressionRatio: ((1 - fileToUpload.size / file.size) * 100).toFixed(1) + '%',
      });
    }
    
    const fileName = `${userId}/${questId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Proof] Inizio upload:', {
      fileName,
      fileSize: file.size,
      uploadSize: fileToUpload.size,
      fileType: file.type,
      userId,
      questId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type || (fileExt === 'mov' || fileExt === 'mp4' ? 'video/quicktime' : 'image/jpeg'),
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

// Helper per comprimere immagine
const compressImage = async (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.7): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcola dimensioni mantenendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossibile creare canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Impossibile comprimere immagine'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Errore caricamento immagine'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Errore lettura file'));
    reader.readAsDataURL(file);
  });
};

// Helper per ottimizzare URL immagine (la compressione avviene durante l'upload)
// Questa funzione può essere estesa in futuro per aggiungere parametri di trasformazione
export const getOptimizedImageUrl = (url: string): string => {
  // La compressione avviene durante l'upload, quindi ritorniamo l'URL originale
  return url;
};

// Helper per upload avatar utente
export const uploadAvatar = async (
  file: File, 
  userId: string
): Promise<string | null> => {
  try {
    // Comprimi immagine prima dell'upload (max 800x800, qualità 0.7)
    const compressedFile = await compressImage(file, 800, 800, 0.7);
    
    const fileExt = 'jpg'; // Sempre JPG dopo compressione
    const fileName = `avatars/${userId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Avatar] Inizio upload:', {
      fileName,
      fileSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%',
      fileType: file.type,
      userId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
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
    // Comprimi immagine prima dell'upload (max 1920x1920, qualità 0.7)
    const compressedFile = await compressImage(file, 1920, 1920, 0.7);
    
    const fileExt = 'jpg'; // Sempre JPG dopo compressione
    const fileName = `chat/${squadraId}/${userId}/${Date.now()}.${fileExt}`;
    
    console.log('[Upload Chat Photo] Inizio upload:', {
      fileName,
      fileSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%',
      fileType: file.type,
      userId,
      squadraId
    });
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
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
