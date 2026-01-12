import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Loader2, Download, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Avatar';

// Blocca scroll quando modale è aperto
const useLockScroll = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;

    // Blocca scroll
    html.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      // Ripristina scroll
      html.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY.toString()) * -1);
      }
    };
  }, [isOpen]);
};

interface GalleryItem {
  id: string;
  tipo: 'foto' | 'video';
  contenuto: string;
  user_id: string;
  user_nickname: string;
  user_avatar?: string;
  quest_titolo: string;
  quest_emoji?: string;
  created_at: string;
}

export const GalleriaPage: React.FC = () => {
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'foto' | 'video'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Blocca scroll quando modale è aperto
  useLockScroll(selectedItem !== null);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  // Lista utenti unici per il filtro
  const uniqueUsers = useMemo(() => {
    const users = new Map<string, { id: string; nickname: string; avatar?: string }>();
    allItems.forEach(item => {
      if (!users.has(item.user_id)) {
        users.set(item.user_id, {
          id: item.user_id,
          nickname: item.user_nickname,
          avatar: item.user_avatar,
        });
      }
    });
    return Array.from(users.values()).sort((a, b) => a.nickname.localeCompare(b.nickname));
  }, [allItems]);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      console.log('[Galleria] Caricamento contenuti...');
      
      // 1. Carica tutti gli utenti e le prove in parallelo
      const [usersResult, proveResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, nickname, avatar')
          .order('nickname'),
        supabase
          .from('prove_quest')
          .select(`
            *,
            user:users(nickname, avatar),
            quest:quest(titolo, emoji)
          `)
          .in('tipo', ['foto', 'video'])
      ]);

      if (usersResult.error) {
        console.error('[Galleria] Errore caricamento utenti:', usersResult.error);
        throw usersResult.error;
      }

      const users = (usersResult.data || []) as Array<{ id: string; nickname: string; avatar: string | null }>;
      console.log('[Galleria] Utenti trovati:', users.length);

      // Crea una mappa per associare file path a info quest
      const proveMap = new Map<string, any>();
      (proveResult.data || []).forEach((prova: any) => {
        if (prova.contenuto) {
          // Estrai il path dal contenuto (rimuovi dominio se presente)
          const path = prova.contenuto.split('/storage/v1/object/public/prove-quest/')[1] || prova.contenuto;
          proveMap.set(path, prova);
        }
      });

      // 2. Processa gli utenti in batch paralleli (max 5 alla volta)
      const BATCH_SIZE = 5;
      const allGalleryItems: GalleryItem[] = [];

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        
        // Processa batch in parallelo
        const batchResults = await Promise.all(
          batch.map(async (user) => {
            try {
              // Lista file nella cartella principale (limita a 100 file)
              const { data: filesData, error: filesError } = await supabase.storage
                .from('prove-quest')
                .list(user.id, {
                  limit: 100,
                  offset: 0,
                  sortBy: { column: 'created_at', order: 'desc' }
                });

              if (filesError || !filesData) {
                return [];
              }

              const userItems: GalleryItem[] = [];

              // Processa file diretti
              const mediaFiles = filesData.filter((file: any) => {
                if (!file.id) return false;
                const ext = file.name.toLowerCase().split('.').pop();
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                const videoExts = ['mp4', 'mov', 'webm', 'avi'];
                return imageExts.includes(ext || '') || videoExts.includes(ext || '');
              });

              // Crea URL pubblici in batch
              const fileItems = await Promise.all(
                mediaFiles.map(async (file: any) => {
                  const filePath = `${user.id}/${file.name}`;
                  const { data: urlData } = supabase.storage
                    .from('prove-quest')
                    .getPublicUrl(filePath);

                  if (!urlData?.publicUrl) return null;

                  const provaInfo = proveMap.get(filePath);
                  const ext = file.name.toLowerCase().split('.').pop();
                  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                  const tipo = imageExts.includes(ext || '') ? 'foto' : 'video';

                  return {
                    id: file.id || `${user.id}-${file.name}`,
                    tipo: tipo as 'foto' | 'video',
                    contenuto: urlData.publicUrl,
                    user_id: user.id,
                    user_nickname: user.nickname || 'Anonimo',
                    user_avatar: user.avatar || undefined,
                    quest_titolo: provaInfo?.quest?.titolo || 'Foto personale',
                    quest_emoji: provaInfo?.quest?.emoji || '📸',
                    created_at: file.created_at || file.updated_at || new Date().toISOString(),
                  };
                })
              );

              userItems.push(...fileItems.filter((item) => item !== null) as GalleryItem[]);

              // Processa sottocartelle (solo prime 10 cartelle, max 20 file per cartella)
              const folders = filesData.filter((file: any) => !file.id && file.name).slice(0, 10);
              
              const folderPromises = folders.map(async (folder: any) => {
                try {
                  const { data: subFilesData } = await supabase.storage
                    .from('prove-quest')
                    .list(`${user.id}/${folder.name}`, {
                      limit: 20,
                      offset: 0,
                      sortBy: { column: 'created_at', order: 'desc' }
                    });

                  if (!subFilesData) return [];

                  const mediaSubFiles = subFilesData.filter((subFile: any) => {
                    if (!subFile.id) return false;
                    const ext = subFile.name.toLowerCase().split('.').pop();
                    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                    const videoExts = ['mp4', 'mov', 'webm', 'avi'];
                    return imageExts.includes(ext || '') || videoExts.includes(ext || '');
                  });

                  return Promise.all(
                    mediaSubFiles.map(async (subFile: any) => {
                      const filePath = `${user.id}/${folder.name}/${subFile.name}`;
                      const { data: urlData } = supabase.storage
                        .from('prove-quest')
                        .getPublicUrl(filePath);

                      if (!urlData?.publicUrl) return null;

                      const provaInfo = proveMap.get(filePath);
                      const ext = subFile.name.toLowerCase().split('.').pop();
                      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                      const tipo = imageExts.includes(ext || '') ? 'foto' : 'video';

                      return {
                        id: subFile.id || `${user.id}-${folder.name}-${subFile.name}`,
                        tipo: tipo as 'foto' | 'video',
                        contenuto: urlData.publicUrl,
                        user_id: user.id,
                        user_nickname: user.nickname || 'Anonimo',
                        user_avatar: user.avatar || undefined,
                        quest_titolo: provaInfo?.quest?.titolo || 'Foto personale',
                        quest_emoji: provaInfo?.quest?.emoji || '📸',
                        created_at: subFile.created_at || subFile.updated_at || new Date().toISOString(),
                      };
                    })
                  );
                } catch (err) {
                  console.warn(`[Galleria] Errore sottocartella ${folder.name}:`, err);
                  return [];
                }
              });

              const folderItems = (await Promise.all(folderPromises)).flat();
              userItems.push(...folderItems.filter((item) => item !== null) as GalleryItem[]);

              return userItems;
            } catch (err) {
              console.warn(`[Galleria] Errore utente ${user.nickname}:`, err);
              return [];
            }
          })
        );

        // Aggiungi risultati del batch
        allGalleryItems.push(...batchResults.flat());

        // Aggiorna UI progressivamente (opzionale, per feedback visivo)
        if (i + BATCH_SIZE < users.length) {
          setAllItems([...allGalleryItems]);
        }
      }

      // Ordina per data (più recenti prima)
      allGalleryItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('[Galleria] Totale elementi caricati:', allGalleryItems.length);
      setAllItems(allGalleryItems);
    } catch (error) {
      console.error('[Galleria] Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per scaricare il file
  const handleDownload = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.contenuto);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Estrai estensione dal contenuto o usa default
      const extension = item.tipo === 'foto' ? 'jpg' : 'mp4';
      const filename = `${item.user_nickname}_${item.quest_titolo.replace(/\s+/g, '_')}.${extension}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Galleria] Errore download:', error);
    }
  };

  // Filtra items combinando tipo e utente
  const filteredItems = useMemo(() => {
    let filtered = allItems;
    
    // Filtra per tipo
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.tipo === filter);
    }
    
    // Filtra per utente
    if (userFilter !== 'all') {
      filtered = filtered.filter(item => item.user_id === userFilter);
    }
    
    return filtered;
  }, [allItems, filter, userFilter]);

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display font-bold text-lg text-gradient">Galleria Fotografie e Video</h1>
        </div>

        {/* Filtri */}
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            Tutti
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('foto')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filter === 'foto'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <ImageIcon size={14} />
            Foto
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter('video')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filter === 'video'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Video size={14} />
            Video
          </motion.button>
          
          {/* Filtro persona */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <User size={14} className="text-gray-400 flex-shrink-0" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent text-gray-300 focus:outline-none focus:ring-0 border-0 p-0 cursor-pointer"
            >
              <option value="all">Tutte</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nickname}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content - Grid Gallery */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="text-coral-500 animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ImageIcon size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 text-sm">Nessun contenuto disponibile</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedItem(item)}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 cursor-pointer group"
              >
                {item.tipo === 'foto' ? (
                  <img
                    src={item.contenuto}
                    alt={item.quest_titolo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <video
                    src={item.contenuto}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                )}
                
                {/* Overlay con info - sempre visibile */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Avatar 
                        user={{ 
                          id: item.user_id, 
                          nickname: item.user_nickname,
                          avatar: item.user_avatar 
                        }} 
                        size="sm" 
                      />
                      <span className="text-[10px] text-white font-semibold truncate">
                        {item.user_nickname}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-200 truncate">
                      {item.quest_emoji} {item.quest_titolo}
                    </p>
                  </div>
                </div>

                {/* Icona tipo */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                  {item.tipo === 'foto' ? (
                    <ImageIcon size={14} className="text-white" />
                  ) : (
                    <Video size={14} className="text-white" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal per visualizzazione fullscreen */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[90vw] max-h-[90vh] bg-dark rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar 
                    user={{ 
                      id: selectedItem.user_id, 
                      nickname: selectedItem.user_nickname,
                      avatar: selectedItem.user_avatar 
                    }} 
                    size="sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {selectedItem.user_nickname}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {selectedItem.quest_emoji} {selectedItem.quest_titolo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(selectedItem)}
                    className="text-gray-300 hover:text-white transition-colors rounded-full p-1.5 hover:bg-white/10"
                    aria-label="Scarica"
                    title="Scarica file"
                  >
                    <Download size={18} />
                  </motion.button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-300 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                    aria-label="Chiudi"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Contenuto */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
                {selectedItem.tipo === 'foto' ? (
                  <img
                    src={selectedItem.contenuto}
                    alt={selectedItem.quest_titolo}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={() => {
                      console.error('[Galleria] Errore caricamento immagine:', selectedItem.contenuto);
                    }}
                  />
                ) : (
                  <video
                    src={selectedItem.contenuto}
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-full rounded-lg"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
