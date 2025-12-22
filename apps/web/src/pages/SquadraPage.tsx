import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';

export const SquadraPage: React.FC = () => {
  const { user, mySquadra, gare, leaderboardSquadre } = useGame();

  // Usa i membri reali della squadra se disponibili, altrimenti mock
  const teamMembers = mySquadra?.membri && mySquadra.membri.length > 0
    ? mySquadra.membri.map(m => ({
        id: m.id,
        nickname: m.nickname,
        punti: m.punti_personali,
        isMVP: false,
        avatar: m.avatar || undefined,
      })).sort((a, b) => b.punti - a.punti)
    : [
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
    <div className="min-h-full bg-dark flex flex-col">
      {/* Hero Header - Snello */}
      <div 
        className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3"
        style={{ 
          background: `linear-gradient(135deg, ${mySquadra.colore}20 0%, transparent 100%)` 
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl"
            >
              {mySquadra.emoji}
            </motion.div>
          </div>
          <h1 className="text-lg font-display font-bold mb-2">{mySquadra.nome}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Trophy size={12} />
              <span>#{myPosition}</span>
            </div>
            <div className="flex items-center gap-1 text-party-300 font-bold text-sm">
              <Flame size={12} />
              <span>{mySquadra.punti_squadra} pts</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content - Scrollable, snello */}
      <div className="flex-1 px-4 py-3 pb-28 space-y-3">
        {/* Team Stats - Snello senza card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 py-2 border-b border-white/5"
        >
          <div className="text-center">
            <div className="text-lg font-bold text-coral-500">{teamMembers.length}</div>
            <div className="text-[10px] text-gray-400">Membri</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-turquoise-400">
              {teamGare.filter(g => g.vincitore_id === mySquadra.id).length}
            </div>
            <div className="text-[10px] text-gray-400">Gare Vinte</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-party-300">
              {Math.round(teamMembers.reduce((acc, m) => acc + m.punti, 0) / teamMembers.length)}
            </div>
            <div className="text-[10px] text-gray-400">Media Pts</div>
          </div>
        </motion.div>

        {/* Team Members - Snello */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={14} className="text-turquoise-400" />
            <h2 className="font-display font-bold text-sm">Membri della Squadra</h2>
          </div>
          
          <div className="space-y-1.5">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 py-1.5 border-l-2 ${
                  member.id === user?.id ? 'border-coral-500/50 pl-2' : 'border-gray-700/30 pl-2'
                }`}
              >
                <div className="w-5 text-center font-bold text-gray-500 text-[10px] flex-shrink-0">
                  {index + 1}
                </div>
                <Avatar 
                  user={{ 
                    id: member.id, 
                    nickname: member.nickname, 
                    avatar: (member as any).avatar,
                    punti_personali: member.punti,
                    squadra_id: null,
                    is_admin: false,
                    created_at: ''
                  }} 
                  size="sm" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{member.nickname}</span>
                    {member.isMVP && (
                      <Crown size={12} className="text-party-300 flex-shrink-0" />
                    )}
                    {member.id === user?.id && (
                      <span className="badge-coral flex-shrink-0 text-[10px] px-1.5 py-0.5">Tu</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{member.punti}</span>
                  <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Games - Snello */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Swords size={14} className="text-coral-500" />
            <h2 className="font-display font-bold text-sm">Gare della Squadra</h2>
          </div>
          
          {teamGare.length === 0 ? (
            <div className="text-center text-gray-400 py-4 text-xs">
              <Swords size={24} className="mx-auto mb-2 opacity-50" />
              <p>Nessuna gara programmata</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamGare.map((gara) => (
                <GaraCard key={gara.id} gara={gara} />
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard Preview - Snello */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy size={14} className="text-party-300" />
            <h2 className="font-display font-bold text-sm">Classifica Squadre</h2>
          </div>
          
          <div className="space-y-1.5">
            {leaderboardSquadre.slice(0, 5).map((squadra, index) => (
              <motion.div
                key={squadra.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 py-1.5 border-l-2 ${
                  squadra.id === mySquadra.id ? 'border-coral-500/50 pl-2' : 'border-gray-700/30 pl-2'
                }`}
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                  index === 0 ? 'bg-party-300/20 text-party-300' :
                  index === 1 ? 'bg-gray-400/20 text-gray-400' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-gray-800/50 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xl">{squadra.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{squadra.nome}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{squadra.punti_squadra}</span>
                  <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
