import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, User, Crown, Flame, Award } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { Avatar } from '../components/Avatar';
import { UserProfileModal } from '../components/UserProfileModal';

type TabType = 'squadre' | 'singoli';

export const LeaderboardPage: React.FC = () => {
  const { user, mySquadra, leaderboardSquadre, leaderboardSingoli } = useGame();
  // Se l'utente non ha una squadra, mostra solo la tab "singoli"
  const [activeTab, setActiveTab] = useState<TabType>(mySquadra ? 'squadre' : 'singoli');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // Filtra utenti nascosti dalla leaderboard pubblica
  const HIDDEN_USERS = ['TOMMY ADMIN COS'];
  const visibleLeaderboard = leaderboardSingoli.filter(u => {
    if (!u.nickname) return true;
    const nicknameUpper = u.nickname.toUpperCase().trim().replace(/\s+/g, ' ');
    return !HIDDEN_USERS.some(hidden => {
      const hiddenUpper = hidden.toUpperCase().trim().replace(/\s+/g, ' ');
      return nicknameUpper === hiddenUpper;
    });
  });

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
          <p className="text-gray-400 text-[10px]">Chi vincerà il DC-30?</p>
        </motion.div>

        {/* Tab Switcher - Snello - Mostra solo se l'utente ha una squadra */}
        {mySquadra && (
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
        )}
      </div>

      {/* Content - Scrollable, snello */}
      <div className="flex-1 px-4 py-3 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === 'squadre' && mySquadra ? (
            <motion.div
              key="squadre"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              {/* Top 3 Podium - Migliorato */}
              <div className="flex items-end justify-center gap-2 py-4 mb-4">
                {/* 2nd Place */}
                {leaderboardSquadre[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center flex-1 max-w-[80px]"
                  >
                    <div className="text-3xl mb-1.5">{leaderboardSquadre[1].emoji}</div>
                    <div className="w-full h-16 bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-xl flex items-end justify-center pb-2 border border-gray-400/20">
                      <span className="text-base font-bold text-gray-300">2</span>
                    </div>
                    <p className="text-xs font-bold mt-2 truncate">
                      {leaderboardSquadre[1].nome}
                    </p>
                    <p className="text-[10px] text-turquoise-400 font-semibold mt-0.5">{leaderboardSquadre[1].punti_squadra} pts</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Users size={10} className="text-gray-500" />
                      <span className="text-[9px] text-gray-500">{leaderboardSquadre[1].membri.length}</span>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place */}
                {leaderboardSquadre[0] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center flex-1 max-w-[90px]"
                  >
                    <Crown className="w-5 h-5 text-party-300 mx-auto mb-1" />
                    <div className="text-4xl mb-2">{leaderboardSquadre[0].emoji}</div>
                    <div className="w-full h-20 bg-gradient-to-t from-party-300/60 to-party-300/20 rounded-t-xl flex items-end justify-center pb-2.5 border-2 border-party-300/40 shadow-lg shadow-party-300/20">
                      <span className="text-xl font-bold text-party-300">1</span>
                    </div>
                    <p className="text-sm font-bold mt-2 truncate bg-gradient-to-r from-party-300 to-party-400 bg-clip-text text-transparent">
                      {leaderboardSquadre[0].nome}
                    </p>
                    <p className="text-xs text-turquoise-400 font-bold mt-0.5">{leaderboardSquadre[0].punti_squadra} pts</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Users size={10} className="text-party-300" />
                      <span className="text-[9px] text-party-300 font-semibold">{leaderboardSquadre[0].membri.length}</span>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place */}
                {leaderboardSquadre[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center flex-1 max-w-[80px]"
                  >
                    <div className="text-3xl mb-1.5">{leaderboardSquadre[2].emoji}</div>
                    <div className="w-full h-12 bg-gradient-to-t from-orange-500/30 to-orange-500/10 rounded-t-xl flex items-end justify-center pb-1.5 border border-orange-500/20">
                      <span className="text-sm font-bold text-orange-400">3</span>
                    </div>
                    <p className="text-xs font-bold mt-2 truncate">
                      {leaderboardSquadre[2].nome}
                    </p>
                    <p className="text-[10px] text-turquoise-400 font-semibold mt-0.5">{leaderboardSquadre[2].punti_squadra} pts</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Users size={10} className="text-gray-500" />
                      <span className="text-[9px] text-gray-500">{leaderboardSquadre[2].membri.length}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Rest of leaderboard - Migliorato */}
              {leaderboardSquadre.length > 3 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <Award size={12} className="text-gray-500" />
                    <span className="text-xs text-gray-500 font-semibold">Altre Squadre</span>
                  </div>
                  {leaderboardSquadre.slice(3).map((squadra, index) => {
                    const position = index + 4;
                    const isMySquadra = squadra.id === mySquadra?.id;
                    return (
                      <motion.div
                        key={squadra.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-l-2 transition-all ${
                          isMySquadra 
                            ? 'border-coral-500/50 bg-coral-500/5 pl-3 shadow-sm' 
                            : 'border-gray-700/30 bg-gray-800/20 hover:bg-gray-800/30 pl-3'
                        }`}
                      >
                        <PositionBadge position={position} />
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${squadra.colore}20` }}
                        >
                          {squadra.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{squadra.nome}</span>
                            {isMySquadra && (
                              <span className="badge-coral flex-shrink-0 text-[10px] px-1.5 py-0.5">La Tua Squadra</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Users size={10} className="text-gray-500" />
                              <span className="text-[10px] text-gray-500">{squadra.membri.length} membri</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[60px] flex-shrink-0">
                          <span className="font-bold text-turquoise-400 text-base block">{squadra.punti_squadra}</span>
                          <span className="text-gray-400 text-[10px]">pts</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
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

              {visibleLeaderboard.map((giocatore, index) => {
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
                        {squadra ? (
                          <>
                            <span>{squadra.emoji}</span>
                            <span className="truncate">{squadra.nome}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Senza squadra</span>
                        )}
                      </div>
                      </div>
                    </button>
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
