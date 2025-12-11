import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Countdown } from '../components/Countdown';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { WebAuthnDebug } from '../components/WebAuthnDebug';
import { CircusNeonDecorations } from '../components/CircusNeonDecorations';
import type { RegistrationData } from '../types';

type ViewState = 'splash' | 'video-pre' | 'auth' | 'auth-choice' | 'video-post' | 'loading';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithPasskey, register, isAuthenticated, isLoading } = useGame();
  const [viewState, setViewState] = useState<ViewState>('splash');
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    nickname: '',
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    data_nascita: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showPostVideo, setShowPostVideo] = useState(false); // Flag per video post
  const [showDebug, setShowDebug] = useState(false); // Flag per mostrare debug
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showPostContinueButton, setShowPostContinueButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Genera tempi casuali per il flicker di ogni elemento neon
  const [flickerTimings] = useState(() => ({
    dc30: 2.5 + Math.random() * 1.5, // Tra 2.5s e 4s
    diCiaccio: 2.3 + Math.random() * 1.4, // Tra 2.3s e 3.7s
    circociaccio: 2.4 + Math.random() * 1.6, // Tra 2.4s e 4s
    fuerteventura: 2.6 + Math.random() * 1.3, // Tra 2.6s e 3.9s
  }));

  // Target date for the event: 8 gennaio 2026 alle 00:00 CET
  // CET = Central European Time (UTC+1 in inverno, UTC+2 in estate)
  // 8 gennaio 2026 è in inverno, quindi UTC+1
  // 00:00 CET = 23:00 UTC del giorno precedente
  const eventDate = new Date('2026-01-08T00:00:00+01:00').toISOString();

  // Verifica contesto sicuro per WebAuthn
  useEffect(() => {
    if (!window.isSecureContext && viewState === 'splash') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '[::1]';
      
      if (!isLocalhost && window.location.protocol !== 'https:') {
        // Se non siamo su localhost e non siamo su HTTPS, mostra un messaggio
        // ma non blocchiamo completamente - l'utente potrebbe essere su una rete locale
        console.warn('[Security] App non in contesto sicuro. WebAuthn potrebbe non funzionare.');
      }
    }
  }, [viewState]);

  // Redirect solo se già autenticato ALL'AVVIO (non dopo login/registrazione)
  // Non fare redirect se stiamo mostrando il video post-benvenuto
  useEffect(() => {
    // Non fare redirect se:
    // 1. Stiamo mostrando il video post (flag impostato)
    // 2. Siamo già nella schermata video-post
    // 3. Stiamo caricando l'autenticazione
    // 4. Siamo nella schermata auth-choice (stiamo per fare login/registrazione)
    if (isAuthenticated && 
        viewState === 'splash' && 
        !showPostVideo && 
        !authLoading) {
      // Se già autenticato all'avvio, vai direttamente alla home
      // Ma NON fare redirect se stiamo per mostrare il video post-benvenuto
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, viewState, showPostVideo, authLoading]);

  // Gestisci il video quando cambia viewState
  useEffect(() => {
    if ((viewState === 'video-pre' || viewState === 'video-post') && videoRef.current) {
      const video = videoRef.current;
      
      // Reset video
      video.currentTime = 0;
      video.volume = 1;
      
      // Funzione per far partire il video
      const startVideo = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Video avviato con successo');
            })
            .catch(error => {
              console.error('❌ Error playing video:', error);
              // Se l'autoplay fallisce, mostra il bottone continua
              if (viewState === 'video-post') {
                setShowPostContinueButton(true);
              } else {
                setShowContinueButton(true);
              }
            });
        }
      };
      
      // Forza il caricamento del video
      video.load();
      
      // Prova a far partire immediatamente
      // Se il video è già caricato abbastanza, parte subito
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA o superiore
        startVideo();
      } else {
        // Altrimenti aspetta che sia caricato
        const handleCanPlay = () => {
          startVideo();
        };
        
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('loadeddata', handleCanPlay, { once: true });
        
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('loadeddata', handleCanPlay);
        };
      }
    }
  }, [viewState]);

  // Handle "Entra nel Game" click - show choice between login and register
  const handleEnterGame = () => {
    setViewState('auth-choice');
  };

  // Handle login choice - try to login with existing passkey
  const handleLogin = async () => {
    setAuthLoading(true);
    setShowPostVideo(true); // Imposta il flag PRIMA del login per prevenire redirect automatico
    setShowPostContinueButton(false); // Reset continue button state
    
    try {
      await loginWithPasskey();
      // DOPO il login riuscito, mostra immediatamente il video post-login
      setAuthLoading(false);
      
      // Cambia immediatamente lo stato per mostrare il video
      setViewState('video-post');
      
      // Il video partirà automaticamente grazie all'useEffect che monitora viewState
      // e grazie all'attributo autoPlay sul video element
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il login. Registrati se non hai ancora un account.';
      
      // Se è un errore di sicurezza, mostra un messaggio più dettagliato
      if (errorMessage.includes('Errore di sicurezza') || errorMessage.includes('HTTPS')) {
        alert('⚠️ Errore di sicurezza\n\nPer usare le passkey (Face ID/Touch ID), l\'app deve essere accessibile tramite:\n\n• HTTPS (https://...)\n• localhost (sviluppo)\n\nAssicurati di accedere tramite un URL sicuro.');
      } else {
        alert(errorMessage);
      }
      setShowPostVideo(false);
      setAuthLoading(false);
      setViewState('auth-choice'); // Torna alla scelta auth
    }
  };

  // Handle register choice - show pre-registration video then form
  const handleRegister = () => {
    setShowContinueButton(false); // Reset continue button state
    setViewState('video-pre');
    // Reset video when changing to video state
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }
    }, 100);
  };

  // When pre-registration video ends, show continue button
  const handlePreVideoEnd = () => {
    setShowContinueButton(true);
  };
  
  const handleContinueFromPreVideo = () => {
    setShowContinueButton(false);
    setViewState('auth');
  };

  // Handle registration with passkey (crea nuovo account)
  const handleAuth = async () => {
    // Validazione campi obbligatori
    if (!registrationData.nome || !registrationData.cognome || !registrationData.email) {
      alert('Per favore compila tutti i campi obbligatori (Nome, Cognome, Email)');
      return;
    }

    setAuthLoading(true);
    setShowPostVideo(true); // Imposta il flag PRIMA della registrazione per prevenire redirect automatico
    setShowPostContinueButton(false); // Reset continue button state
    
    try {
      // Chiama direttamente register() per creare un nuovo account con nuova passkey
      // Non provare a fare login prima - l'utente vuole registrarsi!
      await register(registrationData);
      // DOPO la registrazione riuscita, mostra immediatamente il video post-registrazione
      setAuthLoading(false);
      
      // Cambia immediatamente lo stato per mostrare il video
      setViewState('video-post');
      
      // Il video partirà automaticamente grazie all'useEffect che monitora viewState
      // e grazie all'attributo autoPlay sul video element
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante la registrazione';
      
      // Se è un errore di sicurezza, mostra un messaggio più dettagliato
      if (errorMessage.includes('Errore di sicurezza') || errorMessage.includes('HTTPS')) {
        alert('⚠️ Errore di sicurezza\n\nPer usare le passkey (Face ID/Touch ID), l\'app deve essere accessibile tramite:\n\n• HTTPS (https://...)\n• localhost (sviluppo)\n\nAssicurati di accedere tramite un URL sicuro.');
      } else {
        alert(errorMessage);
      }
      setShowPostVideo(false);
      setAuthLoading(false);
    }
  };

  // Update registration field
  const updateField = (field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
  };

  // When post-registration video ends, show continue button
  const handlePostVideoEnd = () => {
    setShowPostContinueButton(true);
  };
  
  const handleContinueFromPostVideo = () => {
    setShowPostContinueButton(false);
    navigate('/home', { replace: true });
  };

  // Skip video handler
  const handleSkipVideo = () => {
    if (viewState === 'video-pre') {
      setShowContinueButton(false);
      setViewState('auth');
    } else if (viewState === 'video-post') {
      setShowPostContinueButton(false);
      navigate('/home', { replace: true });
    }
  };

  if (isLoading && viewState === 'splash') {
    return (
      <div className="h-screen flex items-center justify-center bg-dark overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-coral-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Video Pre-Iscrizione
  if (viewState === 'video-pre') {
    return (
      <div className="h-screen bg-dark flex items-center justify-center relative overflow-hidden">
        {/* Overlay scuro */}
        <div className="absolute inset-0 bg-black/80 z-40" />
        
        {/* Modale con video verticale - più in alto e centrato */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 w-[85%] max-w-md aspect-[9/16] bg-gray-900 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
          style={{ marginTop: '-10vh' }}
        >
          <video
            ref={videoRef}
            src="/videos/BenvenutoPreIscrizione.mp4"
            autoPlay
            playsInline
            onEnded={handlePreVideoEnd}
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(console.error);
              }
            }}
            className="w-full h-full object-cover"
          />
          
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleSkipVideo}
            className="absolute top-4 right-4 px-3 py-1.5 glass rounded-full text-xs text-white/70 hover:bg-white/20 transition-colors z-10"
          >
            Salta
          </motion.button>
          
          {/* Continue button - appare alla fine del video */}
          <AnimatePresence>
            {showContinueButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-0 right-0 flex justify-center px-4 z-10"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinueFromPreVideo}
                  className="btn-primary px-6 py-3 rounded-2xl font-semibold text-white shadow-xl active:scale-95 transition-transform duration-75"
                  transition={{ duration: 0.1 }}
                >
                  CONTINUA
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Video Post-Iscrizione
  if (viewState === 'video-post') {
    return (
      <div className="h-screen bg-dark flex items-center justify-center relative overflow-hidden">
        {/* Overlay scuro */}
        <div className="absolute inset-0 bg-black/80 z-40" />
        
        {/* Modale con video verticale - più in alto e centrato */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 w-[85%] max-w-md aspect-[9/16] bg-gray-900 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
          style={{ marginTop: '-10vh' }}
        >
          <video
            ref={videoRef}
            src="/videos/BenvenutoPostiscrizione.mp4"
            autoPlay
            playsInline
            muted={false}
            onEnded={handlePostVideoEnd}
            onLoadedData={() => {
              // Assicurati che il video parta quando è caricato
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.error('Errore play onLoadedData:', err);
                });
              }
            }}
            onCanPlay={() => {
              // Forza il play quando il video è pronto
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.error('Errore play onCanPlay:', err);
                });
              }
            }}
            className="w-full h-full object-cover"
          />
          
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleSkipVideo}
            className="absolute top-4 right-4 px-3 py-1.5 glass rounded-full text-xs text-white/70 hover:bg-white/20 transition-colors z-10"
          >
            Salta
          </motion.button>
          
          {/* Continue button - appare alla fine del video */}
          <AnimatePresence>
            {showPostContinueButton && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-0 right-0 flex justify-center px-4 z-10"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinueFromPostVideo}
                  className="btn-primary px-6 py-3 rounded-2xl font-semibold text-white shadow-xl active:scale-95 transition-transform duration-75"
                  transition={{ duration: 0.1 }}
                >
                  CONTINUA
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Se siamo nel form di registrazione, mostra solo il form senza countdown e titolo
  if (viewState === 'auth') {
    const isSecureContext = window.isSecureContext || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
    
    return (
      <div className="h-screen bg-dark flex flex-col items-center justify-center p-4 pt-safe overflow-y-auto scrollbar-hide">
        <motion.div 
          className="w-full max-w-sm space-y-3 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!isSecureContext && (
            <div className="glass border border-yellow-500/50 rounded-2xl p-3 mb-3">
              <p className="text-xs text-yellow-400 text-center">
              ⚠️ Per usare Face ID/Touch ID, accedi tramite HTTPS o localhost
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center mb-2">
            Compila i dati per partecipare al gioco
          </p>
          
          <input
            type="text"
            placeholder="Nickname *"
            value={registrationData.nickname}
            onChange={(e) => updateField('nickname', e.target.value)}
            className="input text-center text-sm"
            maxLength={20}
            required
          />
          
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nome *"
              value={registrationData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              className="input text-center text-sm"
              required
            />
            <input
              type="text"
              placeholder="Cognome *"
              value={registrationData.cognome}
              onChange={(e) => updateField('cognome', e.target.value)}
              className="input text-center text-sm"
              required
            />
          </div>
          
          <input
            type="email"
            placeholder="Email *"
            value={registrationData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="input text-center text-sm"
            required
          />
          
          <input
            type="tel"
            placeholder="Telefono"
            value={registrationData.telefono}
            onChange={(e) => updateField('telefono', e.target.value)}
            className="input text-center text-sm"
          />
          
          <button
            onClick={handleAuth}
            disabled={authLoading || !registrationData.nome || !registrationData.cognome || !registrationData.email}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-95 transition-transform duration-75"
          >
            {authLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <Fingerprint size={18} />
                Registrati con Face ID / Impronta
              </>
            )}
          </button>
          
          <button
            onClick={() => setViewState('splash')}
            className="w-full text-center text-gray-500 text-xs py-1.5"
          >
            Annulla
          </button>
          
          {/* Debug button */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full text-center text-gray-400 text-[10px] py-1 underline"
          >
            {showDebug ? 'Nascondi' : 'Mostra'} Debug WebAuthn
          </button>
          
          {/* Debug panel */}
          {showDebug && (
            <div className="mt-2 p-3 glass rounded-2xl">
              <WebAuthnDebug />
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark flex flex-col items-center justify-center p-4 pt-safe overflow-hidden relative">
      {/* Background - Falling Circus Neon Decorations - 20 decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => {
          const variants: Array<'clown-face' | 'star' | 'balloon' | 'confetti'> = ['clown-face', 'star', 'balloon', 'confetti'];
          const colors: Array<'red' | 'white' | 'orange'> = ['red', 'white', 'orange'];
          const variant = variants[i % variants.length];
          const color = colors[i % colors.length];
          const startX = Math.random() * 100;
          const fallDuration = 4 + Math.random() * 3;
          const delay = Math.random() * 2;
          
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${startX}%`,
                top: '-10%',
              }}
              animate={{
                y: ['0vh', '110vh'],
                opacity: [0, 0.5, 0.5, 0],
                rotate: [0, 180, 360],
                scale: [0.7, 1, 0.7],
              }}
              transition={{
                duration: fallDuration,
                repeat: Infinity,
                delay: delay,
                ease: 'linear',
              }}
            >
              <CircusNeonDecorations
                variant={variant}
                size="small"
                color={color}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Neon Logo & Title Section */}
      <motion.div 
        className="flex flex-col items-center justify-center relative z-10 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* DC-30 - Main Neon Text */}
        <div className="neon-3d-glow mb-0">
          <h1 
            className="neon-red-orange text-6xl md:text-7xl font-bold text-center tracking-wider"
            style={{
              animation: `neon-flicker ${flickerTimings.dc30}s infinite`,
            }}
          >
            DC-30
          </h1>
        </div>

        {/* Di Ciaccio - 30 - Small subtitle - White with D and C uppercase */}
        <motion.p 
          className="neon-white text-sm md:text-base font-medium text-center mb-6 tracking-wider -mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            WebkitTextStroke: '0.6px #ffffff',
            textShadow: `
              0 0 1px #ffffff,
              0 0 2px #ffffff,
              0 0 3px #ffffff,
              0 0 4px #ffffff
            `
          }}
        >
          <span className="uppercase">D</span>i <span className="uppercase">C</span>iaccio - 30
        </motion.p>

        {/* CIRCOLOCO Fuerteventura - White Neon - Larger */}
        <motion.div 
          className="neon-3d-glow-white mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 
            className="neon-white text-4xl md:text-5xl font-bold text-center tracking-wider uppercase"
            style={{
              animation: `neon-flicker-white ${flickerTimings.circociaccio}s infinite`,
            }}
          >
            CIRCOCIACCIO
          </h2>
          <p 
            className="neon-white text-xl md:text-2xl font-semibold text-center tracking-wider uppercase mt-1"
            style={{
              animation: `neon-flicker-white ${flickerTimings.fuerteventura}s infinite`,
            }}
          >
            Fuerteventura
          </p>
        </motion.div>
      </motion.div>

      {/* Compact Countdown */}
      <motion.div 
        className="mb-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-center text-gray-500 mb-2 text-xs">Inizia tra</p>
        <Countdown targetDate={eventDate} />
      </motion.div>

      {/* Compact Auth Section */}
      <motion.div 
        className="w-full max-w-sm space-y-3 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {viewState === 'splash' ? (
            <motion.button
              key="enter"
              onClick={handleEnterGame}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3 active:scale-95 transition-transform duration-75"
              whileTap={{ scale: 0.95 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.1 }}
            >
              <Fingerprint size={20} />
              Entra nel Game
            </motion.button>
          ) : viewState === 'auth-choice' ? (
            <motion.div
              key="auth-choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 w-full"
            >
              {(!window.isSecureContext && 
                window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1') && (
                <div className="glass border border-yellow-500/50 rounded-2xl p-3 mb-3">
                  <p className="text-xs text-yellow-400 text-center">
                    ⚠️ Per usare Face ID/Touch ID, accedi tramite HTTPS o localhost
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-400 text-center mb-4">
                Hai già un account o vuoi registrarti?
              </p>
              
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform duration-75"
              >
                {authLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Accedi con Passkey
                  </>
                )}
              </button>
              
              <button
                onClick={handleRegister}
                disabled={authLoading}
                className="btn-secondary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform duration-75"
              >
                <Sparkles size={18} />
                Registrati (Nuovo Account)
              </button>
              
              <button
                onClick={() => setViewState('splash')}
                className="w-full text-center text-gray-500 text-xs py-1.5"
              >
                Indietro
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* PWA Install Prompt - Shows automatically when app is not installed */}
      {viewState === 'splash' && <PWAInstallPrompt delay={0} autoShow={true} forceShow={true} />}

      {/* Footer - Compact */}
      <motion.p 
        className="text-[10px] text-gray-600 mt-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        DC-30 Fuerteventura - 🎂 © 2026
      </motion.p>
    </div>
  );
};
