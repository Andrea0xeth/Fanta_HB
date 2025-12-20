import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Swords, Gift, Users, Search, Plus, Check, X, Trophy, Shuffle, Bell, RefreshCw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';
import { SendPushNotificationModal } from '../components/SendPushNotificationModal';
import { ClassificaGaraModal } from '../components/ClassificaGaraModal';
import { CreaGaraModal } from '../components/CreaGaraModal';
import { processPushNotificationQueue } from '../lib/pushNotifications';
import type { Gara } from '../types';

type TabType = 'gare' | 'bonus' | 'squadre';

export const AdminPage: React.FC = () => {
  const { 
    user, 
    gare, 
    squadre, 
    leaderboardSingoli,
    assegnaVincitore,
    assegnaClassifica,
    creaGara,
    aggiungiBonus 
  } = useGame();

  const [activeTab, setActiveTab] = useState<TabType>('gare');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [bonusPoints, setBonusPoints] = useState('');
  const [bonusMotivo, setBonusMotivo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedGaraForClassifica, setSelectedGaraForClassifica] = useState<Gara | null>(null);
  const [showCreaGara, setShowCreaGara] = useState(false);
  const [showPushNotificationModal, setShowPushNotificationModal] = useState(false);
  const [isSubmittingBonus, setIsSubmittingBonus] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [hasProcessedQueue, setHasProcessedQueue] = useState(false);
  const [queueProcessResult, setQueueProcessResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Listener per aprire il modal classifica
  useEffect(() => {
    const handleOpenClassifica = (event: CustomEvent) => {
      setSelectedGaraForClassifica(event.detail.gara);
    };
    window.addEventListener('open-classifica-modal' as any, handleOpenClassifica as EventListener);
    return () => {
      window.removeEventListener('open-classifica-modal' as any, handleOpenClassifica as EventListener);
    };
  }, []);

  // Check admin access
  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center">
          <Crown className="w-16 h-16 text-white/35 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/80 mb-2">Accesso Negato</h2>
          <p className="text-muted">Solo gli admin possono accedere a questa pagina.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = leaderboardSingoli.filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBonusSubmit = async () => {
    if (!selectedUser || !bonusPoints || !bonusMotivo || isSubmittingBonus) return;
    
    setIsSubmittingBonus(true);
    try {
      await aggiungiBonus(selectedUser, parseInt(bonusPoints), bonusMotivo);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      setSelectedUser(null);
      setSearchQuery('');
      setBonusPoints('');
      setBonusMotivo('');
    } catch (error) {
      console.error('Errore assegnazione bonus:', error);
      // L'errore viene già gestito dalla funzione aggiungiBonus
    } finally {
      setIsSubmittingBonus(false);
    }
  };

  const handleProcessQueue = async () => {
    if (isProcessingQueue || hasProcessedQueue) return;
    
    setIsProcessingQueue(true);
    setQueueProcessResult(null);
    
    try {
      const result = await processPushNotificationQueue();
      
      if (result.success) {
        setQueueProcessResult({
          type: 'success',
          message: result.message || 'Coda processata con successo!',
        });
      } else {
        setQueueProcessResult({
          type: 'error',
          message: result.message || 'Errore durante il processamento della coda',
        });
      }
      
      // Rimuovi il messaggio dopo 5 secondi
      setTimeout(() => setQueueProcessResult(null), 5000);
    } catch (error: any) {
      setQueueProcessResult({
        type: 'error',
        message: error.message || 'Errore durante il processamento della coda',
      });
      setTimeout(() => setQueueProcessResult(null), 5000);
    } finally {
      setIsProcessingQueue(false);
      setHasProcessedQueue(true);
    }
  };

  const motivoOptions = [
    'MVP della gara',
    'Prova epica',
    'Borgese style 🔥',
    'Fair play',
    'Spirito di squadra',
    'Momento iconico',
  ];

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-dark px-4 pt-safe pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <Crown className="w-12 h-12 text-party-300 mx-auto mb-2" />
          <h1 className="text-2xl font-display font-bold">Admin Panel</h1>
          <p className="text-muted text-sm">Gestisci il 30diCiaccioGame</p>
          <div className="mt-4 flex items-center gap-2 justify-center flex-wrap">
            <button
              onClick={() => setShowPushNotificationModal(true)}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
            >
              <Bell size={16} />
              Invia Notifica Push
            </button>
            <button
              onClick={handleProcessQueue}
              disabled={isProcessingQueue || hasProcessedQueue}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50"
            >
              {isProcessingQueue ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Processa Coda Notifiche
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="glass rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('gare')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'gare' 
                ? 'bg-coral-500 text-white' 
                : 'text-white/75 hover:text-white'
            }`}
          >
            <Swords size={16} />
            Gare
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'bonus' 
                ? 'bg-coral-500 text-white' 
                : 'text-white/75 hover:text-white'
            }`}
          >
            <Gift size={16} />
            Bonus
          </button>
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'squadre' 
                ? 'bg-coral-500 text-white' 
                : 'text-white/75 hover:text-white'
            }`}
          >
            <Users size={16} />
            Squadre
          </button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
          >
            <Check size={20} />
            <span className="font-semibold">Bonus assegnato con successo!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Process Result Toast */}
      <AnimatePresence>
        {queueProcessResult && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-4 right-4 z-50 ${
              queueProcessResult.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg`}
          >
            {queueProcessResult.type === 'success' ? (
              <Check size={20} />
            ) : (
              <X size={20} />
            )}
            <span className="font-semibold">{queueProcessResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 pb-6">
        <AnimatePresence mode="wait">
          {/* GARE TAB */}
          {activeTab === 'gare' && (
            <motion.div
              key="gare"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 pt-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Trophy size={20} className="text-coral-500" />
                  Gare Attive
                </h2>
                <button
                  onClick={() => setShowCreaGara(true)}
                  className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                >
                  <Plus size={16} />
                  Nuova Gara
                </button>
              </div>
              
              {gare.filter(g => g.stato !== 'completata').length === 0 ? (
                <div className="card text-center py-12 text-muted">
                  <Swords size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nessuna gara attiva</p>
                </div>
              ) : (
                gare
                  .filter(g => g.stato !== 'completata')
                  .map((gara) => (
                    <GaraCard 
                      key={gara.id} 
                      gara={gara} 
                      isAdmin 
                      onAssegnaVincitore={assegnaVincitore}
                      onAssegnaClassifica={async (garaId, classifiche) => {
                        await assegnaClassifica(garaId, classifiche);
                        setSelectedGaraForClassifica(null);
                      }}
                    />
                  ))
              )}

              <h2 className="font-display font-bold text-lg flex items-center gap-2 pt-4">
                <Check size={20} className="text-green-500" />
                Gare Completate
              </h2>
              
              {gare.filter(g => g.stato === 'completata').length === 0 ? (
                <div className="card text-center py-8 text-muted">
                  <p>Nessuna gara completata</p>
                </div>
              ) : (
                gare
                  .filter(g => g.stato === 'completata')
                  .map((gara) => (
                    <GaraCard 
                      key={gara.id} 
                      gara={gara} 
                      isAdmin
                      onAssegnaClassifica={async (garaId, classifiche) => {
                        await assegnaClassifica(garaId, classifiche);
                        setSelectedGaraForClassifica(null);
                      }}
                    />
                  ))
              )}
            </motion.div>
          )}

          {/* BONUS TAB */}
          {activeTab === 'bonus' && (
            <motion.div
              key="bonus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Gift size={20} className="text-party-300" />
                Assegna Bonus Punti
              </h2>

              {/* Search User */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60" size={20} />
                <input
                  type="text"
                  placeholder="Cerca giocatore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-12"
                />
              </div>

              {/* User List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="card text-center py-8 text-muted">
                    <p className="text-sm">Nessun utente trovato</p>
                  </div>
                ) : (
                  filteredUsers.map((utente) => (
                    <button
                      key={utente.id}
                      onClick={() => {
                        setSelectedUser(utente.id);
                        setSearchQuery(utente.nickname);
                      }}
                      className={`w-full card flex items-center gap-3 text-left transition-all ${
                        selectedUser === utente.id ? 'border-coral-500 border-2' : ''
                      }`}
                    >
                      <Avatar user={utente} size="md" />
                      <div className="flex-1">
                        <span className="font-semibold">{utente.nickname}</span>
                        <p className="text-xs text-muted">{utente.punti_personali} pts</p>
                      </div>
                      {selectedUser === utente.id && (
                        <Check className="text-coral-500" size={20} />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Selected User Form */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Points Input */}
                  <div>
                    <label className="block text-sm text-muted mb-2">Punti da assegnare</label>
                    <input
                      type="number"
                      placeholder="Es: 25"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(e.target.value)}
                      className="input"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Motivo Selection */}
                  <div>
                    <label className="block text-sm text-muted mb-2">Motivo</label>
                    <div className="flex flex-wrap gap-2">
                      {motivoOptions.map((motivo) => (
                        <button
                          key={motivo}
                          onClick={() => setBonusMotivo(motivo)}
                          className={`px-3 py-2 rounded-xl text-sm transition-all ${
                            bonusMotivo === motivo
                              ? 'bg-coral-500 text-white'
                              : 'glass text-white/75 hover:bg-white/10'
                          }`}
                        >
                          {motivo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                        setBonusPoints('');
                        setBonusMotivo('');
                      }}
                      className="btn-ghost flex-1"
                    >
                      <X size={18} className="inline mr-2" />
                      Annulla
                    </button>
                    <button
                      onClick={handleBonusSubmit}
                      disabled={!bonusPoints || !bonusMotivo || isSubmittingBonus}
                      className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSubmittingBonus ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          <Plus size={18} className="inline mr-2" />
                          Assegna Bonus
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* SQUADRE TAB */}
          {activeTab === 'squadre' && (
            <motion.div
              key="squadre"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 pt-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg flex items-center gap-2">
                  <Users size={20} className="text-turquoise-400" />
                  Gestione Squadre
                </h2>
                <button className="btn-secondary text-sm py-2">
                  <Shuffle size={16} className="inline mr-2" />
                  Rimescola
                </button>
              </div>

              <div className="space-y-3">
                {squadre.map((squadra, index) => (
                  <motion.div
                    key={squadra.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{squadra.emoji}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{squadra.nome}</h3>
                        <p className="text-sm text-muted">
                          {squadra.membri.length || '5'} membri • {squadra.punti_squadra} pts
                        </p>
                      </div>
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: squadra.colore }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Push Notification Modal */}
      <SendPushNotificationModal
        isOpen={showPushNotificationModal}
        onClose={() => setShowPushNotificationModal(false)}
      />

      {/* Classifica Gara Modal */}
      {selectedGaraForClassifica && (
        <ClassificaGaraModal
          gara={selectedGaraForClassifica}
          squadre={squadre}
          onClose={() => setSelectedGaraForClassifica(null)}
          onSave={async (classifiche) => {
            await assegnaClassifica(selectedGaraForClassifica.id, classifiche);
            setSelectedGaraForClassifica(null);
          }}
        />
      )}

      {/* Crea Gara Modal */}
      {showCreaGara && (
        <CreaGaraModal
          squadre={squadre}
          onClose={() => setShowCreaGara(false)}
          onCreate={async (gara) => {
            await creaGara(gara);
            setShowCreaGara(false);
          }}
        />
      )}
    </div>
  );
};
