import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Swords, Trophy, Radio } from 'lucide-react';
import type { Gara } from '../types';

interface GaraCardProps {
  gara: Gara;
  isAdmin?: boolean;
  onAssegnaVincitore?: (garaId: string, vincitoreId: string) => void;
}

export const GaraCard: React.FC<GaraCardProps> = ({ gara, isAdmin, onAssegnaVincitore }) => {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLive = gara.stato === 'live';
  const isCompleted = gara.stato === 'completata';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card ${isLive ? 'border-coral-500/50 glow-coral' : ''} ${isCompleted ? 'opacity-70' : ''}`}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-0.5 badge bg-red-500/20 text-red-400">
              <Radio size={10} className="animate-pulse" />
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="badge bg-green-500/20 text-green-400">
              Completata
            </span>
          ) : (
            <span className="badge bg-gray-700 text-gray-400">
              <Clock size={10} className="inline mr-0.5" />
              {formatTime(gara.orario)}
            </span>
          )}
          <span className="text-party-300 font-semibold text-xs">
            {gara.punti_in_palio}pts
          </span>
        </div>
        <Swords className="text-gray-600" size={16} />
      </div>

      {/* Team VS - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex-1 text-center p-2 rounded-xl ${
          gara.vincitore_id === gara.squadra_a_id 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'glass'
        }`}>
          <div className="text-2xl mb-0.5">{gara.squadra_a?.emoji}</div>
          <div className="font-semibold text-xs truncate">{gara.squadra_a?.nome}</div>
        </div>
        
        <div className="px-2 text-gray-600 font-bold text-xs">VS</div>
        
        <div className={`flex-1 text-center p-2 rounded-xl ${
          gara.vincitore_id === gara.squadra_b_id 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'glass'
        }`}>
          <div className="text-2xl mb-0.5">{gara.squadra_b?.emoji}</div>
          <div className="font-semibold text-xs truncate">{gara.squadra_b?.nome}</div>
        </div>
      </div>

      {/* Gara Name - Compact */}
      <h3 className="text-center font-semibold text-gray-300 text-sm mb-1">
        🎯 {gara.nome}
      </h3>
      <p className="text-center text-xs text-gray-500 mb-2 line-clamp-2">{gara.descrizione}</p>

      {/* Winner Badge - Compact */}
      {isCompleted && gara.vincitore_id && (
        <div className="flex items-center justify-center gap-1.5 text-green-400 mb-2">
          <Trophy size={14} />
          <span className="font-semibold text-xs">
            Vincitore: {gara.vincitore_id === gara.squadra_a_id ? gara.squadra_a?.nome : gara.squadra_b?.nome}
          </span>
        </div>
      )}

      {/* Admin Controls - Compact */}
      {isAdmin && !isCompleted && (
        <div className="flex gap-1.5">
          <button
            onClick={() => onAssegnaVincitore?.(gara.id, gara.squadra_a_id)}
            className="flex-1 py-1.5 rounded-xl glass text-xs font-medium transition-colors"
          >
            {gara.squadra_a?.emoji} Vince
          </button>
          <button
            onClick={() => onAssegnaVincitore?.(gara.id, gara.squadra_b_id)}
            className="flex-1 py-1.5 rounded-xl glass text-xs font-medium transition-colors"
          >
            {gara.squadra_b?.emoji} Vince
          </button>
        </div>
      )}
    </motion.div>
  );
};
