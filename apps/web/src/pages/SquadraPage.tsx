import React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { CircusNeonDecorations } from '../components/CircusNeonDecorations';
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
        <p className="text-muted">Nessuna squadra assegnata</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Hero Header - Fixed, compact */}
      <div 
        className="flex-shrink-0 glass-strong px-4 pt-safe pb-3"
        style={{ 
          background: `linear-gradient(135deg, ${mySquadra.colore}30 0%, rgba(26, 26, 26, 0.8) 100%)` 
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <CircusNeonDecorations variant="balloon" size="small" color="red" />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-4xl"
            >
              {mySquadra.emoji}
            </motion.div>
            <CircusNeonDecorations variant="balloon" size="small" color="white" />
          </div>
          <h1 className="text-xl font-display font-bold mb-1">{mySquadra.nome}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-0.5 text-muted">
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

      {/* Content - Scrollable, passes under navbar - 8pt grid spacing */}
      <div className="flex-1 px-4 py-3 pb-28 space-y-4">
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
              <div className="text-lg font-bold text-coral-500">{teamMembers.length}</div>
              <div className="text-[11px] text-muted">Membri</div>
            </div>
            <div>
              <div className="text-lg font-bold text-turquoise-400">
                {teamGare.filter(g => g.vincitore_id === mySquadra.id).length}
              </div>
              <div className="text-[11px] text-muted">Gare Vinte</div>
            </div>
            <div>
              <div className="text-lg font-bold text-party-300">
                {Math.round(teamMembers.reduce((acc, m) => acc + m.punti, 0) / teamMembers.length)}
              </div>
              <div className="text-[11px] text-muted">Media Pts</div>
            </div>
          </div>
        </motion.div>

        {/* Team Members - Compact */}
        <section>
          <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Users size={16} className="text-turquoise-400" />
            Membri della Squadra
          </h2>
          
          <div className="space-y-2">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex items-center gap-2 py-2 ${
                  member.id === user?.id ? 'border-coral-500/50' : ''
                }`}
              >
                <div className="w-5 text-center font-bold text-faint text-xs flex-shrink-0">
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
                  size="md" 
                />
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
                  <span className="text-subtle text-[11px]"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Games - Compact */}
        <section>
          <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Swords size={16} className="text-coral-500" />
            Gare della Squadra
          </h2>
          
          {teamGare.length === 0 ? (
            <div className="card text-center text-muted py-6">
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
          <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Trophy size={16} className="text-party-300" />
            Classifica Squadre
          </h2>
          
          <div className="space-y-2">
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
                <div className={`w-7 h-7 rounded-2xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  index === 0 ? 'bg-party-300/20 text-party-300' :
                  index === 1 ? 'bg-white/10 text-white/80' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'glass text-white/70'
                }`}>
                  {index + 1}
                </div>
                <span className="text-xl">{squadra.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm truncate">{squadra.nome}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{squadra.punti_squadra}</span>
                  <span className="text-subtle text-[11px]"> pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
