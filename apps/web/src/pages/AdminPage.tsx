import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Swords, Gift, Users, Search, Plus, Check, X, Trophy, Shuffle, Bell, RefreshCw, Download, FileText } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { GaraCard } from '../components/GaraCard';
import { Avatar } from '../components/Avatar';
import { SendPushNotificationModal } from '../components/SendPushNotificationModal';
import { ClassificaGaraModal } from '../components/ClassificaGaraModal';
import { CreaGaraModal } from '../components/CreaGaraModal';
import { adminMaintenance } from '../lib/adminMaintenance';
import type { Gara } from '../types';

type TabType = 'gare' | 'bonus' | 'squadre' | 'manutenzione' | 'quest-speciali' | 'premi' | 'utenti';

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
    creaSquadra,
    modificaSquadra,
    eliminaSquadra,
    cambiaSquadraUtente,
    assegnaPuntiQuestSpeciale,
    quests,
    premi,
    creaPremio,
    eliminaPremio,
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
  const [maintenanceResult, setMaintenanceResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [showCreaSquadra, setShowCreaSquadra] = useState(false);
  const [squadraNome, setSquadraNome] = useState('');
  const [squadraEmoji, setSquadraEmoji] = useState('');
  const [squadraColore, setSquadraColore] = useState('#FF6B6B');
  const [isSubmittingSquadra, setIsSubmittingSquadra] = useState(false);
  const [squadraError, setSquadraError] = useState<string | null>(null);
  const [selectedUsersForSquadra, setSelectedUsersForSquadra] = useState<Set<string>>(new Set());
  const [searchUsersForSquadra, setSearchUsersForSquadra] = useState('');
  const [showModificaSquadra, setShowModificaSquadra] = useState(false);
  const [squadraDaModificare, setSquadraDaModificare] = useState<string | null>(null);
  const [editingSquadraMembers, setEditingSquadraMembers] = useState<Set<string>>(new Set());
  const [searchEditingMembers, setSearchEditingMembers] = useState('');
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);
  const [changingSquadraForUser, setChangingSquadraForUser] = useState<string | null>(null);
  const [showCreaPremio, setShowCreaPremio] = useState(false);
  const [premioTitolo, setPremioTitolo] = useState('');
  const [premioDescrizione, setPremioDescrizione] = useState('');
  const [premioImmagine, setPremioImmagine] = useState('🎁');
  const [premioTipo, setPremioTipo] = useState<'squadra' | 'singolo' | 'giornaliero' | 'speciale'>('singolo');
  const [premioPunti, setPremioPunti] = useState('');
  const [premioPosizione, setPremioPosizione] = useState('');
  const [isSubmittingPremio, setIsSubmittingPremio] = useState(false);
  const [premioError, setPremioError] = useState<string | null>(null);

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
          <p className="text-gray-400 text-[10px]">Gestisci il DC-30</p>
          <div className="mt-3 flex items-center justify-center">
            <button
              onClick={() => setShowPushNotificationModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4"
            >
              <Bell size={14} />
              Notifica Push
            </button>
          </div>
        </motion.div>

        {/* Tab Switcher - Migliorato */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-1 flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gare')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'gare' 
                ? 'bg-gradient-to-r from-coral-500 to-coral-600 text-white shadow-lg shadow-coral-500/30 scale-105' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Swords size={14} />
            <span>Gare</span>
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'bonus' 
                ? 'bg-gradient-to-r from-party-300 to-party-400 text-white shadow-lg shadow-party-300/30 scale-105' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Gift size={14} />
            <span>Bonus</span>
          </button>
          <button
            onClick={() => setActiveTab('squadre')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'squadre' 
                ? 'bg-gradient-to-r from-turquoise-400 to-turquoise-500 text-white shadow-lg shadow-turquoise-400/30 scale-105' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Users size={14} />
            <span>Squadre</span>
          </button>
          <button
            onClick={() => setActiveTab('quest-speciali')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'quest-speciali' 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30 scale-105' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Trophy size={14} />
            <span>Quest ⭐</span>
          </button>
          <button
            onClick={() => setActiveTab('premi')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'premi'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Gift size={14} />
            <span>Premi</span>
          </button>
          <button
            onClick={() => setActiveTab('manutenzione')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'manutenzione'
                ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <RefreshCw size={14} />
            <span>Manut.</span>
          </button>
          <button
            onClick={() => setActiveTab('utenti')}
            className={`flex-shrink-0 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
              activeTab === 'utenti'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <FileText size={14} />
            <span>Utenti</span>
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

      {/* Generic Success Message Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg"
          >
            <Check size={20} />
            <span className="font-semibold">{successMessage}</span>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowCreaSquadra(true);
                      setSquadraNome('');
                      setSquadraEmoji('🏆');
                      setSquadraColore('#FF6B6B');
                      setSquadraError(null);
                      setSelectedUsersForSquadra(new Set());
                      setSearchUsersForSquadra('');
                    }}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Nuova
                  </button>
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
              </div>

              <div className="space-y-2">
                {squadre.map((squadra, index) => (
                  <motion.div
                    key={squadra.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-l-2 border-gray-700/30 pl-2 py-1.5"
                  >
                    {/* Visualizza squadra */}
                    <>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{squadra.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{squadra.nome}</h3>
                            <p className="text-[10px] text-gray-400">
                              {squadra.membri.length} membri • {squadra.punti_squadra} pts
                            </p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: squadra.colore }}
                          />
                        </div>

                        {/* Mostra membri */}
                        <div className="mt-1.5 pl-8">
                          {squadra.membri.length === 0 ? (
                            <span className="text-[10px] text-gray-500">Nessun membro</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {squadra.membri
                                .slice()
                                .sort((a, b) => a.nickname.localeCompare(b.nickname))
                                .map((m) => (
                                  <span
                                    key={m.id}
                                    className="px-2 py-0.5 rounded-full text-[10px] bg-gray-800/40 text-gray-300"
                                  >
                                    {m.nickname}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Azioni */}
                        <div className="flex gap-2 mt-2 pl-8">
                          <button
                            onClick={() => {
                              setSquadraDaModificare(squadra.id);
                              setSquadraNome(squadra.nome);
                              setSquadraEmoji(squadra.emoji);
                              setSquadraColore(squadra.colore);
                              // Inizializza con i membri attuali già selezionati
                              setEditingSquadraMembers(new Set(squadra.membri.map(m => m.id)));
                              setSearchEditingMembers('');
                              setShowOnlyMembers(false);
                              setSquadraError(null);
                              setShowModificaSquadra(true);
                            }}
                            className="btn-secondary text-[10px] py-1 px-2"
                          >
                            Modifica
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = window.confirm(
                                `Eliminare la squadra "${squadra.nome}"?\n\nQuesta azione è irreversibile.\n\nNota: La squadra deve essere vuota (nessun membro) e non deve avere gare associate.`
                              );
                              if (!ok) return;
                              try {
                                await eliminaSquadra(squadra.id);
                                setSuccessMessage(`Squadra "${squadra.nome}" eliminata con successo!`);
                                setTimeout(() => setSuccessMessage(null), 3000);
                              } catch (error: any) {
                                alert(`Errore: ${error.message || 'Impossibile eliminare la squadra'}`);
                              }
                            }}
                            className="btn-ghost text-[10px] py-1 px-2 text-red-400 border border-red-500/40"
                          >
                            Elimina
                          </button>
                        </div>
                    </>
                  </motion.div>
                ))}
              </div>

              {/* Visualizzazione Utenti per Squadra */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 mb-2">Utenti</h3>
                <div className="space-y-1">
                  {(() => {
                    const sortedUsers = [...leaderboardSingoli].sort((a, b) => {
                      if (a.squadra_id && !b.squadra_id) return -1;
                      if (!a.squadra_id && b.squadra_id) return 1;
                      if (a.squadra_id && b.squadra_id) {
                        const squadraA = squadre.find(s => s.id === a.squadra_id);
                        const squadraB = squadre.find(s => s.id === b.squadra_id);
                        const nomeA = squadraA?.nome || '';
                        const nomeB = squadraB?.nome || '';
                        if (nomeA !== nomeB) return nomeA.localeCompare(nomeB);
                      }
                      return (a.nickname || '').localeCompare(b.nickname || '');
                    });

                    return sortedUsers.map((u) => {
                      const isChanging = changingSquadraForUser === u.id;
                      return (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors"
                        >
                          <div className="text-xs flex-1 min-w-0">
                            <div className="truncate">
                              {u.nickname}
                              {u.is_admin && <span className="ml-1 text-[9px] text-party-300">●</span>}
                            </div>
                            {(u.nome || u.cognome) && (
                              <div className="text-[10px] text-gray-400 truncate">
                                {[u.nome, u.cognome].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </div>
                          <select
                            value={u.squadra_id || ''}
                            onChange={async (e) => {
                              const nuovaSquadraId = e.target.value || null;
                              if (nuovaSquadraId === u.squadra_id) return;
                              setChangingSquadraForUser(u.id);
                              try {
                                await cambiaSquadraUtente(u.id, nuovaSquadraId);
                                setSuccessMessage(`Squadra aggiornata per ${u.nickname}`);
                                setTimeout(() => setSuccessMessage(null), 2000);
                              } catch (error: any) {
                                alert(`Errore: ${error.message || 'Impossibile cambiare la squadra'}`);
                              } finally {
                                setChangingSquadraForUser(null);
                              }
                            }}
                            disabled={isChanging || isSubmittingSquadra}
                            className="text-[10px] py-1 px-1.5 rounded bg-gray-800/50 border border-white/10 text-gray-200 focus:outline-none focus:ring-1 focus:ring-turquoise-500/50 disabled:opacity-50 min-w-[100px]"
                          >
                            <option value="">-</option>
                            {squadre.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.emoji} {s.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </motion.div>
          )}

          {/* PREMI TAB */}
          {activeTab === 'premi' && (
            <motion.div
              key="premi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Gift size={14} className="text-party-300" />
                  <h2 className="font-display font-bold text-sm">Gestione Premi</h2>
                </div>
                <button
                  onClick={() => {
                    setShowCreaPremio(true);
                    setPremioTitolo('');
                    setPremioDescrizione('');
                    setPremioImmagine('🎁');
                    setPremioTipo('singolo');
                    setPremioPunti('');
                    setPremioError(null);
                  }}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <Plus size={12} />
                  Nuovo
                </button>
              </div>

              {/* Form Crea Premio */}
              {showCreaPremio && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-l-2 border-party-300/50 pl-2 py-2 space-y-2"
                >
                  <div>
                    <label className="block text-xs text-gray-300 mb-1 font-semibold">Titolo</label>
                    <input
                      type="text"
                      value={premioTitolo}
                      onChange={(e) => setPremioTitolo(e.target.value)}
                      placeholder="Es: iPhone 15"
                      className="input text-sm py-1.5 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1 font-semibold">Descrizione</label>
                    <textarea
                      value={premioDescrizione}
                      onChange={(e) => setPremioDescrizione(e.target.value)}
                      placeholder="Descrizione del premio..."
                      className="input text-sm py-1.5 w-full min-h-[60px]"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-300 mb-1 font-semibold">Emoji/Immagine</label>
                      <input
                        type="text"
                        value={premioImmagine}
                        onChange={(e) => setPremioImmagine(e.target.value)}
                        placeholder="🎁"
                        className="input text-2xl text-center py-1.5 w-full"
                        maxLength={2}
                      />
                    </div>
                    {premioTipo !== 'squadra' && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1 font-semibold">Punti Richiesti</label>
                        <input
                          type="number"
                          value={premioPunti}
                          onChange={(e) => setPremioPunti(e.target.value)}
                          placeholder="300"
                          className="input text-sm py-1.5 w-full"
                          min="1"
                        />
                      </div>
                    )}
                    {premioTipo === 'squadra' && (
                      <div className="flex-1">
                        <label className="block text-xs text-gray-300 mb-1 font-semibold">Posizione Classifica</label>
                        <input
                          type="number"
                          value={premioPosizione}
                          onChange={(e) => setPremioPosizione(e.target.value)}
                          placeholder="1 (per 1° posto)"
                          className="input text-sm py-1.5 w-full"
                          min="1"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          Posizione in classifica (1 = 1° posto, 2 = 2° posto, ecc.)
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1 font-semibold">Tipo</label>
                    <div className="flex gap-1.5">
                      {(['squadra', 'singolo', 'giornaliero', 'speciale'] as const).map((tipo) => (
                        <button
                          key={tipo}
                          onClick={() => setPremioTipo(tipo)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            premioTipo === tipo
                              ? 'bg-coral-500 text-white'
                              : 'bg-gray-800/30 text-gray-400'
                          }`}
                        >
                          {tipo === 'squadra' ? 'Squadra' : tipo === 'singolo' ? 'Singolo' : tipo === 'giornaliero' ? 'Giornaliero' : 'Speciale'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {premioError && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-2">
                      <p className="text-xs text-red-400">{premioError}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowCreaPremio(false);
                        setPremioTitolo('');
                        setPremioDescrizione('');
                        setPremioImmagine('🎁');
                        setPremioTipo('singolo');
                        setPremioPunti('');
                        setPremioError(null);
                      }}
                      className="btn-ghost flex-1 py-2 text-xs"
                    >
                      <X size={14} className="inline mr-1" />
                      Annulla
                    </button>
                    <button
                      onClick={async () => {
                        if (!premioTitolo.trim()) {
                          setPremioError('Titolo è obbligatorio');
                          return;
                        }
                        if (premioTipo === 'squadra' && !premioPosizione) {
                          setPremioError('Posizione classifica è obbligatoria per i premi di squadra');
                          return;
                        }
                        if (premioTipo !== 'squadra' && !premioPunti) {
                          setPremioError('Punti richiesti sono obbligatori per questo tipo di premio');
                          return;
                        }
                        setIsSubmittingPremio(true);
                        setPremioError(null);
                        try {
                          console.log('[AdminPage] 🚀 Inizio creazione premio');
                          console.log('[AdminPage] 📋 Dati form:', {
                            titolo: premioTitolo,
                            descrizione: premioDescrizione,
                            immagine: premioImmagine,
                            tipo: premioTipo,
                            premioPosizione,
                            premioPunti,
                          });

                          const posizioneNum = premioTipo === 'squadra' ? parseInt(premioPosizione) : undefined;
                          const puntiNum = premioTipo !== 'squadra' ? parseInt(premioPunti) : null;
                          
                          console.log('[AdminPage] 🔍 Valori parsati:', {
                            posizioneNum,
                            puntiNum,
                            premioTipo,
                          });
                          
                          if (premioTipo === 'squadra' && (isNaN(posizioneNum!) || posizioneNum! <= 0)) {
                            console.error('[AdminPage] ❌ Errore validazione: Posizione classifica invalida');
                            setPremioError('Posizione classifica deve essere un numero maggiore di 0');
                            setIsSubmittingPremio(false);
                            return;
                          }
                          if (premioTipo !== 'squadra' && (isNaN(puntiNum!) || puntiNum! <= 0)) {
                            console.error('[AdminPage] ❌ Errore validazione: Punti richiesti invalidi');
                            setPremioError('Punti richiesti deve essere un numero maggiore di 0');
                            setIsSubmittingPremio(false);
                            return;
                          }

                          const premioData = {
                            titolo: premioTitolo.trim(),
                            descrizione: premioDescrizione.trim() || undefined,
                            immagine: premioImmagine || '🎁',
                            tipo: premioTipo,
                            punti_richiesti: puntiNum,
                            posizione_classifica: posizioneNum,
                          };

                          console.log('[AdminPage] 📤 Dati da inviare a creaPremio:', JSON.stringify(premioData, null, 2));

                          await creaPremio(premioData);
                          console.log('[AdminPage] ✅ Premio creato con successo');
                          setSuccessMessage(`Premio "${premioTitolo.trim()}" creato con successo!`);
                          setTimeout(() => setSuccessMessage(null), 3000);
                          // Chiudi il form e resetta i campi
                          setShowCreaPremio(false);
                          setPremioTitolo('');
                          setPremioDescrizione('');
                          setPremioImmagine('🎁');
                          setPremioTipo('singolo');
                          setPremioPunti('');
                          setPremioPosizione('');
                          setPremioError(null);
                          // Refresh esplicito dei dati
                          await refreshData();
                        } catch (error: any) {
                          console.error('[AdminPage] ❌ Errore creazione premio:', error);
                          console.error('[AdminPage] ❌ Tipo errore:', typeof error);
                          console.error('[AdminPage] ❌ Messaggio errore:', error?.message);
                          console.error('[AdminPage] ❌ Stack trace:', error?.stack);
                          setPremioError(error?.message || 'Errore durante la creazione');
                        } finally {
                          setIsSubmittingPremio(false);
                          console.log('[AdminPage] 🏁 Fine operazione creazione premio');
                        }
                      }}
                      disabled={isSubmittingPremio || !premioTitolo.trim() || (premioTipo === 'squadra' ? !premioPosizione : !premioPunti)}
                      className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center py-2 text-xs"
                    >
                      {isSubmittingPremio ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
                          />
                          Creazione...
                        </>
                      ) : (
                        <>
                          <Plus size={14} className="inline mr-1" />
                          Crea Premio
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Lista Premi */}
              <div className="space-y-2">
                {premi.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <Gift size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nessun premio creato</p>
                  </div>
                ) : (
                  premi.map((premio) => (
                    <motion.div
                      key={premio.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-l-2 border-gray-700/30 pl-2 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{premio.immagine}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{premio.titolo}</h3>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{premio.descrizione}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500">{premio.tipo}</span>
                            <span className="text-[10px] text-gray-400">•</span>
                            {premio.tipo === 'squadra' && premio.posizione_classifica ? (
                              <span className="text-[10px] text-gray-400">{premio.posizione_classifica}° posto</span>
                            ) : (
                              <span className="text-[10px] text-gray-400">{premio.punti_richiesti || 0} pts</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const ok = window.confirm(`Eliminare il premio "${premio.titolo}"?`);
                            if (!ok) return;
                            try {
                              await eliminaPremio(premio.id);
                            } catch (error: any) {
                              alert(`Errore: ${error.message || 'Impossibile eliminare il premio'}`);
                            }
                          }}
                          className="btn-ghost text-[10px] py-1 px-2 text-red-400 border border-red-500/40"
                        >
                          Elimina
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* QUEST SPECIALI TAB */}
          {activeTab === 'quest-speciali' && (
            <motion.div
              key="quest-speciali"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-3"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Trophy size={14} className="text-party-300" />
                <h2 className="font-display font-bold text-sm">Quest Speciali Validate</h2>
              </div>

              {(() => {
                // Filtra le prove validate delle quest speciali
                const specialQuestsIds = quests.filter(q => q.is_special).map(q => q.id);
                const validatedSpecialProofs = proveInVerifica.filter(
                  p => p.stato === 'validata' && specialQuestsIds.includes(p.quest_id)
                );

                if (validatedSpecialProofs.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Nessuna quest speciale validata</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {validatedSpecialProofs.map((prova) => {
                      const quest = quests.find(q => q.id === prova.quest_id);
                      const user = leaderboardSingoli.find(u => u.id === prova.user_id);
                      const percentuale = prova.voti_totali > 0 
                        ? Math.round((prova.voti_positivi / prova.voti_totali) * 100) 
                        : 0;

                      return (
                        <motion.div
                          key={prova.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass rounded-xl p-3 border border-party-300/20"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{quest?.emoji || '⭐'}</span>
                                <h3 className="font-semibold text-sm truncate">{quest?.titolo || 'Quest Speciale'}</h3>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar user={user || { id: prova.user_id, nickname: 'Utente', punti_personali: 0, is_admin: false, created_at: '', squadra_id: null }} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs">{user?.nickname || 'Utente sconosciuto'}</p>
                                  <p className="text-[10px] text-gray-400">{prova.voti_positivi}/{prova.voti_totali} voti positivi ({percentuale}%)</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-party-300 font-bold">{quest?.punti || 0} punti</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-400">Validata</span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Assegnare ${quest?.punti || 0} punti a ${user?.nickname || 'questo utente'}?`)) return;
                                try {
                                  await assegnaPuntiQuestSpeciale(prova.id);
                                  alert('Punti assegnati con successo!');
                                } catch (error: any) {
                                  alert(`Errore: ${error.message}`);
                                }
                              }}
                              className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
                            >
                              Assegna Punti
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'utenti' && (
            <motion.div
              key="utenti"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-3 pb-24"
            >
              <div className="glass rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-sm">Esporta Utenti Registrati</h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-4">
                    Esporta la lista completa degli utenti registrati in formato JSON o CSV.
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="text-xs text-gray-500">
                      <strong className="text-gray-300">Totale utenti:</strong> {leaderboardSingoli.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong className="text-gray-300">Admin:</strong> {leaderboardSingoli.filter(u => u.is_admin).length}
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong className="text-gray-300">Con squadra:</strong> {leaderboardSingoli.filter(u => u.squadra_id).length}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Esporta JSON
                      const dataStr = JSON.stringify(leaderboardSingoli, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `utenti-dc30-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-blue-500/30 transition-colors"
                  >
                    <Download size={16} />
                    Esporta JSON
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Esporta CSV
                      const headers = ['ID', 'Nickname', 'Nome', 'Cognome', 'Email', 'Telefono', 'Data Nascita', 'Squadra ID', 'Punti Personali', 'Is Admin', 'Created At'];
                      const rows = leaderboardSingoli.map(u => [
                        u.id,
                        u.nickname || '',
                        u.nome || '',
                        u.cognome || '',
                        u.email || '',
                        u.telefono || '',
                        u.data_nascita || '',
                        u.squadra_id || '',
                        u.punti_personali.toString(),
                        u.is_admin ? 'true' : 'false',
                        u.created_at
                      ]);
                      
                      const csvContent = [
                        headers.join(','),
                        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                      ].join('\n');
                      
                      const dataBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(dataBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `utenti-dc30-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                  >
                    <Download size={16} />
                    Esporta CSV
                  </motion.button>
                </div>

                {/* Preview dati */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <details className="cursor-pointer">
                    <summary className="text-xs text-gray-400 hover:text-gray-300">
                      Anteprima dati (primi 5 utenti)
                    </summary>
                    <div className="mt-2 p-3 rounded-xl bg-gray-900/50 border border-white/5 overflow-x-auto">
                      <pre className="text-[10px] text-gray-400 font-mono">
                        {JSON.stringify(leaderboardSingoli.slice(0, 5), null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'manutenzione' && (
            <motion.div
              key="manutenzione"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 pt-3 pb-24"
            >
              <div className="flex items-center gap-1.5">
                <RefreshCw size={14} className="text-party-300" />
                <h2 className="font-display font-bold text-sm">Manutenzione (Danger Zone)</h2>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed">
                Azioni irreversibili. Serve il PIN Manutenzione (ti verrà chiesto al primo utilizzo) oppure una sessione Supabase.
              </p>

              {/* Quick actions (mettiamo in alto le cose che prima finivano troppo in basso) */}
              <div className="border-t border-white/5 pt-3 space-y-3">
                {/* Gare */}
                <div>
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

                {/* Prove */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">Prove Quest</h3>
                    <span className="text-[10px] text-gray-400">{proveInVerifica.length} in verifica</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn-secondary flex-1 py-2 text-xs"
                      onClick={async () => {
                        const ok = window.confirm(
                          'Pulire SOLO le prove in verifica? (resetta completed_at per permettere reinvio)'
                        );
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
              </div>

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

                {/* NB: niente scroll interno qui, così si può scrollare l'intera pagina */}
                <div className="space-y-1.5">
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

      {/* Crea Squadra Modal */}
      <AnimatePresence>
        {showCreaSquadra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end"
            onClick={() => {
              if (!isSubmittingSquadra) {
                setShowCreaSquadra(false);
                setSquadraNome('');
                setSquadraEmoji('');
                setSquadraColore('#FF6B6B');
                setSquadraError(null);
                setSelectedUsersForSquadra(new Set());
                setSearchUsersForSquadra('');
              }
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full glass-strong rounded-t-3xl overflow-hidden flex flex-col mb-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-turquoise-400" />
                  <div>
                    <div className="text-base font-bold">Crea Nuova Squadra</div>
                    <div className="text-[10px] text-gray-400">Aggiungi una nuova squadra al gioco</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isSubmittingSquadra) {
                      setShowCreaSquadra(false);
                      setSquadraNome('');
                      setSquadraEmoji('');
                      setSquadraColore('#FF6B6B');
                      setSquadraError(null);
                    }
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Chiudi"
                  disabled={isSubmittingSquadra}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 py-4 space-y-3">
                {/* Nome */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Nome Squadra</label>
                  <input
                    type="text"
                    value={squadraNome}
                    onChange={(e) => setSquadraNome(e.target.value)}
                    placeholder="Es: Squadra Alpha"
                    className="input text-sm py-2 w-full"
                    disabled={isSubmittingSquadra}
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Emoji</label>
                  <input
                    type="text"
                    value={squadraEmoji}
                    onChange={(e) => setSquadraEmoji(e.target.value)}
                    placeholder="🏆"
                    className="input text-2xl text-center py-2 w-full"
                    maxLength={2}
                    disabled={isSubmittingSquadra}
                  />
                </div>

                {/* Colore */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Colore</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={squadraColore}
                      onChange={(e) => setSquadraColore(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                      disabled={isSubmittingSquadra}
                    />
                    <div
                      className="flex-1 h-12 rounded"
                      style={{ backgroundColor: squadraColore }}
                    />
                  </div>
                </div>

                {/* Selezione Utenti */}
                <div>
                  <label className="block text-xs text-gray-300 mb-1.5 font-semibold">
                    Utenti da assegnare (opzionale)
                  </label>
                  <input
                    type="text"
                    value={searchUsersForSquadra}
                    onChange={(e) => setSearchUsersForSquadra(e.target.value)}
                    placeholder="Cerca utenti..."
                    className="input text-sm py-2 w-full mb-2"
                    disabled={isSubmittingSquadra}
                  />
                  <div className="max-h-48 overflow-y-auto scrollbar-hide border border-white/10 rounded-lg p-2 space-y-1">
                    {leaderboardSingoli
                      .filter(u => {
                        const searchLower = searchUsersForSquadra.toLowerCase();
                        const nicknameMatch = u.nickname?.toLowerCase().includes(searchLower) || false;
                        const nomeMatch = u.nome?.toLowerCase().includes(searchLower) || false;
                        const cognomeMatch = u.cognome?.toLowerCase().includes(searchLower) || false;
                        return nicknameMatch || nomeMatch || cognomeMatch;
                      })
                      .map((u) => {
                        const isSelected = selectedUsersForSquadra.has(u.id);
                        const hasSquadra = u.squadra_id !== null;
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-turquoise-500/20 border border-turquoise-500/40'
                                : 'hover:bg-white/5 border border-transparent'
                            } ${hasSquadra && !isSelected ? 'opacity-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSet = new Set(selectedUsersForSquadra);
                                if (e.target.checked) {
                                  newSet.add(u.id);
                                } else {
                                  newSet.delete(u.id);
                                }
                                setSelectedUsersForSquadra(newSet);
                              }}
                              disabled={isSubmittingSquadra}
                              className="rounded"
                            />
                            <Avatar user={u} size="sm" />
                            <span className="text-xs flex-1">
                              <span className="font-semibold">{u.nickname}</span>
                              {(u.nome || u.cognome) && (
                                <span className="text-gray-400 ml-1">
                                  ({[u.nome, u.cognome].filter(Boolean).join(' ')})
                                </span>
                              )}
                              {u.is_admin && (
                                <span className="ml-1 text-[10px] text-party-300">(Admin)</span>
                              )}
                            </span>
                            {hasSquadra && !isSelected && (
                              <span className="text-[10px] text-gray-400">
                                {squadre.find(s => s.id === u.squadra_id)?.nome || 'Squadra'}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    {leaderboardSingoli.filter(u => {
                      const searchLower = searchUsersForSquadra.toLowerCase();
                      const nicknameMatch = u.nickname?.toLowerCase().includes(searchLower) || false;
                      const nomeMatch = u.nome?.toLowerCase().includes(searchLower) || false;
                      const cognomeMatch = u.cognome?.toLowerCase().includes(searchLower) || false;
                      return nicknameMatch || nomeMatch || cognomeMatch;
                    }).length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">Nessun utente trovato</p>
                    )}
                  </div>
                  {selectedUsersForSquadra.size > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {selectedUsersForSquadra.size} utente{selectedUsersForSquadra.size > 1 ? 'i' : ''} selezionato{selectedUsersForSquadra.size > 1 ? 'i' : ''}
                    </p>
                  )}
                </div>

                {squadraError && (
                  <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-2">
                    <p className="text-xs text-red-400">{squadraError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (!isSubmittingSquadra) {
                        setShowCreaSquadra(false);
                        setSquadraNome('');
                        setSquadraEmoji('');
                        setSquadraColore('#FF6B6B');
                        setSquadraError(null);
                        setSelectedUsersForSquadra(new Set());
                        setSearchUsersForSquadra('');
                      }
                    }}
                    className="btn-ghost flex-1 py-2 text-xs"
                    disabled={isSubmittingSquadra}
                  >
                    Annulla
                  </button>
                  <button
                    onClick={async () => {
                      if (!squadraNome.trim() || !squadraEmoji.trim()) {
                        setSquadraError('Nome ed emoji sono obbligatori');
                        return;
                      }
                      setIsSubmittingSquadra(true);
                      setSquadraError(null);
                      try {
                        await creaSquadra({
                          nome: squadraNome.trim(),
                          emoji: squadraEmoji.trim(),
                          colore: squadraColore,
                          userIds: Array.from(selectedUsersForSquadra),
                        });
                        setSuccessMessage(`Squadra "${squadraNome.trim()}" creata con successo!`);
                        setTimeout(() => setSuccessMessage(null), 3000);
                        setShowCreaSquadra(false);
                        setSquadraNome('');
                        setSquadraEmoji('');
                        setSquadraColore('#FF6B6B');
                        setSelectedUsersForSquadra(new Set());
                        setSearchUsersForSquadra('');
                        setSquadraError(null);
                      } catch (error: any) {
                        setSquadraError(error.message || 'Errore durante la creazione');
                      } finally {
                        setIsSubmittingSquadra(false);
                      }
                    }}
                    disabled={isSubmittingSquadra || !squadraNome.trim() || !squadraEmoji.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center py-2 text-xs"
                  >
                    {isSubmittingSquadra ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1.5"
                        />
                        Creazione...
                      </>
                    ) : (
                      <>
                        <Plus size={14} className="inline mr-1" />
                        Crea Squadra
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modifica Squadra Modal */}
      <AnimatePresence>
        {showModificaSquadra && squadraDaModificare && (() => {
          const squadra = squadre.find(s => s.id === squadraDaModificare);
          if (!squadra) return null;
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-end"
              onClick={() => {
                if (!isSubmittingSquadra) {
                  setShowModificaSquadra(false);
                  setSquadraDaModificare(null);
                  setSquadraNome('');
                  setSquadraEmoji('');
                  setSquadraColore('#FF6B6B');
                  setEditingSquadraMembers(new Set());
                  setSearchEditingMembers('');
                  setShowOnlyMembers(false);
                  setSquadraError(null);
                }
              }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full glass-strong rounded-t-3xl overflow-hidden flex flex-col mb-20 max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-turquoise-400" />
                    <div>
                      <div className="text-base font-bold">Modifica Squadra</div>
                      <div className="text-[10px] text-gray-400">{squadra.nome}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isSubmittingSquadra) {
                        setShowModificaSquadra(false);
                        setSquadraDaModificare(null);
                        setSquadraNome('');
                        setSquadraEmoji('');
                        setSquadraColore('#FF6B6B');
                        setEditingSquadraMembers(new Set());
                        setSearchEditingMembers('');
                        setShowOnlyMembers(false);
                        setSquadraError(null);
                      }
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Chiudi"
                    disabled={isSubmittingSquadra}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
                  {/* Nome */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Nome Squadra</label>
                    <input
                      type="text"
                      value={squadraNome}
                      onChange={(e) => setSquadraNome(e.target.value)}
                      placeholder="Es: Squadra Alpha"
                      className="input text-sm py-2 w-full"
                      disabled={isSubmittingSquadra}
                    />
                  </div>

                  {/* Emoji */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Emoji</label>
                    <input
                      type="text"
                      value={squadraEmoji}
                      onChange={(e) => setSquadraEmoji(e.target.value)}
                      placeholder="🏆"
                      className="input text-2xl text-center py-2 w-full"
                      maxLength={2}
                      disabled={isSubmittingSquadra}
                    />
                  </div>

                  {/* Colore */}
                  <div>
                    <label className="block text-xs text-gray-300 mb-1.5 font-semibold">Colore</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={squadraColore}
                        onChange={(e) => setSquadraColore(e.target.value)}
                        className="w-12 h-12 rounded cursor-pointer"
                        disabled={isSubmittingSquadra}
                      />
                      <div
                        className="flex-1 h-12 rounded"
                        style={{ backgroundColor: squadraColore }}
                      />
                    </div>
                  </div>

                  {/* Gestione Membri */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs text-gray-300 font-semibold">
                        Membri della squadra
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowOnlyMembers(!showOnlyMembers)}
                        className={`text-[10px] px-2 py-1 rounded transition-colors ${
                          showOnlyMembers
                            ? 'bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/40'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                        disabled={isSubmittingSquadra}
                      >
                        Solo membri
                      </button>
                    </div>
                    <input
                      type="text"
                      value={searchEditingMembers}
                      onChange={(e) => setSearchEditingMembers(e.target.value)}
                      placeholder="Cerca utenti..."
                      className="input text-sm py-2 w-full mb-2"
                      disabled={isSubmittingSquadra}
                    />
                    <div className="max-h-48 overflow-y-auto scrollbar-hide border border-white/10 rounded-lg p-2 space-y-1">
                      {leaderboardSingoli
                        .filter(u => {
                          // Filtro "Solo membri"
                          if (showOnlyMembers) {
                            const isCurrentMember = squadra.membri.some(m => m.id === u.id);
                            if (!isCurrentMember) return false;
                          }
                          
                          // Filtro ricerca
                          const searchLower = searchEditingMembers.toLowerCase();
                          const nicknameMatch = u.nickname?.toLowerCase().includes(searchLower) || false;
                          const nomeMatch = u.nome?.toLowerCase().includes(searchLower) || false;
                          const cognomeMatch = u.cognome?.toLowerCase().includes(searchLower) || false;
                          return nicknameMatch || nomeMatch || cognomeMatch;
                        })
                        .map((u) => {
                          const isSelected = editingSquadraMembers.has(u.id);
                          const isCurrentMember = squadra.membri.some(m => m.id === u.id);
                          const hasOtherSquadra = u.squadra_id !== null && u.squadra_id !== squadra.id;
                          const hasNoSquadra = u.squadra_id === null;
                          const otherSquadra = hasOtherSquadra ? squadre.find(s => s.id === u.squadra_id) : null;
                          
                          return (
                            <label
                              key={u.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-turquoise-500/20 border border-turquoise-500/40'
                                  : isCurrentMember
                                    ? 'bg-white/5 border border-transparent'
                                    : 'hover:bg-white/5 border border-transparent'
                              } ${hasOtherSquadra && !isSelected ? 'opacity-75' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSet = new Set(editingSquadraMembers);
                                  if (e.target.checked) {
                                    // Aggiungi alla squadra
                                    newSet.add(u.id);
                                  } else {
                                    // Rimuovi dalla squadra
                                    newSet.delete(u.id);
                                  }
                                  setEditingSquadraMembers(newSet);
                                }}
                                disabled={isSubmittingSquadra}
                                className="rounded"
                              />
                              <Avatar user={u} size="sm" />
                              <span className="text-xs flex-1">
                                <span className="font-semibold">{u.nickname}</span>
                                {(u.nome || u.cognome) && (
                                  <span className="text-gray-400 ml-1">
                                    ({[u.nome, u.cognome].filter(Boolean).join(' ')})
                                  </span>
                                )}
                                {u.is_admin && (
                                  <span className="ml-1 text-[10px] text-party-300">(Admin)</span>
                                )}
                              </span>
                              {isCurrentMember && !isSelected && (
                                <span className="text-[10px] text-orange-400">Sarà rimosso</span>
                              )}
                              {!isCurrentMember && isSelected && (
                                <span className="text-[10px] text-turquoise-400">Sarà aggiunto</span>
                              )}
                              {isCurrentMember && isSelected && (
                                <span className="text-[10px] text-gray-400">Membro attuale</span>
                              )}
                              {hasNoSquadra && !isSelected && (
                                <span className="text-[10px] text-gray-500">Senza squadra</span>
                              )}
                              {hasOtherSquadra && !isSelected && otherSquadra && (
                                <span className="text-[10px] text-gray-500">
                                  {otherSquadra.emoji} {otherSquadra.nome}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      {leaderboardSingoli.filter(u => {
                        // Filtro "Solo membri"
                        if (showOnlyMembers) {
                          const isCurrentMember = squadra.membri.some(m => m.id === u.id);
                          if (!isCurrentMember) return false;
                        }
                        
                        // Filtro ricerca
                        const searchLower = searchEditingMembers.toLowerCase();
                        const nicknameMatch = u.nickname?.toLowerCase().includes(searchLower) || false;
                        const nomeMatch = u.nome?.toLowerCase().includes(searchLower) || false;
                        const cognomeMatch = u.cognome?.toLowerCase().includes(searchLower) || false;
                        return nicknameMatch || nomeMatch || cognomeMatch;
                      }).length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-4">Nessun utente trovato</p>
                      )}
                    </div>
                  </div>

                  {squadraError && (
                    <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-2">
                      <p className="text-xs text-red-400">{squadraError}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        if (!isSubmittingSquadra) {
                          setShowModificaSquadra(false);
                          setSquadraDaModificare(null);
                          setSquadraNome('');
                          setSquadraEmoji('');
                          setSquadraColore('#FF6B6B');
                          setEditingSquadraMembers(new Set());
                          setSearchEditingMembers('');
                          setSquadraError(null);
                        }
                      }}
                      className="btn-ghost flex-1 py-2 text-xs"
                      disabled={isSubmittingSquadra}
                    >
                      Annulla
                    </button>
                    <button
                      onClick={async () => {
                        if (!squadraNome.trim() || !squadraEmoji.trim()) {
                          setSquadraError('Nome ed emoji sono obbligatori');
                          return;
                        }
                        setIsSubmittingSquadra(true);
                        setSquadraError(null);
                        try {
                          // Salva modifiche nome/emoji/colore
                          await modificaSquadra(squadra.id, {
                            nome: squadraNome.trim(),
                            emoji: squadraEmoji.trim(),
                            colore: squadraColore,
                          });

                          // Applica modifiche ai membri
                          // editingSquadraMembers contiene tutti gli utenti che DOVREBBERO essere nella squadra
                          const membriAttuali = new Set(squadra.membri.map(m => m.id));
                          
                          // Trova utenti da aggiungere (in editingSquadraMembers ma non in membriAttuali)
                          const utentiDaAggiungere = Array.from(editingSquadraMembers).filter(id => !membriAttuali.has(id));
                          
                          // Trova utenti da rimuovere (in membriAttuali ma non in editingSquadraMembers)
                          const utentiDaRimuovere = Array.from(membriAttuali).filter(id => !editingSquadraMembers.has(id));

                          // Aggiungi nuovi membri
                          for (const userId of utentiDaAggiungere) {
                            await cambiaSquadraUtente(userId, squadra.id);
                          }
                          
                          // Rimuovi membri
                          for (const userId of utentiDaRimuovere) {
                            await cambiaSquadraUtente(userId, null);
                          }

                          setSuccessMessage(`Squadra "${squadraNome.trim()}" modificata con successo!`);
                          setTimeout(() => setSuccessMessage(null), 3000);
                          setShowModificaSquadra(false);
                          setSquadraDaModificare(null);
                          setSquadraNome('');
                          setSquadraEmoji('');
                          setSquadraColore('#FF6B6B');
                          setEditingSquadraMembers(new Set());
                          setSearchEditingMembers('');
                          setShowOnlyMembers(false);
                          setSquadraError(null);
                        } catch (error: any) {
                          setSquadraError(error.message || 'Errore durante la modifica');
                        } finally {
                          setIsSubmittingSquadra(false);
                        }
                      }}
                      className="btn-primary flex-1 py-2 text-xs"
                      disabled={isSubmittingSquadra}
                    >
                      {isSubmittingSquadra ? 'Salvataggio...' : 'Salva modifiche'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
