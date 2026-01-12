import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords, Info, Target } from 'lucide-react';
import { useGame } from '../context/GameContext';
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
            nome: m.nome,
            cognome: m.cognome,
            punti: m.punti_personali,
            isMVP: false,
            avatar: m.avatar || undefined,
          }))
          .sort((a, b) => b.punti - a.punti)
      : [
          { id: '1', nickname: 'Pippo', nome: undefined, cognome: undefined, punti: 85, isMVP: true },
          { id: '2', nickname: 'Pluto', nome: undefined, cognome: undefined, punti: 62, isMVP: false },
          { id: '3', nickname: 'Paperino', nome: undefined, cognome: undefined, punti: 54, isMVP: false },
          { id: '4', nickname: 'Topolino', nome: undefined, cognome: undefined, punti: 48, isMVP: false },
          { id: user?.id || '5', nickname: user?.nickname || 'Tu', nome: user?.nome, cognome: user?.cognome, punti: user?.punti_personali || 0, isMVP: false },
        ].sort((a, b) => b.punti - a.punti);
  }, [mySquadra?.membri, user?.id, user?.nickname, user?.punti_personali, user?.nome, user?.cognome]);

  const myPosition = leaderboardSquadre.findIndex(s => s.id === mySquadra?.id) + 1;
  
  // Get team's upcoming/active games
  const teamGare = gare.filter(
    g => {
      // Controlla se la squadra partecipa alla gara
      // Per gare multisquadra, controlla squadre_partecipanti
      if (g.squadre_partecipanti && g.squadre_partecipanti.length > 0) {
        return g.squadre_partecipanti.some(s => s.id === mySquadra?.id);
      }
      // Per gare 1v1, controlla squadra_a_id e squadra_b_id
      return g.squadra_a_id === mySquadra?.id || g.squadra_b_id === mySquadra?.id;
    }
  );

  // Calcola statistiche gare
  const gareStats = useMemo(() => {
    const vinte = teamGare.filter(g => {
      if (g.classifica && g.classifica.length > 0) {
        const primaPosizione = g.classifica.find(c => c.posizione === 1);
        return primaPosizione?.squadra_id === mySquadra?.id;
      }
      return g.vincitore_id === mySquadra?.id;
    }).length;
    
    const perse = teamGare.filter(g => {
      if (g.stato === 'completata') {
        if (g.classifica && g.classifica.length > 0) {
          const primaPosizione = g.classifica.find(c => c.posizione === 1);
          return primaPosizione?.squadra_id !== mySquadra?.id;
        }
        return g.vincitore_id && g.vincitore_id !== mySquadra?.id;
      }
      return false;
    }).length;
    
    return { vinte, perse, totali: teamGare.length };
  }, [teamGare, mySquadra?.id]);

  // Calcola statistiche squadra
  const squadraStats = useMemo(() => {
    if (!mySquadra) {
      return {
        puntiTotali: 0,
        sommaPuntiPersonali: 0,
        puntiSquadra: 0,
        mediaPunti: 0,
        mvp: null,
      };
    }
    
    const sommaPuntiPersonali = mySquadra.membri.reduce((sum, m) => sum + m.punti_personali, 0);
    const puntiTotali = Math.round(sommaPuntiPersonali * 0.5 + mySquadra.punti_squadra * 1);
    const mediaPunti = teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((acc, m) => acc + m.punti, 0) / teamMembers.length)
      : 0;
    const mvp = teamMembers.length > 0 ? teamMembers[0] : null; // Primo in classifica = MVP
    
    return {
      puntiTotali,
      sommaPuntiPersonali,
      puntiSquadra: mySquadra.punti_squadra,
      mediaPunti,
      mvp,
    };
  }, [mySquadra, teamMembers]);

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
      {/* Hero Header - Minimizzato */}
      <div 
        className="flex-shrink-0 border-b border-white/5 px-3 pt-safe pb-1.5"
        style={{ 
          background: `linear-gradient(135deg, ${mySquadra.colore}15 0%, transparent 100%)` 
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{mySquadra.emoji}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-display font-bold truncate">{mySquadra.nome}</h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Trophy size={10} />
                  #{myPosition}
                </span>
                <span className="flex items-center gap-0.5 text-party-300 font-semibold">
                  <Flame size={10} />
                  {(() => {
                    const sommaPuntiPersonali = mySquadra.membri.reduce((sum, m) => sum + m.punti_personali, 0);
                    const puntiTotali = Math.round(sommaPuntiPersonali * 0.5 + mySquadra.punti_squadra * 1);
                    return puntiTotali;
                  })()}
                </span>
              </div>
            </div>
          </div>
            <button
              onClick={() => setShowSquadraModal(true)}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 flex-shrink-0"
              aria-label="Dettagli squadra"
              title="Dettagli"
            >
            <Info size={14} />
            </button>
        </motion.div>
      </div>

      {/* Content - Recap Squadra */}
      <div className="flex-1 px-3 py-4 pb-28 space-y-4 overflow-y-auto">
        {/* Banner Gara Finita */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-turquoise-500/30 text-center"
        >
          <Trophy size={32} className="text-party-300 mx-auto mb-2" />
          <h2 className="font-display font-bold text-lg mb-1 bg-gradient-to-r from-turquoise-400 via-coral-500 to-turquoise-400 bg-clip-text text-transparent">
            Gara Finita! 🎉
          </h2>
          <p className="text-gray-400 text-xs">
            Ecco il recap completo della tua squadra
          </p>
        </motion.div>

        {/* Statistiche Principali */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-2"
        >
          <div className="glass rounded-xl p-3 border border-turquoise-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-turquoise-400" />
              <span className="text-[10px] text-gray-400">Posizione</span>
            </div>
            <div className="text-2xl font-bold text-turquoise-400">#{myPosition}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              di {leaderboardSquadre.length} squadre
            </div>
          </div>

          <div className="glass rounded-xl p-3 border border-party-300/20">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={16} className="text-party-300" />
              <span className="text-[10px] text-gray-400">Punti Totali</span>
            </div>
            <div className="text-2xl font-bold text-party-300">{squadraStats.puntiTotali}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {(squadraStats.sommaPuntiPersonali * 0.5).toFixed(0)} + {squadraStats.puntiSquadra}
            </div>
          </div>

          <div className="glass rounded-xl p-3 border border-coral-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-coral-500" />
              <span className="text-[10px] text-gray-400">Membri</span>
            </div>
            <div className="text-2xl font-bold text-coral-500">{teamMembers.length}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              Media: {squadraStats.mediaPunti} pts
            </div>
          </div>

          <div className="glass rounded-xl p-3 border border-turquoise-400/20">
            <div className="flex items-center gap-2 mb-1">
              <Swords size={16} className="text-turquoise-400" />
              <span className="text-[10px] text-gray-400">Gare Vinte</span>
            </div>
            <div className="text-2xl font-bold text-turquoise-400">{gareStats.vinte}</div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {gareStats.perse} perse / {gareStats.totali} totali
            </div>
          </div>
        </motion.div>

        {/* MVP Squadra */}
        {squadraStats.mvp && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-4 border border-party-300/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Crown size={18} className="text-party-300" />
              <h3 className="font-semibold text-sm text-party-300">MVP della Squadra</h3>
            </div>
            <button
              type="button"
              onClick={() => setProfileUserId(squadraStats.mvp!.id)}
              className="flex items-center gap-3 w-full"
            >
              <Avatar
                user={{
                  id: squadraStats.mvp.id,
                  nickname: squadraStats.mvp.nickname,
                  avatar: (squadraStats.mvp as any).avatar,
                  punti_personali: squadraStats.mvp.punti,
                  squadra_id: mySquadra.id,
                  is_admin: false,
                  created_at: '',
                }}
                size="md"
              />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{squadraStats.mvp.nickname}</span>
                  <Crown size={14} className="text-party-300" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-turquoise-400 font-bold text-sm">{squadraStats.mvp.punti}</span>
                  <span className="text-gray-400 text-[10px]">punti personali</span>
                </div>
              </div>
            </button>
          </motion.div>
        )}

        {/* Classifica Membri */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-turquoise-400" />
            <h3 className="font-semibold text-sm">Classifica Membri</h3>
          </div>
          <div className="space-y-2">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className={`flex items-center gap-2 py-2 border-l-2 ${
                  member.id === user?.id ? 'border-coral-500/50 pl-2' : 'border-gray-700/30 pl-2'
                }`}
              >
                <div className="w-6 text-center font-bold text-gray-500 text-xs flex-shrink-0">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
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
                      {member.id === user?.id && (
                        <span className="badge-coral flex-shrink-0 text-[10px] px-1.5 py-0.5">Tu</span>
                      )}
                    </div>
                    {(member.nome || member.cognome) && (
                      <p className="text-[9px] text-gray-500 truncate mt-0.5">
                        {[member.nome, member.cognome].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                </button>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-turquoise-400 text-sm">{member.punti}</span>
                  <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Dettagli Punti */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-coral-500" />
            <h3 className="font-semibold text-sm">Dettaglio Punti</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Somma punti personali</span>
              <span className="font-semibold text-gray-300">{squadraStats.sommaPuntiPersonali}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">× 0.5</span>
              <span className="font-semibold text-turquoise-400">
                {(squadraStats.sommaPuntiPersonali * 0.5).toFixed(0)}
              </span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Punti squadra</span>
              <span className="font-semibold text-gray-300">{squadraStats.puntiSquadra}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">× 1</span>
              <span className="font-semibold text-turquoise-400">{squadraStats.puntiSquadra}</span>
            </div>
            <div className="h-px bg-turquoise-400/30 my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-party-300">Totale</span>
              <span className="font-bold text-2xl text-party-300">{squadraStats.puntiTotali}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <SquadraModal
        isOpen={showSquadraModal}
        squadra={mySquadra}
        posizione={myPosition}
        gareVinte={gareStats.vinte}
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
