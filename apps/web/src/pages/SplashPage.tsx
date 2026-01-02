import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Countdown } from '../components/Countdown';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { WebAuthnDebug } from '../components/WebAuthnDebug';
import { CircusNeonDecorations } from '../components/CircusNeonDecorations';
import type { RegistrationData, EmailPasswordRegistrationData } from '../types';
import { getCachedVideoSrc } from '../lib/videoCache';

type ViewState =
  | 'splash'
  | 'video-pre'
  | 'auth'
  | 'auth-choice'
  | 'auth-register-method'
  | 'auth-login-method'
  | 'auth-email-login'
  | 'auth-email-register'
  | 'video-post'
  | 'loading';

export const SplashPage: React.FC = () => {
  const VIDEO_PRE_URL = '/videos/BenvenutoPreIscrizione.mp4';
  const VIDEO_POST_URL = '/videos/BenvenutoPostiscrizione.mp4';

  const navigate = useNavigate();
  const {
    loginWithPasskey,
    loginWithEmailPassword,
    register,
    registerWithEmailPassword,
    isAuthenticated,
    isLoading,
  } = useGame();
  const [viewState, setViewState] = useState<ViewState>('splash');
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    nickname: '',
    nome: '',
    cognome: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Flag per mostrare debug
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showPostContinueButton, setShowPostContinueButton] = useState(false);
  const [showWelcomePlayOverlay, setShowWelcomePlayOverlay] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoginData, setEmailLoginData] = useState({ email: '', password: '' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const revokeVideoSrcRef = useRef<null | (() => void)>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');
  
  // Redirect automatico se già autenticato
  useEffect(() => {
    if (!isLoading && isAuthenticated && viewState === 'splash') {
      // Se l'utente è già autenticato, reindirizza automaticamente alla home
      navigate('/home', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate, viewState]);
  
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

  // Redirect automatico se già autenticato (rimuove il prompt "Continua" / "Cambia account")

  // Gestisci il video quando cambia viewState
  useEffect(() => {
    if (viewState !== 'video-pre' && viewState !== 'video-post') {
      return;
    }

    setShowWelcomePlayOverlay(false);

    let cleanupFunctions: (() => void)[] = [];

    // Aspetta che il video sia montato nel DOM
    const timeoutId = setTimeout(() => {
      if (!videoRef.current) {
        console.warn('Video ref non disponibile');
        return;
      }

      const video = videoRef.current;
      
      // Reset video
      video.currentTime = 0;
      video.volume = 1;
      // Audio sempre attivo (come richiesto)
      video.muted = false;
      
      // Funzione per far partire il video
      const startVideo = () => {
        if (!videoRef.current) return;
        
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('✅ Video avviato con successo');
              setShowWelcomePlayOverlay(false);
            })
            .catch(error => {
              console.error('❌ Error playing video:', error);
              // Autoplay con audio può essere bloccato: mostriamo overlay "tocca per riprodurre"
              setShowWelcomePlayOverlay(true);
            });
        }
      };
      
      // Forza il caricamento del video
      video.load();
      
      // Gestori eventi per quando il video è pronto
      const handleCanPlay = () => {
        if (videoRef.current && videoRef.current.paused) {
          startVideo();
        }
      };
      
      const handleLoadedData = () => {
        if (videoRef.current && videoRef.current.paused) {
          startVideo();
        }
      };
      
      // Aggiungi listener
      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.addEventListener('loadeddata', handleLoadedData, { once: true });
      
      // Salva cleanup functions
      cleanupFunctions.push(() => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', handleCanPlay);
          videoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
      });
      
      // Prova a far partire immediatamente se già caricato
      if (video.readyState >= 2) {
        startVideo();
      }
    }, 150);
    
    return () => {
      clearTimeout(timeoutId);
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [viewState]);

  // Usa il video già in cache (se disponibile) così parte subito
  useEffect(() => {
    if (viewState !== 'video-pre' && viewState !== 'video-post') {
      return;
    }

    const targetUrl = viewState === 'video-pre' ? VIDEO_PRE_URL : VIDEO_POST_URL;
    let cancelled = false;

    // Reset + cleanup eventuale blob precedente
    revokeVideoSrcRef.current?.();
    revokeVideoSrcRef.current = null;
    setVideoSrc(targetUrl);

    getCachedVideoSrc(targetUrl).then(({ src, revoke }) => {
      if (cancelled) {
        revoke?.();
        return;
      }
      setVideoSrc(src);
      revokeVideoSrcRef.current = revoke ?? null;
      // Se il video è già montato, ricarica la sorgente
      requestAnimationFrame(() => videoRef.current?.load());
    });

    return () => {
      cancelled = true;
      revokeVideoSrcRef.current?.();
      revokeVideoSrcRef.current = null;
    };
  }, [viewState, VIDEO_PRE_URL, VIDEO_POST_URL]);

  const handleStartWelcomeVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    videoRef.current.volume = 1;
    videoRef.current.play().then(() => setShowWelcomePlayOverlay(false)).catch(() => setShowWelcomePlayOverlay(true));
  };

  // Handle "Entra nel Game" click - show choice between login and register
  const handleEnterGame = () => {
    setViewState('auth-choice');
  };

  // Handle login choice - try to login with existing passkey
  const handleLogin = async () => {
    setAuthLoading(true);
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
      setAuthLoading(false);
      setViewState('auth-choice'); // Torna alla scelta auth
    }
  };

  const handleEmailLogin = async () => {
    if (!emailLoginData.email || !emailLoginData.password) {
      alert('Inserisci email e password');
      return;
    }

    setAuthLoading(true);
    setShowPostContinueButton(false);
    try {
      await loginWithEmailPassword({
        email: emailLoginData.email,
        password: emailLoginData.password,
      });
      setAuthLoading(false);
      setViewState('video-post');
    } catch (error) {
      console.error('Email login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il login';
      alert(errorMessage);
      setAuthLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    // Validazioni minime
    if (!registrationData.nickname || !registrationData.nome || !registrationData.cognome || !registrationData.email) {
      alert('Per favore compila tutti i campi obbligatori (Nickname, Nome, Cognome, Email)');
      return;
    }
    if (!emailPassword || emailPassword.length < 8) {
      alert('La password deve essere lunga almeno 8 caratteri');
      return;
    }

    setAuthLoading(true);
    setShowPostContinueButton(false);
    try {
      const payload: EmailPasswordRegistrationData = {
        ...registrationData,
        email: registrationData.email!,
        password: emailPassword,
      };
      await registerWithEmailPassword(payload);
      setAuthLoading(false);
      setViewState('video-post');
    } catch (error) {
      console.error('Email registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante la registrazione';
      alert(errorMessage);
      setAuthLoading(false);
    }
  };

  // Handle register choice - show pre-registration video then form
  const handleRegister = () => {
    setShowContinueButton(false); // Reset continue button state
    // Reset email flag per passkey registration
    setRegistrationData(prev => ({ ...prev, email: undefined }));
    setViewState('video-pre');
    // Il video partirà automaticamente grazie all'useEffect
  };

  // When pre-registration video ends, show continue button
  const handlePreVideoEnd = () => {
    setShowContinueButton(true);
  };
  
  const handleContinueFromPreVideo = () => {
    setShowContinueButton(false);
    // Se siamo arrivati qui da "Registrati con Email", vai al form email
    // Altrimenti vai al form passkey
    if (registrationData.email === 'email-register-flag') {
      setRegistrationData(prev => ({ ...prev, email: '' }));
      setViewState('auth-email-register');
    } else {
      setViewState('auth');
    }
  };

  // Handle registration with passkey (crea nuovo account)
  const handleAuth = async () => {
    // Validazione campi obbligatori
    if (!registrationData.nickname || !registrationData.nome || !registrationData.cognome) {
      alert('Per favore compila tutti i campi obbligatori (Nickname, Nome, Cognome)');
      return;
    }

    setAuthLoading(true);
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
      setAuthLoading(false);
    }
  };

  // Update registration field
  const updateField = (field: keyof RegistrationData, value: string | File) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validazione tipo file
      if (!file.type.startsWith('image/')) {
        alert('Per favore seleziona un file immagine');
        return;
      }
      
      // Validazione dimensione (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'immagine deve essere inferiore a 5MB');
        return;
      }
      
      updateField('foto_profilo', file);
      
      // Crea preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      // Se siamo arrivati qui da "Registrati con Email", vai al form email
      // Altrimenti vai al form passkey
      if (registrationData.email === 'email-register-flag') {
        setRegistrationData(prev => ({ ...prev, email: '' }));
        setViewState('auth-email-register');
      } else {
        setViewState('auth');
      }
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
            src={videoSrc || VIDEO_PRE_URL}
            autoPlay
            playsInline
            muted={false}
            preload="auto"
            onEnded={handlePreVideoEnd}
            onLoadedData={() => {
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.error('Errore play onLoadedData:', err);
                  setShowContinueButton(true);
                });
              }
            }}
            onCanPlay={() => {
              if (videoRef.current && videoRef.current.paused) {
                videoRef.current.play().catch((err) => {
                  console.error('Errore play onCanPlay:', err);
                  setShowContinueButton(true);
                });
              }
            }}
            onPlay={() => {
              console.log('✅ Video in riproduzione');
            }}
            className="w-full h-full object-cover"
          />

          {/* Overlay play (quando autoplay con audio viene bloccato) */}
          <AnimatePresence>
            {showWelcomePlayOverlay && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleStartWelcomeVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
              >
                <div className="px-4 py-3 rounded-2xl glass-strong border border-white/20 text-white/90 text-sm font-semibold">
                  Tocca per riprodurre
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          
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
            src={videoSrc || VIDEO_POST_URL}
            autoPlay
            playsInline
            muted={false}
            preload="auto"
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

          {/* Overlay play (quando autoplay con audio viene bloccato) */}
          <AnimatePresence>
            {showWelcomePlayOverlay && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleStartWelcomeVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"
              >
                <div className="px-4 py-3 rounded-2xl glass-strong border border-white/20 text-white/90 text-sm font-semibold">
                  Tocca per riprodurre
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          
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
          
          {/* Foto Profilo Upload */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-400 text-center">
              Foto Profilo (opzionale)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-coral-500 transition-colors px-4 py-3"
              >
                {avatarPreview ? (
                  <>
                  <img
                    src={avatarPreview}
                    alt="Preview"
                      className="w-16 h-16 rounded-2xl bg-black/30 object-contain"
                  />
                    <div className="text-left">
                      <div className="text-xs text-gray-200 font-semibold">Foto caricata</div>
                      <div className="text-[10px] text-gray-400">Clicca per cambiarla</div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-gray-500">
                    <svg
                      className="w-8 h-8 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300 font-semibold">Carica una foto</div>
                      <div className="text-[10px] text-gray-500">Opzionale</div>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <button
            onClick={handleAuth}
            disabled={authLoading || !registrationData.nickname || !registrationData.nome || !registrationData.cognome}
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

  // Login Email + Password
  if (viewState === 'auth-email-login') {
    return (
      <div className="h-screen bg-dark flex flex-col items-center justify-center p-4 pt-safe overflow-y-auto scrollbar-hide">
        <motion.div
          className="w-full max-w-sm space-y-3 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-gray-400 text-center mb-2">
            Accedi con email e password
          </p>

          <input
            type="email"
            placeholder="Email"
            value={emailLoginData.email}
            onChange={(e) => setEmailLoginData(prev => ({ ...prev, email: e.target.value }))}
            className="input text-center text-sm"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={emailLoginData.password}
            onChange={(e) => setEmailLoginData(prev => ({ ...prev, password: e.target.value }))}
            className="input text-center text-sm"
            required
          />

          <button
            onClick={handleEmailLogin}
            disabled={authLoading || !emailLoginData.email || !emailLoginData.password}
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
                <Mail size={18} />
                Accedi
              </>
            )}
          </button>

          <button
            onClick={() => setViewState('auth-login-method')}
            className="w-full text-center text-gray-500 text-xs py-1.5"
          >
            Indietro
          </button>
        </motion.div>
      </div>
    );
  }

  // Registrazione Email + Password
  if (viewState === 'auth-email-register') {
    return (
      <div className="h-screen bg-dark flex flex-col items-center justify-center p-4 pt-safe overflow-y-auto scrollbar-hide">
        <motion.div
          className="w-full max-w-sm space-y-3 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-gray-400 text-center mb-2">
            Registrati con email e password
          </p>

          <input
            type="text"
            placeholder="Nickname"
            value={registrationData.nickname}
            onChange={(e) => updateField('nickname', e.target.value)}
            className="input text-center text-sm"
            maxLength={20}
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
            type="password"
            placeholder="Password (min 8) *"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
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

          {/* Foto Profilo Upload */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-400 text-center">
              Foto Profilo (opzionale)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload-email"
              />
              <label
                htmlFor="avatar-upload-email"
                className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-coral-500 transition-colors px-4 py-3"
              >
                {avatarPreview ? (
                  <>
                  <img
                    src={avatarPreview}
                    alt="Preview"
                      className="w-16 h-16 rounded-2xl bg-black/30 object-contain"
                  />
                    <div className="text-left">
                      <div className="text-xs text-gray-200 font-semibold">Foto caricata</div>
                      <div className="text-[10px] text-gray-400">Clicca per cambiarla</div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-gray-500">
                    <svg
                      className="w-8 h-8 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-gray-300 font-semibold">Carica una foto</div>
                      <div className="text-[10px] text-gray-500">Opzionale</div>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleEmailRegister}
            disabled={authLoading || !registrationData.nickname || !registrationData.nome || !registrationData.cognome || !registrationData.email || !emailPassword}
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
                <Lock size={18} />
                Registrati
              </>
            )}
          </button>

          <button
            onClick={() => setViewState('auth-register-method')}
            className="w-full text-center text-gray-500 text-xs py-1.5"
          >
            Indietro
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark flex flex-col items-center justify-center p-4 pt-safe overflow-hidden relative">
      {/* Clown Background - Large and semi-transparent, below falling elements - Top left, much higher */}
      <div className="absolute pointer-events-none z-0" style={{ top: '-20%', left: '-10%' }}>
        <img 
          src="/clown.png" 
          alt="Clown Background" 
          className="object-contain opacity-20"
          style={{ 
            width: '60vw',
            height: '60vh',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Background - Falling Circus Neon Decorations - 20 decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
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
        {/* Di Ciaccio - 30 - Small subtitle - White with D and C uppercase - Less visible - Above DC-30 */}
        <motion.p 
          className="text-sm md:text-base font-medium text-center mb-0 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.2 }}
          style={{
            WebkitTextStroke: '0.4px #ffffff',
            color: 'rgba(255, 255, 255, 0.4)',
            textShadow: `
              0 0 0.5px rgba(255, 255, 255, 0.3),
              0 0 1px rgba(255, 255, 255, 0.3),
              0 0 1.5px rgba(255, 255, 255, 0.2)
            `,
            fontSize: '10px',
            fontWeight: 400,
          }}
        >
          <span className="uppercase">D</span>i <span className="uppercase">C</span>iaccio - 30
        </motion.p>

        {/* DC-30 with Overlay Image */}
        <div className="relative flex flex-col items-center -mt-2">
          {/* DC-30 - Main Neon Text - Appena sotto Di Ciaccio - 30 */}
          <div className="neon-3d-glow mb-0 relative z-10">
            <h1 
              className="neon-red-orange text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-bold text-center tracking-wider"
              style={{
                animation: `neon-flicker ${flickerTimings.dc30}s infinite`,
                color: 'transparent', // Centro trasparente - solo contorni
              }}
            >
              DC-30
            </h1>
          </div>

          {/* DC-10 Plane Image - Overlay on DC-30 - Larger and higher z-index - Lower position */}
          <motion.div
            className="absolute top-20 md:top-24 z-30 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <img 
              src="/dc10plane.png" 
              alt="DC-10 Plane" 
              className="max-w-[180px] md:max-w-[220px]"
              style={{ maxHeight: '150px', objectFit: 'contain', display: 'block' }}
            />
          </motion.div>
        </div>

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
              width: '290px',
              paddingTop: '0px',
              paddingBottom: '0px',
              opacity: 1,
              borderRadius: '172px',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
              marginLeft: '0px',
              marginRight: '0px',
            }}
          >
            CIRCOCIACCIO
          </h2>
          <p 
            className="text-xl md:text-2xl font-semibold text-center tracking-wider uppercase mt-1"
            style={{
              WebkitTextStroke: '0.4px #ffffff',
              color: 'rgba(255, 255, 255, 0.4)',
              opacity: 0.5,
              textShadow: `
                0 0 0.5px rgba(255, 255, 255, 0.3),
                0 0 1px rgba(255, 255, 255, 0.3),
                0 0 1.5px rgba(255, 255, 255, 0.2)
              `
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
            // Se l'utente è autenticato, il redirect automatico lo porta alla home
            // Non mostriamo più i bottoni "Continua" / "Cambia account"
            !isAuthenticated ? (
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
            ) : null
          ) : viewState === 'auth-choice' ? (
            <motion.div
              key="auth-choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 w-full"
            >
              <p className="text-sm text-gray-400 text-center mb-4">
                Hai già un account o vuoi registrarti?
              </p>
              
              <button
                onClick={() => setViewState('auth-register-method')}
                disabled={authLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform duration-75"
              >
                <Sparkles size={18} />
                Registrati
              </button>
              
              <button
                onClick={() => setViewState('auth-login-method')}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-75 border border-gray-600/30 rounded-xl hover:border-gray-500/50"
              >
                <Fingerprint size={16} />
                Accedi
              </button>
              
              <button
                onClick={() => setViewState('splash')}
                className="w-full text-center text-gray-500 text-xs py-1.5"
              >
                Indietro
              </button>
            </motion.div>
          ) : viewState === 'auth-register-method' ? (
            <motion.div
              key="auth-register-method"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                Scegli come registrarti
              </p>
              
              <button
                onClick={handleRegister}
                disabled={authLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform duration-75"
              >
                <Fingerprint size={18} />
                Registrati con Passkey
              </button>

              <button
                onClick={() => {
                  // Imposta un flag per sapere che veniamo da email registration
                  setRegistrationData(prev => ({ ...prev, email: 'email-register-flag' }));
                  setShowContinueButton(false);
                  setViewState('video-pre');
                }}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-75 border border-gray-600/30 rounded-xl hover:border-gray-500/50"
              >
                <Lock size={16} />
                Registrati con Email + Password
              </button>
              
              <button
                onClick={() => setViewState('auth-choice')}
                className="w-full text-center text-gray-500 text-xs py-1.5"
              >
                Indietro
              </button>
            </motion.div>
          ) : viewState === 'auth-login-method' ? (
            <motion.div
              key="auth-login-method"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                Scegli come accedere
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
                onClick={() => setViewState('auth-email-login')}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-75 border border-gray-600/30 rounded-xl hover:border-gray-500/50"
              >
                <Mail size={16} />
                Accedi con Email + Password
              </button>
              
              <button
                onClick={() => setViewState('auth-choice')}
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
