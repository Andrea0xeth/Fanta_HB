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
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-gray-500">Nessuna squadra assegnata</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero Header */}
      <div 
        className="relative px-4 pt-safe pb-6"
        style={{ 
          background: `linear-gradient(135deg, ${mySquadra.colore}40 0%, transparent 100%)` 
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            {mySquadra.emoji}
          </motion.div>
          <h1 className="text-3xl font-display font-bold mb-2">{mySquadra.nome}</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-gray-400">
              <Trophy size={16} />
              <span className="font-semibold">#{myPosition}</span>
            </div>
            <div className="flex items-center gap-1 text-party-300">
              <Flame size={16} />
              <span className="font-bold">{mySquadra.punti_squadra} pts</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 pb-6 -mt-2">
        {/* Team Stats Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-turquoise-400" />
            Statistiche Squadra
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-coral-500">{mockMembers.length}</div>
              <div className="text-xs text-gray-500">Membri</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-turquoise-400">
                {teamGare.filter(g => g.vincitore_id === mySquadra.id).length}
              </div>
              <div className="text-xs text-gray-500">Gare Vinte</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-party-300">
                {Math.round(mockMembers.reduce((acc, m) => acc + m.punti, 0) / mockMembers.length)}
              </div>
              <div className="text-xs text-gray-500">Media Pts</div>
            </div>
          </div>
        </motion.div>

        {/* Team Members */}
        <section>
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Users size={20} className="text-turquoise-400" />
            Membri della Squadra
          </h2>
          
          <div className="space-y-2">
            {mockMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex items-center gap-3 ${
                  member.id === user?.id ? 'border-coral-500/50' : ''
                }`}
              >
                <div className="w-8 text-center font-bold text-gray-500">
                  {index + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold">
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{member.nickname}</span>
                    {member.isMVP && (
                      <Crown size={14} className="text-party-300" />
                    )}
                    {member.id === user?.id && (
                      <span className="badge-coral">Tu</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-turquoise-400">{member.punti}</span>
                  <span className="text-gray-500 text-sm"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Games */}
        <section>
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Swords size={20} className="text-coral-500" />
            Gare della Squadra
          </h2>
          
          {teamGare.length === 0 ? (
            <div className="card text-center text-gray-500 py-8">
              <Swords size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nessuna gara programmata</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamGare.map((gara) => (
                <GaraCard key={gara.id} gara={gara} />
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard Preview */}
        <section>
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-party-300" />
            Classifica Squadre
          </h2>
          
          <div className="space-y-2">
            {leaderboardSquadre.slice(0, 5).map((squadra, index) => (
              <motion.div
                key={squadra.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex items-center gap-3 ${
                  squadra.id === mySquadra.id ? 'border-coral-500/50 bg-coral-500/5' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-party-300/20 text-party-300' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-800 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-2xl">{squadra.emoji}</span>
                <div className="flex-1">
                  <span className="font-semibold">{squadra.nome}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-turquoise-400">{squadra.punti_squadra}</span>
                  <span className="text-gray-500 text-sm"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
