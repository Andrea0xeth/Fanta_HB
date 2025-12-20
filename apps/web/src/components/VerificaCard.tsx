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
      className="card py-2"
    >
      {/* Header - Compact */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar user={prova.user} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{prova.user.nickname}</h4>
          <div className="flex items-center gap-1.5 text-[10px] text-subtle">
            {React.cloneElement(tipoIcon[prova.tipo] as React.ReactElement, { size: 12 })}
            <span className="capitalize">{prova.tipo}</span>
            <Clock size={10} />
            <span>{timeAgo()}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-semibold text-turquoise-400">
            {percentuale}%
          </div>
          <div className="text-[10px] text-subtle">
            {prova.voti_totali} voti
          </div>
        </div>
      </div>

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
              <div className="w-full h-full flex flex-col items-center justify-center text-subtle">
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
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => setIsVideoPlaying(true)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-coral-500/80 flex items-center justify-center">
                        <Play className="text-white ml-1" size={24} />
                      </div>
                    </div>
                    <img 
                      src={prova.contenuto} 
                      alt="Video thumbnail"
                      className="w-full h-full object-cover opacity-50"
                      onError={() => setVideoError(true)}
                    />
                  </div>
                ) : (
                  <video 
                    src={prova.contenuto}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                    onError={() => setVideoError(true)}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-subtle">
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
              className: "text-white/35" 
            })}
            <span className="text-white/35 ml-2 text-xs">Contenuto non disponibile</span>
          </div>
        )}
      </div>

      {/* Progress Bar - Compact */}
      <div className="mb-2">
        <div className="h-1.5 glass rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentuale}%` }}
            className={`h-full ${
              percentuale >= 66 ? 'bg-green-500' : 'bg-coral-500'
            }`}
          />
        </div>
        <p className="text-[10px] text-subtle mt-0.5 text-center">
          {percentuale >= 66 ? '✅ Soglia raggiunta!' : `Serve 66% (ancora ${66 - percentuale}%)`}
        </p>
      </div>

      {/* Vote Buttons - Compact */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, false)}
          className="flex-1 py-2.5 rounded-2xl glass border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-red-500/10 transition-colors"
        >
          <X size={14} />
          Rifiuta
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, true)}
          className="flex-1 py-2.5 rounded-2xl glass border border-green-500/30 text-green-400 font-semibold text-xs flex items-center justify-center gap-1 hover:bg-green-500/10 transition-colors"
        >
          <Check size={14} />
          Valida
        </motion.button>
      </div>
    </motion.div>
  );
};
