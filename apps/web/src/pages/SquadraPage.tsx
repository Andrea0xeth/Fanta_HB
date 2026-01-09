import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Flame, Crown, Swords, Info, MessageCircle } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';
import { Countdown } from '../components/Countdown';
import { SquadraModal } from '../components/SquadraModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { SquadraChat } from '../components/SquadraChat';

export const SquadraPage: React.FC = () => {
  const { user, mySquadra, gare, leaderboardSquadre, gameState } = useGame();
  const [showSquadraModal, setShowSquadraModal] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'membri' | 'chat' | 'gare'>('chat');

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

  // Calcola gare vinte: considera sia vincitore_id (gare 1v1) che classifica (gare multisquadra)
  const gareVinte = useMemo(() => {
    return teamGare.filter(g => {
      // Per gare con classifica (multisquadra), la squadra vincitrice è quella con posizione 1
      if (g.classifica && g.classifica.length > 0) {
        const primaPosizione = g.classifica.find(c => c.posizione === 1);
        return primaPosizione?.squadra_id === mySquadra?.id;
      }
      // Per gare 1v1, usa vincitore_id
      return g.vincitore_id === mySquadra?.id;
    }).length;
  }, [teamGare, mySquadra?.id]);

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

      {/* Content - Scrollable, snello */}
      <div className={`flex-1 px-3 py-2 pb-28 ${activeTab === 'chat' ? 'overflow-hidden' : 'space-y-2 overflow-y-auto'}`}>
        {/* Team Stats - Minimizzato */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-around gap-1 py-1.5 border-b border-white/5"
        >
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-coral-500 font-bold">{teamMembers.length}</span>
            <span className="text-gray-500">membri</span>
            </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-turquoise-400 font-bold">{gareVinte}</span>
            <span className="text-gray-500">gare</span>
              </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-party-300 font-bold">
                {Math.round(teamMembers.reduce((acc, m) => acc + m.punti, 0) / teamMembers.length)}
            </span>
            <span className="text-gray-500">media</span>
          </div>
        </motion.div>

        {/* Tab Chat / Membri / Gare */}
        <section className={activeTab === 'chat' ? 'h-[calc(100vh-280px)] min-h-[500px] flex flex-col' : ''}>
          <div className="bg-gray-800/30 rounded-xl p-0.5 flex gap-0.5 mb-2">
            <button
              onClick={() => setActiveTab('membri')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'membri' 
                  ? 'bg-turquoise-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Users size={14} />
              Membri
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'chat' 
                    ? 'bg-turquoise-500 text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <MessageCircle size={14} />
                Chat
              </button>
            )}
            <button
              onClick={() => setActiveTab('gare')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'gare' 
                  ? 'bg-turquoise-500 text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Swords size={14} />
              Gare
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {activeTab === 'membri' ? (
              <motion.div
                key="membri"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-1.5"
              >
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
              </motion.div>
            ) : activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 min-h-0"
              >
                {user && <SquadraChat squadraId={mySquadra.id} currentUser={user} />}
              </motion.div>
            ) : (
              <motion.div
                key="gare"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      <SquadraModal
        isOpen={showSquadraModal}
        squadra={mySquadra}
        posizione={myPosition}
        gareVinte={gareVinte}
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
