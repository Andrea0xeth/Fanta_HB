import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';

export const SquadraPage: React.FC = () => {
  const { user, mySquadra, gare, leaderboardSquadre } = useGame();

  // Mock team members
  const mockMembers = [
    { id: '1', nickname: 'Pippo', punti: 85, isMVP: true },
    { id: '2', nickname: 'Pluto', punti: 62, isMVP: false },
    { id: '3', nickname: 'Paperino', punti: 54, isMVP: false },
    { id: '4', nickname: 'Topolino', punti: 48, isMVP: false },
    { id: user?.id || '5', nickname: user?.nickname || 'Tu', punti: user?.punti_personali || 0, isMVP: false },
  ].sort((a, b) => b.punti - a.punti);

  const myPosition = leaderboardSquadre.findIndex(s => s.id === mySquadra?.id) + 1;
  
  // Get team's upcoming/active games
  const teamGare = gare.filter(
    g => g.squadra_a_id === mySquadra?.id || g.squadra_b_id === mySquadra?.id
  );

  if (!mySquadra) {
    return (
      <div className="h-full bg-dark flex items-center justify-center">
        <p className="text-gray-500">Nessuna squadra assegnata</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-dark flex flex-col overflow-hidden">
      {/* Hero Header - Fixed, compact */}
      <div 
        className="flex-shrink-0 glass-strong px-3 pt-safe pb-2"
        style={{ 
          background: `linear-gradient(135deg, ${mySquadra.colore}30 0%, rgba(26, 26, 26, 0.8) 100%)` 
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl mb-1"
          >
            {mySquadra.emoji}
          </motion.div>
          <h1 className="text-xl font-display font-bold mb-1">{mySquadra.nome}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5 text-gray-400">
              <Trophy size={12} />
              <span className="font-semibold text-xs">#{myPosition}</span>
            </div>
            <div className="flex items-center gap-0.5 text-party-300">
              <Flame size={12} />
              <span className="font-bold text-sm">{mySquadra.punti_squadra} pts</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2 space-y-3">
        {/* Team Stats Card - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card py-2"
        >
          <h2 className="font-semibold mb-2 flex items-center gap-1.5 text-sm">
            <Users size={14} className="text-turquoise-400" />
            Statistiche Squadra
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-coral-500">{mockMembers.length}</div>
              <div className="text-[10px] text-gray-500">Membri</div>
            </div>
            <div>
              <div className="text-lg font-bold text-turquoise-400">
                {teamGare.filter(g => g.vincitore_id === mySquadra.id).length}
              </div>
              <div className="text-[10px] text-gray-500">Gare Vinte</div>
            </div>
            <div>
              <div className="text-lg font-bold text-party-300">
                {Math.round(mockMembers.reduce((acc, m) => acc + m.punti, 0) / mockMembers.length)}
              </div>
              <div className="text-[10px] text-gray-500">Media Pts</div>
            </div>
          </div>
        </motion.div>

        {/* Team Members - Compact */}
        <section>
          <h2 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
            <Users size={16} className="text-turquoise-400" />
            Membri della Squadra
          </h2>
          
          <div className="space-y-1.5">
            {mockMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex items-center gap-2 py-2 ${
                  member.id === user?.id ? 'border-coral-500/50' : ''
                }`}
              >
                <div className="w-5 text-center font-bold text-gray-500 text-xs flex-shrink-0">
                  {index + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{member.nickname}</span>
                    {member.isMVP && (
                      <Crown size={12} className="text-party-300 flex-shrink-0" />
                    )}
                    {member.id === user?.id && (
                      <span className="badge-coral flex-shrink-0">Tu</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{member.punti}</span>
                  <span className="text-gray-500 text-[10px]"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Games - Compact */}
        <section>
          <h2 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
            <Swords size={16} className="text-coral-500" />
            Gare della Squadra
          </h2>
          
          {teamGare.length === 0 ? (
            <div className="card text-center text-gray-500 py-6">
              <Swords size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nessuna gara programmata</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamGare.map((gara) => (
                <GaraCard key={gara.id} gara={gara} />
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard Preview - Compact */}
        <section>
          <h2 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
            <Trophy size={16} className="text-party-300" />
            Classifica Squadre
          </h2>
          
          <div className="space-y-1.5">
            {leaderboardSquadre.slice(0, 5).map((squadra, index) => (
              <motion.div
                key={squadra.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex items-center gap-2 py-2 ${
                  squadra.id === mySquadra.id ? 'border-coral-500/50' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  index === 0 ? 'bg-party-300/20 text-party-300' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'glass text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xl">{squadra.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{squadra.nome}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{squadra.punti_squadra}</span>
                  <span className="text-gray-500 text-[10px]"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
