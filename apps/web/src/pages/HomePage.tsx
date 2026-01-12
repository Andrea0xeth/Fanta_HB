import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, CheckCircle2, Map, X, Camera, Loader2, Users, Trophy, Play, Calendar, Image as ImageIcon } from 'lucide-react';
import { useGame } from '../context/GameContext';
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
    gare, 
    proveInVerifica,
    gameState,
    notifiche,
    logout,
    updateAvatar,
    leaderboardSquadre
  } = useGame();
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifiche, setShowNotifiche] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const BALLETTO_URL = '/videos/balletto.mp4';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);


  // Conta solo le prove a cui l'utente NON ha ancora votato
  const pendingVerifications = proveInVerifica.filter(
    p => p.stato === 'in_verifica' 
      && p.user_id !== user?.id 
      && (p.mio_voto === null || p.mio_voto === undefined)
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
                  {(() => {
                    const sommaPuntiPersonali = mySquadra.membri.reduce((sum, m) => sum + m.punti_personali, 0);
                    const puntiTotali = Math.round(sommaPuntiPersonali * 0.5 + mySquadra.punti_squadra * 1);
                    return (
                      <>
                  <div className="flex items-center gap-1 text-turquoise-400 font-bold text-lg leading-tight">
                    <Flame size={14} />
                          {puntiTotali}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">punti</p>
                      </>
                    );
                  })()}
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

        {/* Agenda e Verifica - Stessa riga */}
        <div className="flex gap-2 mb-2">
          {/* Agenda 3 Giorni */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/agenda')}
            className="flex-1 glass rounded-xl p-2.5 text-left hover:bg-white/10 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-2">
            <div className="flex-shrink-0">
                <Calendar size={16} className="text-turquoise-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                  Agenda
                </h3>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                  Programma attività
                </p>
            </div>
          </div>
        </motion.button>

          {/* Verifica Quest */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => navigate('/verifica')}
            className="flex-1 glass rounded-xl p-2.5 text-left hover:bg-white/10 transition-colors border border-white/5 relative"
          >
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0">
                <CheckCircle2 size={16} className="text-turquoise-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                  Verifica Quest
                </h3>
                <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                  {pendingVerificationsCount > 0 
                    ? `${pendingVerificationsCount} da verificare`
                    : 'Nessuna nuova'}
                </p>
              </div>
            </div>
            {pendingVerificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-turquoise-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                {pendingVerificationsCount > 9 ? '9+' : pendingVerificationsCount}
              </span>
            )}
          </motion.button>
        </div>

      </div>

      {/* Content - Scrollable, snello */}
      <div className="flex-1 px-4 py-3 space-y-3">
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

            {/* Galleria Banner */}
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-3"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/galleria')}
                className="w-full glass rounded-xl p-3 text-left hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0">
                    <ImageIcon size={18} className="text-turquoise-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-200 text-xs leading-tight">
                      Galleria Fotografie e Video
                    </h3>
                    <p className="text-gray-400 text-[10px] leading-tight mt-0.5">
                      Foto e video delle sfide completate
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              </motion.button>
            </motion.section>
          </>
        )}
      </div>


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
                  {(() => {
                    if (!mySquadra) return <div className="text-xl font-bold text-turquoise-400">0</div>;
                    const sommaPuntiPersonali = mySquadra.membri.reduce((sum, m) => sum + m.punti_personali, 0);
                    const puntiTotali = Math.round(sommaPuntiPersonali * 0.5 + mySquadra.punti_squadra * 1);
                    return (
                      <>
                        <div className="text-xl font-bold text-turquoise-400">{puntiTotali}</div>
                        <div className="text-[10px] text-gray-500">Punti Totali</div>
                      </>
                    );
                  })()}
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
                Logout
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
                loop
                preload="auto"
                className="w-full h-full object-contain"
                playsInline
                onLoadedData={() => {
                  // Assicura che il video sia pronto per loop fluido
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                  }
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
