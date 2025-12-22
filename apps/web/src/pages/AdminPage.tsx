import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Swords, Gift, Users, Search, Plus, Check, X, Trophy, Shuffle, Bell, RefreshCw } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';
import { SendPushNotificationModal } from '../components/SendPushNotificationModal';
import { ClassificaGaraModal } from '../components/ClassificaGaraModal';
import { CreaGaraModal } from '../components/CreaGaraModal';
import { processPushNotificationQueue } from '../lib/pushNotifications';
import { adminMaintenance } from '../lib/adminMaintenance';
import type { Gara } from '../types';

type TabType = 'gare' | 'bonus' | 'squadre' | 'manutenzione';

export const AdminPage: React.FC = () => {
  const { 
    user, 
    gare, 
    squadre, 
    leaderboardSingoli,
    assegnaVincitore,
    assegnaClassifica,
    creaGara,
    aggiungiBonus,
    refreshData,
    proveInVerifica,
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
  const [maintenanceResult, setMaintenanceResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [maintenanceSearch, setMaintenanceSearch] = useState('');

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
          <Crown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-400 mb-2">Accesso Negato</h2>
          <p className="text-gray-500">Solo gli admin possono accedere a questa pagina.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = leaderboardSingoli.filter(u =>
    u.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maintenanceUsers = useMemo(() => {
    const q = maintenanceSearch.trim().toLowerCase();
    if (!q) return leaderboardSingoli;
    return leaderboardSingoli.filter(u => u.nickname.toLowerCase().includes(q));
  }, [leaderboardSingoli, maintenanceSearch]);

  const toggleSelectedUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const clearSelectedUsers = () => setSelectedUsers(new Set());

  const showMaintenanceToast = (type: 'success' | 'error', message: string) => {
    setMaintenanceResult({ type, message });
    setTimeout(() => setMaintenanceResult(null), 5000);
  };

  const runMaintenance = async (
    action: 'delete_users' | 'reset_user_points' | 'clear_prove_quest' | 'delete_completed_gare' | 'reshuffle_teams',
    payload: Record<string, unknown>
  ) => {
    const result = await adminMaintenance(action, payload);
    if ((result as any)?.success) {
      const details =
        action === 'reshuffle_teams'
          ? `Rimescolati ${(result as any).updated_users ?? 0} utenti su ${(result as any).teams ?? '?'} squadre ✅`
          : 'Operazione completata ✅';
      showMaintenanceToast('success', details);
      await refreshData();
    } else {
      showMaintenanceToast('error', `${(result as any).error || 'Errore'}${(result as any).details ? `: ${(result as any).details}` : ''}`);
    }
  };

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
      {/* Header - Snello */}
      <div className="border-b border-white/5 px-4 pt-safe pb-3">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <Crown className="w-6 h-6 text-party-300 mx-auto mb-1.5" />
          <h1 className="text-lg font-display font-bold mb-0.5">Admin Panel</h1>
          <p className="text-gray-400 text-[10px]">Gestisci il 30diCiaccioGame</p>
          <div className="mt-3 flex items-center gap-2 justify-center flex-wrap">
            <button
              onClick={() => setShowPushNotificationModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2 px-3"
            >
              <Bell size={14} />
              Notifica Push
            </button>
            <button
              onClick={handleProcessQueue}
              disabled={isProcessingQueue || hasProcessedQueue}
              className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 disabled:opacity-50"
            >
              {isProcessingQueue ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
                  />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Processa Coda
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher - Snello */}
        <div className="bg-gray-800/30 rounded-xl p-0.5 flex gap-0.5">
          <button
            onClick={() => setActiveTab('gare')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'gare' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Swords size={12} />
            Gare
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'bonus' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Gift size={12} />
            Bonus
          </button>
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'squadre' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400'
            }`}
          >
            <Users size={12} />
            Squadre
          </button>
          <button
            onClick={() => setActiveTab('manutenzione')}
            className={`flex-1 py-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
              activeTab === 'manutenzione'
                ? 'bg-coral-500 text-white'
                : 'text-gray-400'
            }`}
          >
            <RefreshCw size={12} />
            Manut.
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

      {/* Maintenance Result Toast */}
      <AnimatePresence>
        {maintenanceResult && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-4 right-4 z-50 ${
              maintenanceResult.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg`}
          >
            {maintenanceResult.type === 'success' ? (
              <Check size={20} />
            ) : (
              <X size={20} />
            )}
            <span className="font-semibold">{maintenanceResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - Snello */}
      <div className="px-4 pb-6">
        <AnimatePresence mode="wait">
          {/* GARE TAB */}
          {activeTab === 'gare' && (
            <motion.div
              key="gare"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3 pt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-coral-500" />
                  <h2 className="font-display font-bold text-sm">Gare Attive</h2>
                </div>
                <button
                  onClick={() => setShowCreaGara(true)}
                  className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
                >
                  <Plus size={12} />
                  Nuova
                </button>
              </div>
              
              {gare.filter(g => g.stato !== 'completata').length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <Swords size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nessuna gara attiva</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gare
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
                    ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-3 mb-2 border-t border-white/5">
                <Check size={14} className="text-green-500" />
                <h2 className="font-display font-bold text-sm">Gare Completate</h2>
              </div>
              
              {gare.filter(g => g.stato === 'completata').length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <p>Nessuna gara completata</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gare
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
                    ))}
                </div>
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
              className="space-y-3 pt-3"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Gift size={14} className="text-party-300" />
                <h2 className="font-display font-bold text-sm">Assegna Bonus Punti</h2>
              </div>

              {/* Search User - Snello */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Cerca giocatore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 text-sm py-2"
                />
              </div>

              {/* User List - Snello */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <p>Nessun utente trovato</p>
                  </div>
                ) : (
                  filteredUsers.map((utente) => (
                    <button
                      key={utente.id}
                      onClick={() => {
                        setSelectedUser(utente.id);
                        setSearchQuery(utente.nickname);
                      }}
                      className={`w-full flex items-center gap-2 text-left transition-all py-1.5 border-l-2 ${
                        selectedUser === utente.id ? 'border-coral-500 pl-2 bg-coral-500/5' : 'border-gray-700/30 pl-2'
                      }`}
                    >
                      <Avatar user={utente} size="sm" />
                      <div className="flex-1">
                        <span className="font-semibold text-sm block">{utente.nickname}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{utente.punti_personali} pts</p>
                      </div>
                      {selectedUser === utente.id && (
                        <Check className="text-coral-500" size={16} />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Selected User Form - Snello */}
              {selectedUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 border-t border-white/5 pt-3"
                >
                  {/* Points Input */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Punti da assegnare</label>
                    <input
                      type="number"
                      placeholder="Es: 25"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(e.target.value)}
                      className="input text-sm py-2"
                      min="1"
                      max="100"
                    />
                  </div>

                  {/* Motivo Selection - Snello */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Motivo</label>
                    <div className="flex flex-wrap gap-1.5">
                      {motivoOptions.map((motivo) => (
                        <button
                          key={motivo}
                          onClick={() => setBonusMotivo(motivo)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            bonusMotivo === motivo
                              ? 'bg-coral-500 text-white'
                              : 'bg-gray-800/30 text-gray-400'
                          }`}
                        >
                          {motivo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit - Snello */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setSearchQuery('');
                        setBonusPoints('');
                        setBonusMotivo('');
                      }}
                      className="btn-ghost flex-1 py-2 text-xs"
                    >
                      <X size={14} className="inline mr-1" />
                      Annulla
                    </button>
                    <button
                      onClick={handleBonusSubmit}
                      disabled={!bonusPoints || !bonusMotivo || isSubmittingBonus}
                      className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center py-2 text-xs"
                    >
                      {isSubmittingBonus ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
                          />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          <Plus size={14} className="inline mr-1" />
                          Assegna
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* SQUADRE TAB - Improved spacing */}
          {activeTab === 'squadre' && (
            <motion.div
              key="squadre"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2 pt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-turquoise-400" />
                  <h2 className="font-display font-bold text-sm">Gestione Squadre</h2>
                </div>
                <button
                  className="btn-secondary text-xs py-1.5 px-3"
                  onClick={async () => {
                    const ok = window.confirm(
                      'Rimescolare gli utenti tra le squadre?\n\nQuesto riassegna gli utenti (non-admin) in modo bilanciato.\nI punti squadra NON vengono modificati.'
                    );
                    if (!ok) return;
                    await runMaintenance('reshuffle_teams', {});
                  }}
                >
                  <Shuffle size={12} className="inline mr-1" />
                  Rimescola
                </button>
              </div>

              <div className="space-y-1.5">
                {squadre.map((squadra, index) => (
                  <motion.div
                    key={squadra.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 py-1.5 border-l-2 border-gray-700/30 pl-2"
                  >
                    <span className="text-2xl">{squadra.emoji}</span>
                      <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-0.5">{squadra.nome}</h3>
                      <p className="text-[10px] text-gray-400">
                        {squadra.membri.length} membri • {squadra.punti_squadra} pts
                      </p>
                      </div>
                      <div 
                      className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: squadra.colore }}
                      />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MANUTENZIONE TAB */}
          {activeTab === 'manutenzione' && (
            <motion.div
              key="manutenzione"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-3"
            >
              <div className="flex items-center gap-1.5">
                <RefreshCw size={14} className="text-party-300" />
                <h2 className="font-display font-bold text-sm">Manutenzione (Danger Zone)</h2>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed">
                Azioni irreversibili. Serve il PIN Manutenzione (ti verrà chiesto al primo utilizzo) oppure una sessione Supabase.
              </p>

              {/* Users */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-turquoise-400" />
                    <h3 className="font-semibold text-sm">Utenti</h3>
                  </div>
                  <button
                    onClick={clearSelectedUsers}
                    className="text-[10px] text-gray-400 hover:text-gray-300"
                  >
                    Svuota ({selectedUsers.size})
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={maintenanceSearch}
                    onChange={(e) => setMaintenanceSearch(e.target.value)}
                    placeholder="Cerca utente..."
                    className="input pl-9 text-sm py-2"
                  />
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {maintenanceUsers.map((u) => {
                    const isSelected = selectedUsers.has(u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleSelectedUser(u.id)}
                        className={`w-full flex items-center gap-2 text-left transition-all py-1.5 border-l-2 ${
                          isSelected ? 'border-coral-500 pl-2 bg-coral-500/5' : 'border-gray-700/30 pl-2'
                        }`}
                      >
                        <Avatar user={u} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm truncate">{u.nickname}</span>
                            {u.is_admin && <span className="badge-party text-[10px] px-1.5 py-0.5">admin</span>}
                          </div>
                          <div className="text-[10px] text-gray-400">{u.punti_personali} pts</div>
                        </div>
                        {isSelected && <Check size={16} className="text-coral-500" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="btn-secondary flex-1 py-2 text-xs"
                    disabled={selectedUsers.size === 0}
                    onClick={async () => {
                      if (selectedUsers.size === 0) return;
                      const ok = window.confirm(`Azzerare i punti per ${selectedUsers.size} utenti?`);
                      if (!ok) return;
                      await runMaintenance('reset_user_points', { userIds: Array.from(selectedUsers) });
                    }}
                  >
                    Azzera punti
                  </button>
                  <button
                    className="btn-ghost flex-1 py-2 text-xs border border-red-500/40 text-red-400"
                    disabled={selectedUsers.size === 0}
                    onClick={async () => {
                      if (selectedUsers.size === 0) return;
                      const ok = window.confirm(
                        `CANCELLARE ${selectedUsers.size} utenti?\n\nIrreversibile (DB + Auth se esiste).`
                      );
                      if (!ok) return;
                      await runMaintenance('delete_users', { userIds: Array.from(selectedUsers) });
                      clearSelectedUsers();
                    }}
                  >
                    Cancella utenti
                  </button>
                </div>
              </div>

              {/* Prove */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Prove Quest</h3>
                  <span className="text-[10px] text-gray-400">{proveInVerifica.length} in verifica</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex-1 py-2 text-xs"
                    onClick={async () => {
                      const ok = window.confirm('Pulire SOLO le prove in verifica? (resetta completed_at per permettere reinvio)');
                      if (!ok) return;
                      await runMaintenance('clear_prove_quest', { scope: 'in_verifica' });
                    }}
                  >
                    Pulisci verifiche
                  </button>
                  <button
                    className="btn-ghost flex-1 py-2 text-xs"
                    onClick={async () => {
                      const ok = window.confirm('Pulire TUTTE le prove inviate? (resetta completed_at per tutti)');
                      if (!ok) return;
                      await runMaintenance('clear_prove_quest', { scope: 'all' });
                    }}
                  >
                    Pulisci tutto
                  </button>
                </div>
              </div>

              {/* Gare */}
              <div className="border-t border-white/5 pt-3">
                <h3 className="font-semibold text-sm mb-2">Gare</h3>
                <button
                  className="btn-ghost w-full py-2 text-xs border border-red-500/40 text-red-400"
                  onClick={async () => {
                    const ok = window.confirm(
                      'Cancellare TUTTE le gare completate e fare rollback dei punti squadra?\n\nIrreversibile.'
                    );
                    if (!ok) return;
                    await runMaintenance('delete_completed_gare', {});
                  }}
                >
                  Cancella gare completate + rollback punti
                </button>
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
