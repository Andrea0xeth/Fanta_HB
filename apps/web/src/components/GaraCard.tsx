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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1 badge bg-red-500/20 text-red-400">
              <Radio size={12} className="animate-pulse" />
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="badge bg-green-500/20 text-green-400">
              Completata
            </span>
          ) : (
            <span className="badge bg-gray-700 text-gray-400">
              <Clock size={12} className="inline mr-1" />
              {formatTime(gara.orario)}
            </span>
          )}
          <span className="text-party-300 font-semibold text-sm">
            {gara.punti_in_palio}pts
          </span>
        </div>
        <Swords className="text-gray-600" size={20} />
      </div>

      {/* Team VS */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex-1 text-center p-3 rounded-xl ${
          gara.vincitore_id === gara.squadra_a_id 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-gray-800/50'
        }`}>
          <div className="text-3xl mb-1">{gara.squadra_a?.emoji}</div>
          <div className="font-semibold text-sm truncate">{gara.squadra_a?.nome}</div>
        </div>
        
        <div className="px-4 text-gray-600 font-bold">VS</div>
        
        <div className={`flex-1 text-center p-3 rounded-xl ${
          gara.vincitore_id === gara.squadra_b_id 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-gray-800/50'
        }`}>
          <div className="text-3xl mb-1">{gara.squadra_b?.emoji}</div>
          <div className="font-semibold text-sm truncate">{gara.squadra_b?.nome}</div>
        </div>
      </div>

      {/* Gara Name */}
      <h3 className="text-center font-semibold text-gray-300 mb-2">
        🎯 {gara.nome}
      </h3>
      <p className="text-center text-sm text-gray-500 mb-4">{gara.descrizione}</p>

      {/* Winner Badge */}
      {isCompleted && gara.vincitore_id && (
        <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
          <Trophy size={18} />
          <span className="font-semibold">
            Vincitore: {gara.vincitore_id === gara.squadra_a_id ? gara.squadra_a?.nome : gara.squadra_b?.nome}
          </span>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && !isCompleted && (
        <div className="flex gap-2">
          <button
            onClick={() => onAssegnaVincitore?.(gara.id, gara.squadra_a_id)}
            className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {gara.squadra_a?.emoji} Vince
          </button>
          <button
            onClick={() => onAssegnaVincitore?.(gara.id, gara.squadra_b_id)}
            className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors"
          >
            {gara.squadra_b?.emoji} Vince
          </button>
        </div>
      )}
    </motion.div>
  );
};
