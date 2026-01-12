import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Calendar, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { VerificaCard } from '../components/VerificaCard';

type TabType = 'da_verificare' | 'verificate';

export const VerificaPage: React.FC = () => {
  const navigate = useNavigate();
  const { proveInVerifica, user, votaProva, squadre, gameState } = useGame();
  const [activeTab, setActiveTab] = useState<TabType>('da_verificare');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSquadra, setFilterSquadra] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterGiorno, setFilterGiorno] = useState<number | null>(null);

  // Calcola il giorno basato sulla data di inizio evento (timezone Europe/Rome)
  const getGiornoFromTimestamp = (createdAt: string): number => {
    // Data di inizio evento: 8 gennaio 2026 alle 00:00 Europe/Rome (UTC+1)
    const eventStartDate = gameState.data_inizio 
      ? new Date(gameState.data_inizio)
      : new Date('2026-01-08T00:00:00+01:00');
    
    const provaDate = new Date(createdAt);
    
    // Funzione helper per ottenere la data nel fuso orario Europe/Rome
    const getDateInRome = (date: Date) => {
      // Ottieni i componenti della data nel fuso orario Europe/Rome
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // month è 0-based
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      return new Date(year, month, day);
    };
    
    // Ottieni le date nel fuso orario Europe/Rome (solo giorno, senza ora)
    const startDateRome = getDateInRome(eventStartDate);
    const provaDateRome = getDateInRome(provaDate);
    
    // Calcola differenza in giorni
    const diffTime = provaDateRome.getTime() - startDateRome.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Restituisci il giorno (1-based) o 0 per prove fuori evento
    // Se la prova è stata inviata prima dell'inizio evento, considera come giorno 0 (fuori evento)
    if (diffDays < 0) return 0;
    return diffDays + 1; // +1 perché il primo giorno è 1, non 0
  };

  // Estrai utenti unici dalle prove
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, typeof proveInVerifica[0]['user']>();
    proveInVerifica.forEach(p => {
      if (p.user && p.user_id !== user?.id) {
        userMap.set(p.user_id, p.user);
      }
    });
    return Array.from(userMap.values()).sort((a, b) => 
      (a.nickname || '').localeCompare(b.nickname || '')
    );
  }, [proveInVerifica, user?.id]);

  // Estrai giorni disponibili dalle prove filtrate (prima dei filtri) basati su timestamp
  const availableGiorni = useMemo(() => {
    const allProve = proveInVerifica.filter(p => p.user_id !== user?.id);
    const giorniSet = new Set<number>();
    allProve.forEach(p => {
      const giorno = getGiornoFromTimestamp(p.created_at);
      giorniSet.add(giorno);
    });
    return Array.from(giorniSet).sort((a, b) => b - a); // Ordine decrescente
  }, [proveInVerifica, user?.id, gameState.data_inizio]);

  // Filtra le prove in base al tab attivo e ai filtri
  const filteredProve = useMemo(() => {
    let allProve = proveInVerifica.filter(p => p.user_id !== user?.id);
    
    // Filtro per tab
    if (activeTab === 'da_verificare') {
      // Mostra solo le prove a cui l'utente NON ha ancora votato
      allProve = allProve.filter(p => p.mio_voto === null || p.mio_voto === undefined);
    } else {
      // Mostra solo le prove a cui l'utente ha già votato
      allProve = allProve.filter(p => p.mio_voto !== null && p.mio_voto !== undefined);
    }

    // Filtro per squadra
    if (filterSquadra) {
      allProve = allProve.filter(p => p.user?.squadra_id === filterSquadra);
    }

    // Filtro per utente
    if (filterUser) {
      allProve = allProve.filter(p => p.user_id === filterUser);
    }

    // Filtro per giorno (basato su timestamp)
    if (filterGiorno !== null) {
      allProve = allProve.filter(p => getGiornoFromTimestamp(p.created_at) === filterGiorno);
    }

    return allProve;
  }, [proveInVerifica, user?.id, activeTab, filterSquadra, filterUser, filterGiorno]);

  // Conta filtri attivi
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSquadra) count++;
    if (filterUser) count++;
    if (filterGiorno !== null) count++;
    return count;
  }, [filterSquadra, filterUser, filterGiorno]);

  // Reset filtri
  const resetFilters = () => {
    setFilterSquadra(null);
    setFilterUser(null);
    setFilterGiorno(null);
  };

  // Raggruppa le prove filtrate per giorno basato su timestamp di invio
  const proveByGiorno = useMemo(() => {
    const grouped: Record<number, typeof filteredProve> = {};
    
    filteredProve.forEach(prova => {
      // Usa il giorno calcolato dal timestamp invece del giorno della quest
      const giorno = getGiornoFromTimestamp(prova.created_at);
      if (!grouped[giorno]) {
        grouped[giorno] = [];
      }
      grouped[giorno].push(prova);
    });
    
    // Ordina per giorno (decrescente, così i giorni più recenti sono in alto)
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .reduce((acc, [giorno, prove]) => {
        acc[Number(giorno)] = prove.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return acc;
      }, {} as Record<number, typeof filteredProve>);
  }, [filteredProve, gameState.data_inizio]);

  const giorniLabels: Record<number, string> = {
    0: 'Fuori evento',
    1: 'GIOVEDÌ 8',
    2: 'VENERDÌ 9',
    3: 'SABATO 10',
    4: 'DOMENICA 11',
  };

  const totalProve = Object.values(proveByGiorno).flat().length;
  const proveInVerificaCount = proveInVerifica.filter(
    p => p.user_id !== user?.id && (p.mio_voto === null || p.mio_voto === undefined)
  ).length;
  const proveVerificateCount = proveInVerifica.filter(
    p => p.user_id !== user?.id && p.mio_voto !== null && p.mio_voto !== undefined
  ).length;

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/home')}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </motion.button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-lg text-gradient flex items-center gap-2">
              <CheckCircle2 className="text-turquoise-400" size={20} />
              Verifica Quest
            </h1>
          </div>
        </div>

        {/* Tabs e Filtri */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('da_verificare')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'da_verificare'
                  ? 'bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              Da verificare
              {proveInVerificaCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-turquoise-500/20 text-turquoise-400 text-xs">
                  {proveInVerificaCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('verificate')}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'verificate'
                  ? 'bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              Verificate
              {proveVerificateCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                  {proveVerificateCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-2.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Filter size={14} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-turquoise-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Pannello Filtri Super Snello */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Filtro Squadra */}
                    <select
                      value={filterSquadra || ''}
                      onChange={(e) => setFilterSquadra(e.target.value || null)}
                      className={`px-1.5 py-1 rounded bg-white/5 border text-[10px] text-gray-200 focus:outline-none focus:border-turquoise-500/50 transition-colors ${
                        filterSquadra ? 'border-turquoise-500/30' : 'border-white/10'
                      }`}
                    >
                      <option value="">Tutte</option>
                      {squadre.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.emoji} {s.nome}
                        </option>
                      ))}
                    </select>

                    {/* Filtro Utente */}
                    <select
                      value={filterUser || ''}
                      onChange={(e) => setFilterUser(e.target.value || null)}
                      className={`px-1.5 py-1 rounded bg-white/5 border text-[10px] text-gray-200 focus:outline-none focus:border-turquoise-500/50 transition-colors ${
                        filterUser ? 'border-turquoise-500/30' : 'border-white/10'
                      }`}
                    >
                      <option value="">Tutti</option>
                      {uniqueUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nickname}
                        </option>
                      ))}
                    </select>

                    {/* Filtro Giorno */}
                    <div className="flex gap-1">
                      <select
                        value={filterGiorno !== null ? filterGiorno : ''}
                        onChange={(e) => setFilterGiorno(e.target.value ? Number(e.target.value) : null)}
                        className={`flex-1 px-1.5 py-1 rounded bg-white/5 border text-[10px] text-gray-200 focus:outline-none focus:border-turquoise-500/50 transition-colors ${
                          filterGiorno !== null ? 'border-turquoise-500/30' : 'border-white/10'
                        }`}
                      >
                        <option value="">Tutti</option>
                        {availableGiorni.map(giorno => (
                          <option key={giorno} value={giorno}>
                            {giorniLabels[giorno] || `Giorno ${giorno}`}
                          </option>
                        ))}
                      </select>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={resetFilters}
                          className="px-1.5 py-1 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-gray-300 transition-colors"
                          title="Reset"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 pb-28">
        {totalProve === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto py-12"
          >
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="text-center mb-6">
                <div className="inline-flex p-4 rounded-full bg-turquoise-500/10 mb-4">
                  <CheckCircle2 size={40} className="text-turquoise-400" />
                </div>
                <h2 className="font-bold text-gray-200 text-lg mb-2">
                  {activeTab === 'da_verificare' 
                    ? 'Nessuna prova da verificare' 
                    : 'Nessuna prova verificata'}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {activeFiltersCount > 0
                    ? 'Nessuna prova corrisponde ai filtri selezionati. Prova a modificare i filtri.'
                    : activeTab === 'da_verificare'
                      ? 'Non ci sono prove in attesa di verifica al momento.'
                      : 'Non ci sono prove verificate al momento.'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(proveByGiorno).map(([giornoStr, prove], index) => {
              const giorno = Number(giornoStr);
              
              return (
                <motion.div
                  key={giorno}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-4 border border-white/10"
                >
                  {/* Header Giorno */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="p-2 rounded-xl bg-turquoise-500/10">
                      <Calendar size={18} className="text-turquoise-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-bold text-gray-200 text-base">
                        {giorniLabels[giorno] || `Giorno ${giorno}`}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {prove.length} {prove.length === 1 ? 'prova' : 'prove'}
                      </p>
                    </div>
                  </div>

                  {/* Prove */}
                  <div className="space-y-3">
                    {prove.map((prova) => (
                      <VerificaCard
                        key={prova.id}
                        prova={prova}
                        onVote={(id, valore) => {
                          votaProva(id, valore);
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
