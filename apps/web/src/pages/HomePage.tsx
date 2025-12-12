import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Flame, CheckCircle2, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { QuestCard } from '../components/QuestCard';
import { VerificaCard } from '../components/VerificaCard';
import { GaraCard } from '../components/GaraCard';
import { CircusNeonDecorations } from '../components/CircusNeonDecorations';
import { Avatar } from '../components/Avatar';
import { PushNotificationSettings } from '../components/PushNotificationSettings';

export const HomePage: React.FC = () => {
  const { 
    user, 
    mySquadra, 
    quests, 
    gare, 
    proveInVerifica,
    gameState,
    submitProva,
    votaProva,
    logout
  } = useGame();
  
  const [showVerifica, setShowVerifica] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pendingVerifications = proveInVerifica.filter(
    p => p.stato === 'in_verifica' && p.user_id !== user?.id
  );

  const nextGara = gare.find(g => g.stato !== 'completata');

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Header - Fixed, compact */}
      <div className="flex-shrink-0 glass-strong px-4 pt-safe pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(true)}
              className="rounded-2xl overflow-hidden"
            >
              <Avatar user={user} size="md" />
            </motion.button>
            <div>
              <h1 className="font-display font-bold text-base text-gradient leading-tight">30diCiaccioGame</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Ciao, {user?.nickname || 'Giocatore'}!</p>
            </div>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVerifica(true)}
            className="relative p-1.5"
          >
            <Bell size={20} className="text-gray-400" />
            {pendingVerifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                {pendingVerifications.length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Day Banner - Compact */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-party rounded-3xl p-3 mb-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-white" size={18} />
              <div>
                <h2 className="font-bold text-white text-sm leading-tight">GIORNO {gameState.giorno_corrente} DI 3</h2>
                <p className="text-white/80 text-[10px] leading-tight">Tema: Caos Totale! 🎉</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white text-lg leading-tight">{user?.punti_personali || 0}</div>
              <div className="text-white/80 text-[10px] leading-tight">punti</div>
            </div>
          </div>
        </motion.div>

        {/* Team Status - Compact */}
        {mySquadra && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card flex items-center justify-between py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{mySquadra.emoji}</span>
              <div>
                <h3 className="font-semibold text-sm leading-tight">{mySquadra.nome}</h3>
                <p className="text-[10px] text-gray-500 leading-tight">La tua squadra</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-party-300 font-bold text-sm leading-tight">
                <Flame size={14} />
                {mySquadra.punti_squadra}
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">punti squadra</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content - Scrollable, passes under navbar - 8pt grid spacing */}
      <div className="flex-1 px-4 py-3 pb-28 space-y-4">
        {/* Quest Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-sm flex items-center gap-2">
              <CircusNeonDecorations variant="star" size="small" color="red" />
              Quest del Giorno
            </h2>
            <span className="text-[10px] text-gray-500">{quests.length} disponibili</span>
          </div>
          
          <div className="space-y-3">
            {quests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <QuestCard 
                  quest={quest} 
                  onSubmit={submitProva}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Next Gara Section */}
        {nextGara && (
          <section>
            <h2 className="font-display font-bold text-sm flex items-center gap-2 mb-3">
              <CircusNeonDecorations variant="clown-face" size="small" color="orange" />
              Prossima Gara
            </h2>
            <GaraCard gara={nextGara} />
          </section>
        )}
      </div>

      {/* Verifica Modal */}
      <AnimatePresence>
        {showVerifica && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => setShowVerifica(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[85vh] glass-strong rounded-t-3xl overflow-hidden flex flex-col mb-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                <h2 className="font-display font-bold text-lg flex items-center gap-1.5">
                  <CheckCircle2 className="text-turquoise-400" size={18} />
                  Verifica Quest
                </h2>
                <button 
                  onClick={() => setShowVerifica(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 pb-24">
                {pendingVerifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle2 size={36} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nessuna prova da verificare!</p>
                    <p className="text-xs">Torna più tardi 😊</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVerifications.map((prova) => (
                      <VerificaCard 
                        key={prova.id} 
                        prova={prova} 
                        onVote={(id, valore) => {
                          votaProva(id, valore);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass-strong rounded-3xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="mx-auto mb-3">
                  <Avatar user={user} size="lg" />
                </div>
                <h2 className="font-bold text-lg">{user?.nickname || 'Giocatore'}</h2>
                <p className="text-gray-500 text-sm">Membro di {mySquadra?.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="card text-center py-2">
                  <div className="text-xl font-bold text-coral-500">{user?.punti_personali || 0}</div>
                  <div className="text-[10px] text-gray-500">Punti Personali</div>
                </div>
                <div className="card text-center py-2">
                  <div className="text-xl font-bold text-turquoise-400">{mySquadra?.punti_squadra || 0}</div>
                  <div className="text-[10px] text-gray-500">Punti Squadra</div>
                </div>
              </div>

              {/* Push Notification Settings */}
              <div className="mb-4">
                <PushNotificationSettings />
              </div>
              
              <button
                onClick={() => {
                  logout();
                  setShowProfile(false);
                }}
                className="w-full py-2.5 rounded-xl glass border border-red-500/30 text-red-400 font-semibold text-sm"
              >
                Esci dal Game
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
