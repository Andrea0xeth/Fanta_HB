import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, User, TrendingUp, TrendingDown, Minus, Crown, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Avatar } from '../components/Avatar';
import { UserProfileModal } from '../components/UserProfileModal';

type TabType = 'squadre' | 'singoli';

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('squadre');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
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
      <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
        styles[position as keyof typeof styles] || 'bg-gray-800/50 text-gray-400'
      }`}>
        {position}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-dark flex flex-col">
        {/* Header - Snello */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <Trophy className="w-6 h-6 text-party-300 mx-auto mb-1" />
          <h1 className="text-lg font-display font-bold mb-0.5">Classifica</h1>
          <p className="text-gray-400 text-[10px]">Chi vincerà il 30diCiaccioGame?</p>
        </motion.div>

        {/* Tab Switcher - Snello */}
        <div className="bg-gray-800/30 rounded-xl p-0.5 flex gap-0.5">
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'squadre' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Users size={12} />
            Squadre
          </button>
          <button
            onClick={() => setActiveTab('singoli')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'singoli' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <User size={12} />
            Singoli
          </button>
        </div>
      </div>

      {/* Content - Scrollable, snello */}
      <div className="flex-1 px-4 py-3 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === 'squadre' ? (
            <motion.div
              key="squadre"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              {/* Top 3 Podium - Snello */}
              <div className="flex items-end justify-center gap-2 py-3 mb-3">
                {/* 2nd Place */}
                {leaderboardSquadre[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl mb-1">{leaderboardSquadre[1].emoji}</div>
                    <div className="w-12 h-12 bg-gray-800/50 rounded-t-xl flex items-end justify-center pb-1">
                      <span className="text-sm font-bold text-gray-300">2</span>
                    </div>
                    <p className="text-xs font-semibold mt-1 truncate max-w-[60px]">
                      {leaderboardSquadre[1].nome}
                    </p>
                    <p className="text-[10px] text-turquoise-400 font-semibold">{leaderboardSquadre[1].punti_squadra} pts</p>
                  </motion.div>
                )}

                {/* 1st Place */}
                {leaderboardSquadre[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <Crown className="w-4 h-4 text-party-300 mx-auto mb-0.5" />
                    <div className="text-3xl mb-1">{leaderboardSquadre[0].emoji}</div>
                    <div className="w-14 h-16 bg-gradient-to-t from-party-300/50 to-party-300/20 rounded-t-xl flex items-end justify-center pb-1.5">
                      <span className="text-lg font-bold text-party-300">1</span>
                    </div>
                    <p className="text-xs font-semibold mt-1 truncate max-w-[70px]">
                      {leaderboardSquadre[0].nome}
                    </p>
                    <p className="text-[10px] text-turquoise-400 font-semibold">{leaderboardSquadre[0].punti_squadra} pts</p>
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
                    <div className="text-2xl mb-1">{leaderboardSquadre[2].emoji}</div>
                    <div className="w-12 h-10 bg-orange-500/30 rounded-t-xl flex items-end justify-center pb-1">
                      <span className="text-sm font-bold text-orange-400">3</span>
                    </div>
                    <p className="text-xs font-semibold mt-1 truncate max-w-[60px]">
                      {leaderboardSquadre[2].nome}
                    </p>
                    <p className="text-[10px] text-turquoise-400 font-semibold">{leaderboardSquadre[2].punti_squadra} pts</p>
                  </motion.div>
                )}
              </div>

              {/* Rest of leaderboard - Snello */}
              <div className="space-y-1.5">
                {leaderboardSquadre.slice(3).map((squadra, index) => (
                  <motion.div
                    key={squadra.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`flex items-center gap-2 py-1.5 border-l-2 ${
                      squadra.id === mySquadra?.id ? 'border-coral-500/50 pl-2' : 'border-gray-700/30 pl-2'
                    }`}
                  >
                    <PositionBadge position={index + 4} />
                    <span className="text-xl">{squadra.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm truncate">{squadra.nome}</span>
                      {squadra.id === mySquadra?.id && (
                        <span className="badge-coral ml-1.5 text-[10px] px-1.5 py-0.5">Tu</span>
                      )}
                    </div>
                    <DeltaIndicator delta={getDelta(index + 3)} />
                    <div className="text-right min-w-[50px]">
                      <span className="font-bold text-turquoise-400 text-sm">{squadra.punti_squadra}</span>
                      <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="singoli"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-1.5 pt-1"
            >
              {/* Formula explanation - Snello */}
              <div className="text-center py-1.5 mb-1.5 border-b border-white/5">
                <p className="text-[10px] text-gray-400">
                  Formula: <span className="text-turquoise-400">Pers. × 0.7</span> + 
                  <span className="text-coral-400"> Squad. × 0.3</span>
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
                    className={`flex items-center gap-2 py-1.5 border-l-2 ${
                      giocatore.id === user?.id ? 'border-coral-500/50 pl-2' : 'border-gray-700/30 pl-2'
                    }`}
                  >
                    <PositionBadge position={index + 1} />
                    <button
                      type="button"
                      onClick={() => setProfileUserId(giocatore.id)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      aria-label={`Apri profilo ${giocatore.nickname}`}
                    >
                      <Avatar user={giocatore} size="sm" />
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate text-sm">{giocatore.nickname}</span>
                        {index === 0 && <Crown size={12} className="text-party-300 flex-shrink-0" />}
                        {giocatore.id === user?.id && (
                          <span className="badge-coral flex-shrink-0 text-[10px] px-1.5 py-0.5">Tu</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                        <span>{squadra?.emoji}</span>
                        <span className="truncate">{squadra?.nome}</span>
                      </div>
                      </div>
                    </button>
                    <DeltaIndicator delta={getDelta(index)} />
                    <div className="text-right min-w-[55px]">
                      <div className="font-bold text-turquoise-400 text-sm">{puntiTotali}</div>
                      <div className="text-[10px] text-gray-400">
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

      <UserProfileModal
        isOpen={Boolean(profileUserId)}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </div>
  );
};
