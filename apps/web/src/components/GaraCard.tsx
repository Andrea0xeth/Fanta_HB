import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Swords, Trophy, Radio } from 'lucide-react';
import type { Gara } from '../types';

interface GaraCardProps {
  gara: Gara;
  isAdmin?: boolean;
  onAssegnaVincitore?: (garaId: string, vincitoreId: string) => void;
  onAssegnaClassifica?: (garaId: string, classifiche: Array<{squadra_id: string, posizione: number}>) => void;
}

export const GaraCard: React.FC<GaraCardProps> = ({ gara, isAdmin, onAssegnaVincitore, onAssegnaClassifica }) => {
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
            <span className="badge bg-white/10 text-white/80">
              <Clock size={10} className="inline mr-0.5" />
              {formatTime(gara.orario)}
            </span>
          )}
          <span className="text-party-300 font-semibold text-xs">
            {gara.punti_in_palio}pts
          </span>
        </div>
        <Swords className="text-white/35" size={16} />
      </div>

      {/* Team VS - Compact */}
      <div className="flex items-center justify-between mb-2">
        <div className={`flex-1 text-center p-3 rounded-2xl ${
          gara.vincitore_id === gara.squadra_a_id 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'glass'
        }`}>
          <div className="text-2xl mb-0.5">{gara.squadra_a?.emoji}</div>
          <div className="font-semibold text-xs truncate">{gara.squadra_a?.nome}</div>
        </div>
        
        <div className="px-2 text-white/35 font-bold text-xs">VS</div>
        
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
      <p className="text-center text-xs text-muted mb-2 line-clamp-2">{gara.descrizione}</p>

      {/* Classifica o Vincitore - Compact */}
      {isCompleted && gara.classifica && gara.classifica.length > 0 ? (
        <div className="space-y-1 mb-2">
          <div className="text-center text-xs text-muted mb-1">Classifica Finale</div>
          {gara.classifica.slice(0, 3).map((item, index) => (
            <div
              key={item.squadra_id}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${
                index === 0 ? 'bg-party-300/20' :
                index === 1 ? 'bg-gray-400/20' :
                index === 2 ? 'bg-orange-500/20' :
                'glass'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-bold w-4">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${item.posizione}°`}</span>
                <span className="text-lg">{item.squadra_emoji}</span>
                <span className="font-semibold truncate">{item.squadra_nome}</span>
              </div>
              <span className="text-party-300 font-bold">+{item.punti_assegnati}pts</span>
            </div>
          ))}
        </div>
      ) : isCompleted && gara.vincitore_id ? (
        <div className="flex items-center justify-center gap-1.5 text-green-400 mb-2">
          <Trophy size={14} />
          <span className="font-semibold text-xs">
            Vincitore: {gara.vincitore_id === gara.squadra_a_id ? gara.squadra_a?.nome : gara.squadra_b?.nome}
          </span>
        </div>
      ) : null}

      {/* Admin Controls - Compact */}
      {isAdmin && !isCompleted && (
        <div className="space-y-1.5">
          {onAssegnaClassifica ? (
            <button
              onClick={() => {
                // Questo verrà gestito dal componente padre
                const event = new CustomEvent('open-classifica-modal', { detail: { gara } });
                window.dispatchEvent(event);
              }}
              className="w-full py-2 rounded-2xl bg-coral-500 text-white text-xs font-medium transition-colors hover:bg-coral-600"
            >
              Definisci Classifica
            </button>
          ) : onAssegnaVincitore ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => onAssegnaVincitore(gara.id, gara.squadra_a_id)}
                className="flex-1 py-2 rounded-2xl glass text-xs font-medium transition-colors"
              >
                {gara.squadra_a?.emoji} Vince
              </button>
              <button
                onClick={() => onAssegnaVincitore(gara.id, gara.squadra_b_id)}
                className="flex-1 py-2 rounded-2xl glass text-xs font-medium transition-colors"
              >
                {gara.squadra_b?.emoji} Vince
              </button>
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
};
