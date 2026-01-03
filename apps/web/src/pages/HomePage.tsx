import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, CheckCircle2, Map, X, Camera, Loader2, Users, Trophy, ChevronDown, ChevronUp, Play, Calendar } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { QuestCard } from '../components/QuestCard';
import { VerificaCard } from '../components/VerificaCard';
import { GaraCard } from '../components/GaraCard';
import { CircusNeonDecorations } from '../components/CircusNeonDecorations';
import { Avatar } from '../components/Avatar';
import { PushNotificationSettings } from '../components/PushNotificationSettings';
import { NotificationsModal } from '../components/NotificationsModal';
import { Countdown } from '../components/Countdown';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    mySquadra, 
    quests, 
    gare, 
    proveInVerifica,
    gameState,
    notifiche,
    submitProva,
    votaProva,
    logout,
    updateAvatar,
    leaderboardSquadre
  } = useGame();
  
  const [showVerifica, setShowVerifica] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifiche, setShowNotifiche] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showSpecialQuests, setShowSpecialQuests] = useState(false);
  const [showDailyQuests, setShowDailyQuests] = useState(true); // Di default aperta
  const [showVideo, setShowVideo] = useState(false);
  const BALLETTO_URL = '/videos/balletto.mp4';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  const pendingVerifications = proveInVerifica.filter(
    p => p.stato === 'in_verifica' && p.user_id !== user?.id
  );
  
  const pendingVerificationsCount = pendingVerifications.length;
  const unreadNotifiche = notifiche.filter(n => !n.letta).length;

  const nextGara = gare.find(g => g.stato !== 'completata');

  // Controlla se l'evento è iniziato
  const eventDate = gameState.data_inizio 
    ? new Date(gameState.data_inizio).toISOString()
    : new Date('2026-01-08T00:00:00+01:00').toISOString();
  const now = Date.now();
  const start = new Date(eventDate).getTime();
  const hasStarted = now >= start || gameState.evento_iniziato || user?.is_admin;

  return (
    <div className="min-h-full bg-dark flex flex-col">
      {/* Header - Snello e compatto */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 pt-safe pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(true)}
              className="rounded-full overflow-hidden"
            >
              <Avatar user={user} size="sm" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(true)}
              className="text-left"
            >
              <h1 className="font-display font-bold text-sm text-gradient leading-tight">{user?.nickname || 'Giocatore'}</h1>
              <p className="text-[10px] text-gray-400 leading-tight">DC-30</p>
            </motion.button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notifiche */}
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifiche(true)}
              className="relative p-1.5"
            >
              <Bell size={18} className="text-gray-400" />
              {unreadNotifiche > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {unreadNotifiche > 9 ? '9+' : unreadNotifiche}
                </span>
              )}
            </motion.button>

            {/* Mappa */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/mappa')}
              className="relative p-1.5"
              aria-label="Apri mappa Fuerteventura"
              title="Mappa"
            >
              <Map size={18} className="text-gray-400" />
            </motion.button>
            
            {/* Verifiche */}
            {pendingVerificationsCount > 0 && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVerifica(true)}
                className="relative p-1.5"
              >
                <CheckCircle2 size={18} className="text-gray-400" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-turquoise-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {pendingVerificationsCount}
                </span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Team Status - Bannerino Migliorato */}
        {mySquadra && (() => {
          const myPosition = leaderboardSquadre.findIndex(s => s.id === mySquadra.id) + 1;
          const positionEmoji = myPosition === 1 ? '🥇' : myPosition === 2 ? '🥈' : myPosition === 3 ? '🥉' : '🏆';
          return (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate('/squadra')}
              className="w-full glass rounded-2xl p-3 mb-2 text-left hover:bg-white/10 transition-all border border-white/10 relative overflow-hidden group"
              style={{ 
                borderLeftColor: mySquadra.colore,
                borderLeftWidth: '4px'
              }}
            >
              {/* Background gradient basato sul colore squadra */}
              <div 
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: mySquadra.colore }}
              />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: `${mySquadra.colore}20` }}
                  >
                    {mySquadra.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-bold text-sm leading-tight truncate">{mySquadra.nome}</h3>
                      {myPosition <= 3 && (
                        <span className="text-base flex-shrink-0">{positionEmoji}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {mySquadra.membri.length} membri
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Trophy size={10} />
                        {myPosition}° posto
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="flex items-center gap-1 text-turquoise-400 font-bold text-lg leading-tight">
                    <Flame size={14} />
                    {mySquadra.punti_squadra}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">punti</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">→</span>
                </div>
              </div>
            </motion.button>
          );
        })()}

        {/* Mappa e Video Balletto - Stessa riga */}
        <div className="flex gap-2 mb-2">
          {/* Mappa Banner - Invito a scoprire Fuerteventura */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/mappa')}
            className="flex-1 glass rounded-xl p-2.5 text-left hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <Map size={16} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                  Fuerteventura Maps
                </h3>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                  Scopri le Attrazioni
                </p>
              </div>
            </div>
          </motion.button>

          {/* Video Balletto Banner */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => setShowVideo(true)}
            className="flex-1 glass rounded-xl p-2.5 text-left hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <Play size={16} className="text-coral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                  Guarda il CiaccioBallo
                </h3>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                  Video esclusivo 🎬
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Agenda 3 Giorni */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/agenda')}
          className="w-full glass rounded-xl p-2.5 mb-2 text-left hover:bg-white/10 transition-colors border border-white/5"
        >
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
              <Calendar size={16} className="text-turquoise-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                Agenda per i 3/4 giorni
              </h3>
              <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                Programma delle diverse attività programmate.
              </p>
            </div>
          </div>
        </motion.button>

        {/* Info per utenti senza squadra */}
        {!mySquadra && hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 mb-2 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Trophy size={18} className="text-party-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-200 text-xs mb-2">
                  Sistema di Sfide
                </h3>
                <div className="space-y-1.5 text-[10px] text-gray-400 leading-relaxed">
                  <p>
                    <span className="font-semibold text-party-300">Sfide giornaliere:</span> casuali e uniche per ogni giocatore
                  </p>
                  <p>
                    <span className="font-semibold text-coral-500">Sfide speciali:</span> uguali per tutti, punti assegnati l'ultimo giorno
                  </p>
                  <p>
                    <span className="font-semibold text-turquoise-400">Sfide di squadra:</span> disponibili quando sarai assegnato a una squadra
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content - Scrollable, snello */}
      <div className="flex-1 px-4 py-3 pb-28 space-y-3">
        {!hasStarted ? (
          <>
            {/* Countdown Section - Mostra solo se l'evento non è iniziato */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="mb-6">
                <Flame size={48} className="text-coral-500 mx-auto mb-4" />
                <h2 className="font-display font-bold text-xl mb-2">DC-30</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Tre giorni di sfide epiche, quest impossibili e gare all'ultimo respiro ti attendono! 
                  Completa le missioni, vinci le gare e scala la classifica per diventare il campione assoluto. 
                  L'avventura sta per iniziare... 🔥
                </p>
              </div>
              <Countdown targetDate={eventDate} />
            </motion.section>

            {/* Sfide Speciali - Collassata durante il countdown */}
            {(() => {
              const specialQuests = quests.filter(q => q.is_special);
              
              return specialQuests.length > 0 ? (
                <section className="mt-6">
                  <motion.button
                    onClick={() => setShowSpecialQuests(!showSpecialQuests)}
                    className="w-full text-left glass rounded-2xl p-3 mb-2 hover:bg-white/10 transition-all"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xl">⭐</span>
                        <div>
                          <h3 className="font-display font-bold text-sm text-gradient">Sfide Speciali</h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Attive dal <span className="text-coral-500 font-semibold">08/01/2026 ore 15:20</span>
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: showSpecialQuests ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        {showSpecialQuests ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </motion.div>
                    </div>
                  </motion.button>

                  {/* Sezione Sfide Speciali - Espandibile */}
                  <AnimatePresence>
                    {showSpecialQuests && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-2 mt-2">
                          <div className="flex items-center gap-1.5">
                            <CircusNeonDecorations variant="star" size="small" color="red" />
                            <h2 className="font-display font-bold text-sm">Sfide Speciali ⭐</h2>
                            <span className="text-[10px] text-gray-400">({specialQuests.length} disponibili)</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {specialQuests.map((quest, index) => (
                            <motion.div
                              key={quest.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <QuestCard 
                                quest={quest} 
                                onSubmit={submitProva}
                                completed={quest.completed}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              ) : null;
            })()}
          </>
        ) : (
          <>
            {/* Next Gara Section */}
            {nextGara && (
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <CircusNeonDecorations variant="clown-face" size="small" color="orange" />
                  <h2 className="font-display font-bold text-sm">Prossima Gara</h2>
                </div>
                <GaraCard gara={nextGara} />
              </section>
            )}

            {/* Quest Section */}
            {(() => {
              const normalQuests = quests.filter(q => !q.is_special);
              const specialQuests = quests.filter(q => q.is_special);
              
              return (
                <>
                  {/* Quest del Giorno - Collassabile */}
                  {normalQuests.length > 0 && (
                    <section>
                      <motion.button
                        onClick={() => setShowDailyQuests(!showDailyQuests)}
                        className="w-full text-left glass rounded-2xl p-3 mb-2 hover:bg-white/10 transition-all"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-1">
                            <CircusNeonDecorations variant="star" size="small" color="red" />
                            <h2 className="font-display font-bold text-sm">Quest del Giorno</h2>
                            <span className="text-[10px] text-gray-400">({normalQuests.length} disponibili)</span>
                          </div>
                          <motion.div
                            animate={{ rotate: showDailyQuests ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            {showDailyQuests ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </motion.div>
                        </div>
                      </motion.button>

                      {/* Sezione Quest del Giorno - Espandibile */}
                      <AnimatePresence>
                        {showDailyQuests && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2">
                              {normalQuests.map((quest, index) => (
                                <motion.div
                                  key={quest.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <QuestCard 
                                    quest={quest} 
                                    onSubmit={submitProva}
                                    completed={quest.completed}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}

                  {/* Quest Speciali - Testo cliccabile per espandere */}
                  {specialQuests.length > 0 && (
                    <section>
                      <motion.button
                        onClick={() => setShowSpecialQuests(!showSpecialQuests)}
                        className="w-full text-left glass rounded-2xl p-3 mb-2 hover:bg-white/10 transition-all"
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xl">⭐</span>
                            <div>
                              <h3 className="font-display font-bold text-sm text-gradient">Sfide Speciali</h3>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Attive dal <span className="text-coral-500 font-semibold">08/01/2026 ore 15:20</span>
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: showSpecialQuests ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            {showSpecialQuests ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </motion.div>
                        </div>
                      </motion.button>

                      {/* Sezione Sfide Speciali - Espandibile */}
                      <AnimatePresence>
                        {showSpecialQuests && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-2 mt-2">
                              <div className="flex items-center gap-1.5">
                                <CircusNeonDecorations variant="star" size="small" color="red" />
                                <h2 className="font-display font-bold text-sm">Sfide Speciali ⭐</h2>
                                <span className="text-[10px] text-gray-400">({specialQuests.length} disponibili)</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {specialQuests.map((quest, index) => (
                                <motion.div
                                  key={quest.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <QuestCard 
                                    quest={quest} 
                                    onSubmit={submitProva}
                                    completed={quest.completed}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}
                </>
              );
            })()}
          </>
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
                <div className="mx-auto mb-3 relative inline-block">
                  <Avatar user={user} size="lg" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-1.5 bg-coral-500 rounded-full text-white hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cambia foto profilo"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validazione file
                      if (file.size > 5 * 1024 * 1024) {
                        setAvatarError('Il file è troppo grande. Massimo 5MB');
                        return;
                      }

                      if (!file.type.startsWith('image/')) {
                        setAvatarError('Il file deve essere un\'immagine');
                        return;
                      }

                      setIsUploadingAvatar(true);
                      setAvatarError(null);

                      try {
                        await updateAvatar(file);
                        // Reset input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      } catch (error: any) {
                        setAvatarError(error.message || 'Errore durante il caricamento della foto');
                      } finally {
                        setIsUploadingAvatar(false);
                      }
                    }}
                  />
                </div>
                <h2 className="font-bold text-lg">{user?.nickname || 'Giocatore'}</h2>
                <p className="text-gray-500 text-sm">Membro di {mySquadra?.nome}</p>
                {avatarError && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-2"
                  >
                    {avatarError}
                  </motion.p>
                )}
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

      {/* Notifiche Modal */}
      <NotificationsModal
        isOpen={showNotifiche}
        onClose={() => setShowNotifiche(false)}
      />

      {/* Video Modal - Fullscreen */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
            onClick={() => {
              setShowVideo(false);
              if (videoRef.current) {
                videoRef.current.pause();
              }
            }}
          >
            {/* Header minimale - solo pulsante close */}
            <div className="absolute top-0 left-0 right-0 z-10 flex justify-end p-4">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(false);
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                }}
                className="p-3 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full transition-colors border border-white/20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} className="text-white" />
              </motion.button>
            </div>
            
            {/* Video a schermo intero */}
            <div 
              className="flex-1 flex items-center justify-center w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.video
                ref={videoRef}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                src={BALLETTO_URL}
                controls
                autoPlay
                className="w-full h-full object-contain"
                playsInline
                onEnded={() => {
                  setShowVideo(false);
                }}
              >
                Il tuo browser non supporta la riproduzione video.
              </motion.video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
