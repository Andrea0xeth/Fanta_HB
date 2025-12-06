import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Flame, Swords, CheckCircle2, X } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { QuestCard } from '../components/QuestCard';
import { VerificaCard } from '../components/VerificaCard';
import { GaraCard } from '../components/GaraCard';

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
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-dark px-4 pt-safe pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-white font-bold"
            >
              {user?.nickname?.charAt(0).toUpperCase() || 'G'}
            </motion.button>
            <div>
              <h1 className="font-display font-bold text-lg text-gradient">30diCiaccioGame</h1>
              <p className="text-xs text-gray-500">Ciao, {user?.nickname || 'Giocatore'}!</p>
            </div>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowVerifica(true)}
            className="relative p-2"
          >
            <Bell size={24} className="text-gray-400" />
            {pendingVerifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 rounded-full text-xs font-bold flex items-center justify-center">
                {pendingVerifications.length}
              </span>
            )}
          </motion.button>
        </div>

        {/* Day Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-party rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-white" size={24} />
              <div>
                <h2 className="font-bold text-white">GIORNO {gameState.giorno_corrente} DI 3</h2>
                <p className="text-white/80 text-sm">Tema: Caos Totale! 🎉</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white text-xl">{user?.punti_personali || 0}</div>
              <div className="text-white/80 text-xs">punti</div>
            </div>
          </div>
        </motion.div>

        {/* Team Status */}
        {mySquadra && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mySquadra.emoji}</span>
              <div>
                <h3 className="font-semibold">{mySquadra.nome}</h3>
                <p className="text-sm text-gray-500">La tua squadra</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-party-300 font-bold">
                <Flame size={16} />
                {mySquadra.punti_squadra}
              </div>
              <p className="text-xs text-gray-500">punti squadra</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 space-y-6 pb-6">
        {/* Quest Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              🎯 Quest del Giorno
            </h2>
            <span className="text-sm text-gray-500">{quests.length} disponibili</span>
          </div>
          
          <div className="space-y-3">
            {quests.map((quest, index) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
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
            <h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4">
              <Swords size={20} className="text-coral-500" />
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
              className="w-full max-h-[85vh] bg-gray-900 rounded-t-3xl p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <CheckCircle2 className="text-turquoise-400" />
                  Verifica Quest
                </h2>
                <button 
                  onClick={() => setShowVerifica(false)}
                  className="p-2 hover:bg-gray-800 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              {pendingVerifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nessuna prova da verificare!</p>
                  <p className="text-sm">Torna più tardi 😊</p>
                </div>
              ) : (
                <div className="space-y-4">
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
              className="w-full max-w-sm bg-gray-900 rounded-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-coral-500 to-turquoise-400 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                  {user?.nickname?.charAt(0).toUpperCase() || 'G'}
                </div>
                <h2 className="font-bold text-xl">{user?.nickname || 'Giocatore'}</h2>
                <p className="text-gray-500">Membro di {mySquadra?.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-coral-500">{user?.punti_personali || 0}</div>
                  <div className="text-xs text-gray-500">Punti Personali</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-turquoise-400">{mySquadra?.punti_squadra || 0}</div>
                  <div className="text-xs text-gray-500">Punti Squadra</div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  logout();
                  setShowProfile(false);
                }}
                className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-semibold"
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
