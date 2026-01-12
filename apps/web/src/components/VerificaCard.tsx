import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Image, Video, FileText, Clock, Play } from 'lucide-react';
import type { ProvaQuest } from '../types';
import { Avatar } from './Avatar';

interface VerificaCardProps {
  prova: ProvaQuest;
  onVote: (provaId: string, valore: boolean) => void;
}

const tipoIcon = {
  foto: <Image size={12} />,
  video: <Video size={12} />,
  testo: <FileText size={12} />,
};

export const VerificaCard: React.FC<VerificaCardProps> = ({ prova, onVote }) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  
  // Soglia unica: 5 conferme (voti positivi)
  const MIN_VOTES_FOR_VALIDATION_NORMAL = 5;
  
  const percentuale = prova.voti_totali > 0 
    ? Math.round((prova.voti_positivi / prova.voti_totali) * 100) 
    : 0;
  
  const hasMinVotes = prova.voti_positivi >= MIN_VOTES_FOR_VALIDATION_NORMAL;
  
  const timeAgo = () => {
    const diff = Date.now() - new Date(prova.created_at).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h fa`;
    return `${minutes}m fa`;
  };

  const formatDateTime = () => {
    const date = new Date(prova.created_at);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const isValidUrl = (url: string) => {
    try {
      if (!url) return false;
      // Controlla se è un URL valido (http/https) o un URL Supabase storage
      return (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'));
    } catch {
      return false;
    }
  };

  // Blocca scroll quando overlay immagine è aperto
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expandedImageUrl) {
        setExpandedImageUrl(null);
      }
    };

    const preventScroll = (e: TouchEvent) => {
      if (expandedImageUrl) {
        e.preventDefault();
      }
    };

    const preventWheel = (e: WheelEvent) => {
      if (expandedImageUrl) {
        // Blocca sempre lo scroll della pagina quando il modale è aperto
        // Permetti scroll solo se l'evento proviene dall'interno del modale
        const target = e.target as HTMLElement;
        const modalContent = target.closest('[class*="max-w-"]');
        const modalOverlay = target.closest('[class*="fixed inset-0"]');
        
        // Se l'evento non proviene dal contenuto scrollabile del modale, bloccalo
        if (!modalContent || (modalOverlay && target === modalOverlay)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const preventPageScroll = (e: Event) => {
      if (expandedImageUrl) {
        // Previeni qualsiasi scroll della pagina
        const target = e.target as HTMLElement;
        const modalContent = target.closest('[class*="max-w-"]');
        if (!modalContent) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    if (expandedImageUrl) {
      // Blocca scroll del body e html
      const scrollY = window.scrollY;
      const html = document.documentElement;
      const body = document.body;
      
      // Blocca scroll
      html.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      
      // Previeni scroll su mobile e desktop
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventWheel, { passive: false });
      document.addEventListener('scroll', preventPageScroll, { passive: false, capture: true });
      window.addEventListener('scroll', preventPageScroll, { passive: false, capture: true });
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      // Ripristina scroll
      const scrollY = document.body.style.top;
      const html = document.documentElement;
      const body = document.body;
      
      // Ripristina stili
      html.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      body.style.overflow = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('wheel', preventWheel);
      document.removeEventListener('scroll', preventPageScroll, { capture: true });
      window.removeEventListener('scroll', preventPageScroll, { capture: true });
      document.removeEventListener('keydown', handleEscape);
    };
  }, [expandedImageUrl]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="border-l-2 border-gray-700/30 pl-2 py-2"
    >
      {/* Header - Snello */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar user={prova.user} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate mb-0.5">{prova.user.nickname}</h4>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            {React.cloneElement(tipoIcon[prova.tipo] as React.ReactElement, { size: 10 })}
            <span className="capitalize">{prova.tipo}</span>
            <Clock size={10} />
            <span>{timeAgo()}</span>
            <span className="text-gray-500">•</span>
            <span>{formatDateTime()}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-turquoise-400">
            {percentuale}%
          </div>
          <div className="text-[10px] text-gray-400">
            {prova.voti_totali} voti
          </div>
        </div>
      </div>

      {/* Quest info (titolo/descrizione) */}
      {prova.quest && (
        <div className="mb-2 px-2 py-1.5 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400">Quest</div>
              <div className="text-xs font-semibold text-gray-100 truncate">
                {prova.quest.emoji} {prova.quest.titolo}
              </div>
            </div>
            <div className="text-[10px] font-semibold text-coral-300 whitespace-nowrap">
              +{prova.quest.punti} pt
            </div>
          </div>
          {prova.quest.descrizione && (
            <p className="text-[11px] text-gray-300 leading-snug mt-1 line-clamp-2">
              {prova.quest.descrizione}
            </p>
          )}
        </div>
      )}

      {/* Content Preview - Mostra contenuto reale */}
      <div className="mb-2 rounded-2xl overflow-hidden glass">
        {prova.tipo === 'foto' && isValidUrl(prova.contenuto) ? (
          <div 
            className="relative aspect-video bg-gray-900/50 cursor-pointer group hover:opacity-90 transition-opacity" 
            onClick={() => {
              if (isValidUrl(prova.contenuto)) {
                // La foto è già caricata nella preview: qui la espandiamo e basta
                setExpandedImageUrl(prova.contenuto);
              }
            }}
          >
            {!imageError ? (
              <>
                <img 
                  src={prova.contenuto} 
                  alt="Prova quest"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <Image size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <Image size={32} />
                <span className="text-xs mt-2">Errore caricamento immagine</span>
              </div>
            )}
          </div>
        ) : prova.tipo === 'video' && isValidUrl(prova.contenuto) ? (
          <div className="relative aspect-video bg-gray-900/50">
            {!videoError ? (
              <>
                {!isVideoPlaying ? (
                  <button
                    type="button"
                    className="w-full h-full relative flex items-center justify-center"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    {/* Carichiamo solo metadata per evitare download aggressivi prima del click */}
                    <video
                      src={prova.contenuto} 
                      preload="metadata"
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                      onError={() => setVideoError(true)}
                    />
                    <div className="relative z-10 w-16 h-16 rounded-full bg-coral-500/80 flex items-center justify-center">
                      <Play className="text-white ml-1" size={24} />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white/70">
                      Tocca per riprodurre
                  </div>
                  </button>
                ) : (
                  <video 
                    src={prova.contenuto}
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover"
                    onError={() => setVideoError(true)}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <Video size={32} />
                <span className="text-xs mt-2">Errore caricamento video</span>
              </div>
            )}
          </div>
        ) : prova.tipo === 'testo' ? (
          <div className="p-3">
            <p className="text-gray-300 text-xs leading-relaxed">"{prova.contenuto}"</p>
          </div>
        ) : (
          <div className="aspect-video glass rounded-xl flex items-center justify-center">
            {React.cloneElement(tipoIcon[prova.tipo] as React.ReactElement, { 
              size: 32, 
              className: "text-gray-600" 
            })}
            <span className="text-gray-600 ml-2 text-xs">Contenuto non disponibile</span>
          </div>
        )}
      </div>

      {/* Progress Bar - Snello */}
      <div className="mb-2">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (prova.voti_positivi / MIN_VOTES_FOR_VALIDATION_NORMAL) * 100)}%` }}
            className={`h-full ${
              hasMinVotes ? 'bg-green-500' : 'bg-coral-500'
            }`}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          {prova.voti_positivi < MIN_VOTES_FOR_VALIDATION_NORMAL
            ? `Servono ${MIN_VOTES_FOR_VALIDATION_NORMAL} conferme (mancano ${MIN_VOTES_FOR_VALIDATION_NORMAL - prova.voti_positivi})`
            : '✅ Soglia raggiunta!'}
        </p>
      </div>

      {/* Vote Buttons - Snello */}
      {prova.mio_voto !== undefined && prova.mio_voto !== null ? (
        <div className="flex gap-2">
          <div className="flex-1 py-2 rounded-xl bg-gray-800/50 border border-gray-600/50 text-gray-400 font-semibold text-xs flex items-center justify-center gap-1">
            {prova.mio_voto ? (
              <>
                <Check size={12} className="text-green-400" />
                <span>Hai validato</span>
              </>
            ) : (
              <>
                <X size={12} className="text-red-400" />
                <span>Hai rifiutato</span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onVote(prova.id, false)}
            className="flex-1 py-2 rounded-xl bg-gray-800/30 border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-red-500/10 transition-colors"
          >
            <X size={12} />
            Rifiuta
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onVote(prova.id, true)}
            className="flex-1 py-2 rounded-xl bg-gray-800/30 border border-green-500/30 text-green-400 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-green-500/10 transition-colors"
          >
            <Check size={12} />
            Valida
          </motion.button>
        </div>
      )}

      {/* Image Modal - Overlay Centrato */}
      <AnimatePresence>
        {expandedImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setExpandedImageUrl(null);
            }}
          >
            {/* Modal card - Centrato e più piccolo */}
            <motion.div
              key={expandedImageUrl}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[85vw] max-h-[85vh] bg-dark rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header mini con chiudi */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/40 backdrop-blur-sm flex-shrink-0">
                <div className="text-xs text-gray-200 font-semibold">Foto</div>
                <button
                  onClick={() => setExpandedImageUrl(null)}
                  className="text-gray-300 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                  aria-label="Chiudi"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Immagine - Fill del modale */}
              <div className="flex-1 overflow-auto p-2 flex items-center justify-center min-h-0">
                <img
                  src={expandedImageUrl}
                  alt="Prova quest - vista completa"
                  className="w-full h-full max-w-full max-h-full object-contain rounded-lg select-none"
                  draggable={false}
                  onError={() => {
                    console.error('[VerificaCard] Errore caricamento immagine nel modale:', expandedImageUrl);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
