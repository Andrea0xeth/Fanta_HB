import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Image, Video, FileText, Clock } from 'lucide-react';
import type { ProvaQuest } from '../types';

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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {prova.user.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{prova.user.nickname}</h4>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
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
          <div className="text-[10px] text-gray-500">
            {prova.voti_totali} voti
          </div>
        </div>
      </div>

      {/* Content Preview - Compact */}
      <div className="mb-2 rounded-xl overflow-hidden glass p-2">
        {prova.tipo === 'foto' && (
          <div className="aspect-video glass rounded-lg flex items-center justify-center">
            <Image className="text-gray-600" size={32} />
            <span className="text-gray-600 ml-2 text-xs">Anteprima foto</span>
          </div>
        )}
        {prova.tipo === 'video' && (
          <div className="aspect-video glass rounded-lg flex items-center justify-center">
            <Video className="text-gray-600" size={32} />
            <span className="text-gray-600 ml-2 text-xs">Anteprima video</span>
          </div>
        )}
        {prova.tipo === 'testo' && (
          <p className="text-gray-300 text-xs italic line-clamp-3">"{prova.contenuto}"</p>
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
        <p className="text-[10px] text-gray-500 mt-0.5 text-center">
          {percentuale >= 66 ? '✅ Soglia raggiunta!' : `Serve 66% (ancora ${66 - percentuale}%)`}
        </p>
      </div>

      {/* Vote Buttons - Compact */}
      <div className="flex gap-1.5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, false)}
          className="flex-1 py-2 rounded-xl glass border border-red-500/30 text-red-400 font-semibold text-xs flex items-center justify-center gap-1"
        >
          <X size={14} />
          Rifiuta
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, true)}
          className="flex-1 py-2 rounded-xl glass border border-green-500/30 text-green-400 font-semibold text-xs flex items-center justify-center gap-1"
        >
          <Check size={14} />
          Valida
        </motion.button>
      </div>
    </motion.div>
  );
};
