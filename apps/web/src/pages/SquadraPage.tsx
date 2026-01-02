import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords, Info } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';
import { Countdown } from '../components/Countdown';
import { SquadraModal } from '../components/SquadraModal';
import { UserProfileModal } from '../components/UserProfileModal';

export const SquadraPage: React.FC = () => {
  const { user, mySquadra, gare, leaderboardSquadre, gameState } = useGame();
  const [showSquadraModal, setShowSquadraModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  // Usa i membri reali della squadra se disponibili, altrimenti mock
  const teamMembers = useMemo(() => {
    return mySquadra?.membri && mySquadra.membri.length > 0
      ? mySquadra.membri
          .map((m) => ({
            id: m.id,
            nickname: m.nickname,
            punti: m.punti_personali,
            isMVP: false,
            avatar: m.avatar || undefined,
          }))
          .sort((a, b) => b.punti - a.punti)
      : [
          { id: '1', nickname: 'Pippo', punti: 85, isMVP: true },
          { id: '2', nickname: 'Pluto', punti: 62, isMVP: false },
          { id: '3', nickname: 'Paperino', punti: 54, isMVP: false },
          { id: '4', nickname: 'Topolino', punti: 48, isMVP: false },
          { id: user?.id || '5', nickname: user?.nickname || 'Tu', punti: user?.punti_personali || 0, isMVP: false },
        ].sort((a, b) => b.punti - a.punti);
  }, [mySquadra?.membri, user?.id, user?.nickname, user?.punti_personali]);

  const myPosition = leaderboardSquadre.findIndex(s => s.id === mySquadra?.id) + 1;
  
  // Get team's upcoming/active games
  const teamGare = gare.filter(
    g => g.squadra_a_id === mySquadra?.id || g.squadra_b_id === mySquadra?.id
  );

  // Se l'utente non ha una squadra, mostra countdown e messaggio di attesa
  if (!mySquadra) {
    const eventDate = gameState.data_inizio 
      ? new Date(gameState.data_inizio).toISOString()
      : new Date('2026-01-08T00:00:00+01:00').toISOString();

    return (
      <div className="min-h-full bg-dark flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
          <div className="flex items-center justify-center gap-2">
            <Users size={16} className="text-turquoise-400" />
            <div className="text-sm font-semibold">La Tua Squadra</div>
          </div>
        </div>

        {/* Content - Countdown e messaggio */}
        <div className="flex-1 px-4 py-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mb-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mb-6"
              >
                <Users size={64} className="text-turquoise-400 mx-auto" />
              </motion.div>
              
              <h2 className="font-display font-bold text-2xl mb-4 bg-gradient-to-r from-turquoise-400 via-coral-500 to-turquoise-400 bg-clip-text text-transparent">
                La Tua Squadra Sta Arrivando! ⚔️
              </h2>
              
              <p className="text-gray-300 text-sm mb-8 leading-relaxed max-w-md mx-auto">
                Stai per essere assegnato a una squadra epica! Unisciti ai tuoi compagni e preparati per tre giorni di sfide indimenticabili, gare all'ultimo respiro e avventure che rimarranno nella storia. 
                <br /><br />
                <span className="text-turquoise-400 font-semibold">Gli admin ti assegneranno presto alla tua squadra!</span>
              </p>
            </div>
            
            <div className="mb-8">
              <Countdown targetDate={eventDate} />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-4 border border-turquoise-500/20 max-w-md mx-auto"
            >
              <p className="text-gray-400 text-xs leading-relaxed">
                💡 <span className="font-semibold text-turquoise-400">Suggerimento:</span> Una volta assegnato, potrai vedere i tuoi compagni, le gare della squadra e competere per la vittoria!
              </p>
            </motion.div>
          </motion.section>
        </div>
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
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowSquadraModal(true)}
              className="p-1.5 rounded-xl hover:bg-white/5 text-gray-300"
              aria-label="Dettagli squadra"
              title="Dettagli"
            >
              <Info size={16} />
            </button>
          </div>
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
                <button
                  type="button"
                  onClick={() => setProfileUserId(member.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  aria-label={`Apri profilo ${member.nickname}`}
                >
                  <Avatar
                    user={{
                      id: member.id,
                      nickname: member.nickname,
                      avatar: (member as any).avatar,
                      punti_personali: member.punti,
                      squadra_id: mySquadra.id,
                      is_admin: false,
                      created_at: '',
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{member.nickname}</span>
                      {member.isMVP && <Crown size={12} className="text-party-300 flex-shrink-0" />}
                      {member.id === user?.id && (
                        <span className="badge-coral flex-shrink-0 text-[10px] px-1.5 py-0.5">Tu</span>
                      )}
                    </div>
                  </div>
                </button>
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

      <SquadraModal
        isOpen={showSquadraModal}
        squadra={mySquadra}
        posizione={myPosition}
        gareVinte={teamGare.filter((g) => g.vincitore_id === mySquadra.id).length}
        members={teamMembers.map((m) => ({ id: m.id, nickname: m.nickname, punti: m.punti, avatar: (m as any).avatar }))}
        onClose={() => setShowSquadraModal(false)}
        onSelectMember={(id) => {
          setShowSquadraModal(false);
          setProfileUserId(id);
        }}
      />

      <UserProfileModal isOpen={Boolean(profileUserId)} userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </div>
  );
};
