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
      className={`border-l-2 ${isLive ? 'border-coral-500' : isCompleted ? 'border-green-500/50' : 'border-gray-700/50'} pl-3 py-2 ${isCompleted ? 'opacity-70' : ''}`}
    >
      {/* Header - Snello */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-0.5 badge bg-red-500/20 text-red-400 px-1.5 py-0.5 text-[10px]">
              <Radio size={10} className="animate-pulse" />
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="badge bg-green-500/20 text-green-400 px-1.5 py-0.5 text-[10px]">
              Completata
            </span>
          ) : (
            <span className="badge bg-gray-800 text-gray-400 px-1.5 py-0.5 text-[10px]">
              <Clock size={10} className="inline mr-0.5" />
              {formatTime(gara.orario)}
            </span>
          )}
          <span className="text-party-300 font-semibold text-xs">
            {gara.punti_in_palio}pts
          </span>
        </div>
        <Swords className="text-gray-600" size={14} />
      </div>

      {/* Team VS - Snello - Supporta più squadre */}
      {gara.squadre_partecipanti && gara.squadre_partecipanti.length > 2 ? (
        <div className="mb-2">
          <div className="text-center text-xs text-gray-400 mb-2">
            {gara.squadre_partecipanti.length} squadre partecipanti
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {gara.squadre_partecipanti.map((squadra) => (
              <div
                key={squadra.id}
                className={`text-center py-2 rounded-xl ${
                  gara.vincitore_id === squadra.id
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-800/30'
                }`}
              >
                <div className="text-xl mb-0.5">{squadra.emoji}</div>
                <div className="font-semibold text-[10px] truncate">{squadra.nome}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className={`flex-1 text-center py-2 rounded-xl ${
            gara.vincitore_id === gara.squadra_a_id 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-gray-800/30'
          }`}>
            <div className="text-2xl mb-0.5">{gara.squadra_a?.emoji}</div>
            <div className="font-semibold text-xs truncate">{gara.squadra_a?.nome}</div>
          </div>
          
          <div className="px-2 text-gray-500 font-bold text-xs">VS</div>
          
          <div className={`flex-1 text-center py-2 rounded-xl ${
            gara.vincitore_id === gara.squadra_b_id 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-gray-800/30'
          }`}>
            <div className="text-2xl mb-0.5">{gara.squadra_b?.emoji}</div>
            <div className="font-semibold text-xs truncate">{gara.squadra_b?.nome}</div>
          </div>
        </div>
      )}

      {/* Gara Name - Snello */}
      <h3 className="font-semibold text-gray-200 text-sm mb-1">
        🎯 {gara.nome}
      </h3>
      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{gara.descrizione}</p>

      {/* Classifica o Vincitore - Improved visibility */}
      {isCompleted && gara.classifica && gara.classifica.length > 0 ? (
        <div className="space-y-2 mb-3">
          <div className="text-center text-sm text-gray-300 mb-2 font-semibold">Classifica Finale</div>
          {gara.classifica.slice(0, 3).map((item, index) => (
            <div
              key={item.squadra_id}
              className={`flex items-center justify-between p-3 rounded-xl text-sm ${
                index === 0 ? 'bg-party-300/20 border border-party-300/30' :
                index === 1 ? 'bg-gray-400/20 border border-gray-400/30' :
                index === 2 ? 'bg-orange-500/20 border border-orange-500/30' :
                'glass'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-base w-6">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${item.posizione}°`}</span>
                <span className="text-xl">{item.squadra_emoji}</span>
                <span className="font-semibold truncate">{item.squadra_nome}</span>
              </div>
              <span className="text-party-300 font-bold">+{item.punti_assegnati}pts</span>
            </div>
          ))}
        </div>
      ) : isCompleted && gara.vincitore_id ? (
        <div className="flex items-center justify-center gap-2 text-green-400 mb-3 p-3 bg-green-500/10 rounded-xl">
          <Trophy size={18} />
          <span className="font-semibold text-sm">
            Vincitore: {gara.vincitore_id === gara.squadra_a_id ? gara.squadra_a?.nome : gara.squadra_b?.nome}
          </span>
        </div>
      ) : null}

      {/* Admin Controls - Improved spacing */}
      {isAdmin && !isCompleted && (
        <div className="space-y-2 pt-2">
          {onAssegnaClassifica ? (
            <button
              onClick={() => {
                // Questo verrà gestito dal componente padre
                const event = new CustomEvent('open-classifica-modal', { detail: { gara } });
                window.dispatchEvent(event);
              }}
              className="w-full py-3 rounded-2xl bg-coral-500 text-white text-sm font-semibold transition-colors hover:bg-coral-600 shadow-lg"
            >
              Definisci Classifica
            </button>
          ) : onAssegnaVincitore ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAssegnaVincitore(gara.id, gara.squadra_a_id)}
                className="flex-1 py-3 rounded-2xl glass text-sm font-semibold transition-colors hover:bg-white/5"
              >
                {gara.squadra_a?.emoji} Vince
              </button>
              <button
                onClick={() => onAssegnaVincitore(gara.id, gara.squadra_b_id)}
                className="flex-1 py-3 rounded-2xl glass text-sm font-semibold transition-colors hover:bg-white/5"
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
