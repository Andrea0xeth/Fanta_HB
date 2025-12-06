import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Image, Video, FileText, Clock } from 'lucide-react';
import type { ProvaQuest } from '../types';

interface VerificaCardProps {
  prova: ProvaQuest;
  onVote: (provaId: string, valore: boolean) => void;
}

const tipoIcon = {
  foto: <Image size={16} />,
  video: <Video size={16} />,
  testo: <FileText size={16} />,
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
      className="card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold">
          {prova.user.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">{prova.user.nickname}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {tipoIcon[prova.tipo]}
            <span className="capitalize">{prova.tipo}</span>
            <Clock size={10} />
            <span>{timeAgo()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-turquoise-400">
            {percentuale}%
          </div>
          <div className="text-xs text-gray-500">
            {prova.voti_totali} voti
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mb-4 rounded-xl overflow-hidden bg-gray-900/50 p-4">
        {prova.tipo === 'foto' && (
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
            <Image className="text-gray-600" size={48} />
            <span className="text-gray-600 ml-2">Anteprima foto</span>
          </div>
        )}
        {prova.tipo === 'video' && (
          <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
            <Video className="text-gray-600" size={48} />
            <span className="text-gray-600 ml-2">Anteprima video</span>
          </div>
        )}
        {prova.tipo === 'testo' && (
          <p className="text-gray-300 text-sm italic">"{prova.contenuto}"</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentuale}%` }}
            className={`h-full ${
              percentuale >= 66 ? 'bg-green-500' : 'bg-coral-500'
            }`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {percentuale >= 66 ? '✅ Soglia raggiunta!' : `Serve 66% (ancora ${66 - percentuale}%)`}
        </p>
      </div>

      {/* Vote Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, false)}
          className="flex-1 py-3 rounded-xl bg-gray-800 border border-red-500/30 text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10"
        >
          <X size={18} />
          Rifiuta
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onVote(prova.id, true)}
          className="flex-1 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-semibold flex items-center justify-center gap-2 hover:bg-green-500/30"
        >
          <Check size={18} />
          Valida
        </motion.button>
      </div>
    </motion.div>
  );
};
