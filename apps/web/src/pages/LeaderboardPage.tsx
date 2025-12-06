import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, User, TrendingUp, TrendingDown, Minus, Crown, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';

type TabType = 'squadre' | 'singoli';

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('squadre');
  const { user, mySquadra, leaderboardSquadre, leaderboardSingoli } = useGame();

  // Mock delta values
  const getDelta = (index: number): number => {
    const deltas = [12, -3, 8, 0, 5, -7, 15, -2, 4, 0];
    return deltas[index % deltas.length];
  };

  const DeltaIndicator: React.FC<{ delta: number }> = ({ delta }) => {
    if (delta > 0) {
      return (
        <span className="flex items-center gap-0.5 text-green-400 text-xs">
          <TrendingUp size={12} />
          +{delta}
        </span>
      );
    } else if (delta < 0) {
      return (
        <span className="flex items-center gap-0.5 text-red-400 text-xs">
          <TrendingDown size={12} />
          {delta}
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-500 text-xs">
        <Minus size={12} />
      </span>
    );
  };

  const PositionBadge: React.FC<{ position: number }> = ({ position }) => {
    const styles = {
      1: 'bg-gradient-to-br from-party-300 to-party-400 text-dark',
      2: 'bg-gradient-to-br from-gray-300 to-gray-400 text-dark',
      3: 'bg-gradient-to-br from-orange-400 to-orange-500 text-dark',
    };

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
        styles[position as keyof typeof styles] || 'bg-gray-800 text-gray-400'
      }`}>
        {position}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-dark px-4 pt-safe pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <Trophy className="w-12 h-12 text-party-300 mx-auto mb-2" />
          <h1 className="text-2xl font-display font-bold">Classifica</h1>
          <p className="text-gray-500 text-sm">Chi vincerà il 30diCiaccioGame?</p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="bg-gray-800/50 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'squadre' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} />
            Squadre
          </button>
          <button
            onClick={() => setActiveTab('singoli')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'singoli' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={18} />
            Singoli
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === 'squadre' ? (
            <motion.div
              key="squadre"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Top 3 Podium */}
              <div className="flex items-end justify-center gap-4 py-6">
                {/* 2nd Place */}
                {leaderboardSquadre[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl mb-2">{leaderboardSquadre[1].emoji}</div>
                    <div className="w-20 h-20 bg-gray-600/50 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-2xl font-bold text-gray-300">2</span>
                    </div>
                    <p className="text-sm font-semibold mt-2 truncate max-w-[80px]">
                      {leaderboardSquadre[1].nome}
                    </p>
                    <p className="text-xs text-turquoise-400">{leaderboardSquadre[1].punti_squadra} pts</p>
                  </motion.div>
                )}

                {/* 1st Place */}
                {leaderboardSquadre[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <Crown className="w-8 h-8 text-party-300 mx-auto mb-1" />
                    <div className="text-5xl mb-2">{leaderboardSquadre[0].emoji}</div>
                    <div className="w-24 h-28 bg-gradient-to-t from-party-300/50 to-party-300/20 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-3xl font-bold text-party-300">1</span>
                    </div>
                    <p className="text-sm font-semibold mt-2 truncate max-w-[96px]">
                      {leaderboardSquadre[0].nome}
                    </p>
                    <p className="text-xs text-turquoise-400">{leaderboardSquadre[0].punti_squadra} pts</p>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {leaderboardSquadre[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="text-4xl mb-2">{leaderboardSquadre[2].emoji}</div>
                    <div className="w-20 h-16 bg-orange-500/30 rounded-t-xl flex items-end justify-center pb-2">
                      <span className="text-2xl font-bold text-orange-400">3</span>
                    </div>
                    <p className="text-sm font-semibold mt-2 truncate max-w-[80px]">
                      {leaderboardSquadre[2].nome}
                    </p>
                    <p className="text-xs text-turquoise-400">{leaderboardSquadre[2].punti_squadra} pts</p>
                  </motion.div>
                )}
              </div>

              {/* Rest of leaderboard */}
              {leaderboardSquadre.slice(3).map((squadra, index) => (
                <motion.div
                  key={squadra.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={`card flex items-center gap-3 ${
                    squadra.id === mySquadra?.id ? 'border-coral-500/50 bg-coral-500/5' : ''
                  }`}
                >
                  <PositionBadge position={index + 4} />
                  <span className="text-2xl">{squadra.emoji}</span>
                  <div className="flex-1">
                    <span className="font-semibold">{squadra.nome}</span>
                    {squadra.id === mySquadra?.id && (
                      <span className="badge-coral ml-2">Tu</span>
                    )}
                  </div>
                  <DeltaIndicator delta={getDelta(index + 3)} />
                  <div className="text-right min-w-[60px]">
                    <span className="font-bold text-turquoise-400">{squadra.punti_squadra}</span>
                    <span className="text-gray-500 text-xs"> pts</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="singoli"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-4"
            >
              {/* Formula explanation */}
              <div className="card bg-gray-800/50 text-center mb-4">
                <p className="text-xs text-gray-400">
                  Formula: <span className="text-turquoise-400">Punti Personali × 0.7</span> + 
                  <span className="text-coral-400"> Punti Squadra × 0.3</span>
                </p>
              </div>

              {leaderboardSingoli.map((giocatore, index) => {
                const squadra = leaderboardSquadre.find(s => s.id === giocatore.squadra_id);
                const puntiTotali = Math.round(
                  giocatore.punti_personali * 0.7 + (squadra?.punti_squadra || 0) * 0.3
                );

                return (
                  <motion.div
                    key={giocatore.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`card flex items-center gap-3 ${
                      giocatore.id === user?.id ? 'border-coral-500/50 bg-coral-500/5' : ''
                    }`}
                  >
                    <PositionBadge position={index + 1} />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold">
                      {giocatore.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{giocatore.nickname}</span>
                        {index === 0 && <Crown size={14} className="text-party-300 flex-shrink-0" />}
                        {giocatore.id === user?.id && (
                          <span className="badge-coral flex-shrink-0">Tu</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{squadra?.emoji}</span>
                        <span className="truncate">{squadra?.nome}</span>
                      </div>
                    </div>
                    <DeltaIndicator delta={getDelta(index)} />
                    <div className="text-right min-w-[60px]">
                      <div className="font-bold text-turquoise-400">{puntiTotali}</div>
                      <div className="text-[10px] text-gray-500">
                        {giocatore.punti_personali}
                        <Flame size={8} className="inline mx-0.5" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
