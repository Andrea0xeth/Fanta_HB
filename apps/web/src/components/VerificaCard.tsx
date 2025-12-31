import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  const MIN_VOTES_FOR_VALIDATION = 10;
  
  const percentuale = prova.voti_totali > 0 
    ? Math.round((prova.voti_positivi / prova.voti_totali) * 100) 
    : 0;
  
  const timeAgo = () => {
    const diff = Date.now() - new Date(prova.created_at).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h fa`;
    return `${minutes}m fa`;
  };

  const isValidUrl = (url: string) => {
    try {
      return url && (url.startsWith('http://') || url.startsWith('https://'));
    } catch {
      return false;
    }
  };

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
          <div className="relative aspect-video bg-gray-900/50">
            {!imageError ? (
              <img 
                src={prova.contenuto} 
                alt="Prova quest"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
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
            animate={{ width: `${percentuale}%` }}
            className={`h-full ${
              percentuale >= 66 ? 'bg-green-500' : 'bg-coral-500'
            }`}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-center">
          {prova.voti_totali < MIN_VOTES_FOR_VALIDATION
            ? `Servono ${MIN_VOTES_FOR_VALIDATION} voti (mancano ${MIN_VOTES_FOR_VALIDATION - prova.voti_totali})`
            : percentuale >= 66
              ? '✅ Soglia raggiunta!'
              : `Serve 66% (ancora ${66 - percentuale}%)`}
        </p>
      </div>

      {/* Vote Buttons - Snello */}
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
    </motion.div>
  );
};
