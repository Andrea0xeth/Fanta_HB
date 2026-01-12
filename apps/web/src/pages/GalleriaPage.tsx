import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Loader2, Download, User, ZoomIn, ZoomOut } from 'lucide-react';
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
  const [zoomLevel, setZoomLevel] = useState<2 | 4 | 6>(2); // 2 = 8 foto, 4 = 16 foto, 6 = 32 foto
  const [touchedItem, setTouchedItem] = useState<string | null>(null);

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
          .in('stato', ['validata', 'in_verifica'])
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

      // Funzione ricorsiva per listare tutti i file in una cartella
      const listAllFiles = async (path: string, maxDepth: number = 3): Promise<GalleryItem[]> => {
        const items: GalleryItem[] = [];
        
        if (maxDepth <= 0) return items;

        try {
          // Lista tutti i file nella cartella (senza limite)
          let allFiles: any[] = [];
          let offset = 0;
          const limit = 1000; // Supabase max limit
          let hasMore = true;

          while (hasMore) {
            const { data: filesData, error: filesError } = await supabase.storage
              .from('prove-quest')
              .list(path, {
                limit,
                offset,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (filesError) {
              console.warn(`[Galleria] Errore lista ${path}:`, filesError);
              break;
            }

            if (!filesData || filesData.length === 0) {
              break;
            }

            console.log(`[Galleria] Cartella ${path}: trovati ${filesData.length} elementi (offset: ${offset})`);
            allFiles.push(...filesData);
            hasMore = filesData.length === limit;
            offset += limit;
          }

          console.log(`[Galleria] Cartella ${path}: totale ${allFiles.length} elementi`);

          // Processa file diretti (tutti i file con id, non solo quelli con estensione media)
          const mediaFiles = allFiles.filter((file: any) => {
            // Se ha un id, è un file (non una cartella)
            if (!file.id) return false;
            
            // Controlla estensione
            const ext = file.name.toLowerCase().split('.').pop();
            const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            const videoExts = ['mp4', 'mov', 'webm', 'avi', 'm4v', '3gp'];
            
            // Se non ha estensione o estensione sconosciuta, prova comunque (potrebbe essere un file senza estensione)
            if (!ext || (!imageExts.includes(ext) && !videoExts.includes(ext))) {
              console.log(`[Galleria] File senza estensione media riconosciuta: ${file.name} in ${path}`);
              // Includilo comunque, potrebbe essere un'immagine/video
              return true;
            }
            
            return imageExts.includes(ext) || videoExts.includes(ext);
          });

          console.log(`[Galleria] Cartella ${path}: ${mediaFiles.length} file media su ${allFiles.length} totali`);

          // Crea URL pubblici in batch
          const fileItems = await Promise.all(
            mediaFiles.map(async (file: any) => {
              const filePath = path ? `${path}/${file.name}` : file.name;
              
              try {
                const { data: urlData } = supabase.storage
                  .from('prove-quest')
                  .getPublicUrl(filePath);

                if (!urlData?.publicUrl) {
                  console.warn(`[Galleria] Nessun URL pubblico per ${filePath}`);
                  return null;
                }

                const provaInfo = proveMap.get(filePath);
                const ext = file.name.toLowerCase().split('.').pop();
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
                const tipo = imageExts.includes(ext || '') ? 'foto' : 'video';

                // Estrai user_id dal path
                const pathParts = filePath.split('/');
                const userId = pathParts[0];
                const user = users.find(u => u.id === userId);

                return {
                  id: file.id || filePath,
                  tipo: tipo as 'foto' | 'video',
                  contenuto: urlData.publicUrl,
                  user_id: userId,
                  user_nickname: user?.nickname || 'Anonimo',
                  user_avatar: user?.avatar || undefined,
                  quest_titolo: provaInfo?.quest?.titolo || 'Cerca Silverio',
                  quest_emoji: provaInfo?.quest?.emoji || '🔍',
                  created_at: file.created_at || file.updated_at || new Date().toISOString(),
                };
              } catch (err) {
                console.warn(`[Galleria] Errore processamento file ${filePath}:`, err);
                return null;
              }
            })
          );

          const validItems = fileItems.filter((item) => item !== null) as GalleryItem[];
          console.log(`[Galleria] Cartella ${path}: ${validItems.length} file validi creati`);
          items.push(...validItems);

          // Processa sottocartelle ricorsivamente
          const folders = allFiles.filter((file: any) => !file.id && file.name);
          console.log(`[Galleria] Cartella ${path}: ${folders.length} sottocartelle da processare`);
          
          const folderItems = await Promise.all(
            folders.map(async (folder: any) => {
              const subPath = path ? `${path}/${folder.name}` : folder.name;
              return listAllFiles(subPath, maxDepth - 1);
            })
          );

          items.push(...folderItems.flat());
        } catch (err) {
          console.warn(`[Galleria] Errore lista cartella ${path}:`, err);
        }

        return items;
      };

      // 2. Processa gli utenti in batch paralleli (max 3 alla volta per non sovraccaricare)
      const BATCH_SIZE = 3;
      const allGalleryItems: GalleryItem[] = [];

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        
        // Processa batch in parallelo
        const batchResults = await Promise.all(
          batch.map(async (user) => {
            try {
              console.log(`[Galleria] Caricamento file per ${user.nickname} (${user.id})...`);
              const userItems = await listAllFiles(user.id, 3);
              console.log(`[Galleria] ✅ Trovati ${userItems.length} file per ${user.nickname} (${user.id})`);
              
              // Log dettagliato per debug
              if (user.id === 'd54b1c76-f55b-482d-adad-40fddc81d10d') {
                console.log(`[Galleria] DEBUG ${user.nickname}:`, {
                  totalItems: userItems.length,
                  items: userItems.map(item => ({
                    id: item.id,
                    path: item.contenuto,
                    tipo: item.tipo
                  }))
                });
              }
              
              return userItems;
            } catch (err) {
              console.warn(`[Galleria] Errore utente ${user.nickname}:`, err);
              return [];
            }
          })
        );

        // Aggiungi risultati del batch
        allGalleryItems.push(...batchResults.flat());

        // Aggiorna UI progressivamente
        setAllItems([...allGalleryItems]);
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
        <div className="flex gap-2 flex-wrap items-center">
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

          {/* Controllo Zoom */}
          <div className="flex items-center gap-1 ml-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (zoomLevel === 2) setZoomLevel(4);
                else if (zoomLevel === 4) setZoomLevel(6);
              }}
              disabled={zoomLevel === 6}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                zoomLevel === 6
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Zoom out (più foto)"
            >
              <ZoomOut size={14} />
            </motion.button>
            <span className="text-xs text-gray-400 px-2">
              {zoomLevel === 2 ? '8' : zoomLevel === 4 ? '16' : '32'} foto
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (zoomLevel === 6) setZoomLevel(4);
                else if (zoomLevel === 4) setZoomLevel(2);
              }}
              disabled={zoomLevel === 2}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                zoomLevel === 2
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              title="Zoom in (meno foto)"
            >
              <ZoomIn size={14} />
            </motion.button>
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
          <div className={`grid gap-2 ${
            zoomLevel === 2 ? 'grid-cols-2' : 
            zoomLevel === 4 ? 'grid-cols-4' : 
            'grid-cols-6'
          }`}>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedItem(item)}
                onTouchStart={() => setTouchedItem(item.id)}
                onTouchEnd={() => setTimeout(() => setTouchedItem(null), 300)}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 cursor-pointer group touch-manipulation"
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
                
                {/* Overlay con info - visibile solo al hover/touch */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-200 ${
                  touchedItem === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
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
                    {item.quest_titolo !== 'Cerca Silverio' && (
                      <p className="text-[10px] text-gray-200 truncate">
                        {item.quest_emoji} {item.quest_titolo}
                      </p>
                    )}
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
                    {selectedItem.quest_titolo !== 'Cerca Silverio' && (
                      <p className="text-xs text-gray-400 truncate">
                        {selectedItem.quest_emoji} {selectedItem.quest_titolo}
                      </p>
                    )}
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
