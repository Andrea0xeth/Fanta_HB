import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Countdown } from '../components/Countdown';
// import { PWAInstallPrompt } from '../components/PWAInstallPrompt'; // Disabilitato temporaneamente
import { WebAuthnDebug } from '../components/WebAuthnDebug';
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
  const videoRef = useRef<HTMLVideoElement>(null);

  // Target date for the event: 8 gennaio 2026 alle 00:00 CET
  // CET = Central European Time (UTC+1 in inverno, UTC+2 in estate)
  // 8 gennaio 2026 è in inverno, quindi UTC+1
  // 00:00 CET = 23:00 UTC del giorno precedente
  const eventDate = new Date('2026-01-08T00:00:00+01:00').toISOString();

  // Redirect solo se già autenticato ALL'AVVIO (non dopo login)
  useEffect(() => {
    if (isAuthenticated && viewState === 'splash' && !showPostVideo) {
      // Se già autenticato all'avvio, vai direttamente alla home
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, viewState, showPostVideo]);

  // Handle "Entra nel Game" click - show choice between login and register
  const handleEnterGame = () => {
    setViewState('auth-choice');
  };

  // Handle login choice - try to login with existing passkey
  const handleLogin = async () => {
    setAuthLoading(true);
    setShowPostVideo(true); // Imposta il flag PRIMA del login
    try {
      await loginWithPasskey();
      // After successful login, show post-login video
      setViewState('video-post');
      setAuthLoading(false);
    } catch (error) {
      console.error('Login failed:', error);
      alert(error instanceof Error ? error.message : 'Errore durante il login. Registrati se non hai ancora un account.');
      setShowPostVideo(false);
      setAuthLoading(false);
    }
  };

  // Handle register choice - show pre-registration video then form
  const handleRegister = () => {
    setViewState('video-pre');
  };

  // When pre-registration video ends, show auth form
  const handlePreVideoEnd = () => {
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
    setShowPostVideo(true); // Imposta il flag PRIMA della registrazione
    
    try {
      // Chiama direttamente register() per creare un nuovo account con nuova passkey
      // Non provare a fare login prima - l'utente vuole registrarsi!
      await register(registrationData);
      // After successful registration, show post-registration video
      setViewState('video-post');
      setAuthLoading(false);
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error instanceof Error ? error.message : 'Errore durante la registrazione');
      setShowPostVideo(false);
      setAuthLoading(false);
    }
  };

  // Update registration field
  const updateField = (field: keyof RegistrationData, value: string) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }));
  };

  // When post-registration video ends, navigate to home
  const handlePostVideoEnd = () => {
    navigate('/home', { replace: true });
  };

  // Skip video handler
  const handleSkipVideo = () => {
    if (viewState === 'video-pre') {
      setViewState('auth');
    } else if (viewState === 'video-post') {
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
        
        {/* Modale con video verticale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 w-[85%] max-w-md aspect-[9/16] bg-gray-900 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
        >
          <video
            ref={videoRef}
            src="/videos/BenvenutoPreIscrizione.mp4"
            autoPlay
            playsInline
            onEnded={handlePreVideoEnd}
            className="w-full h-full object-cover"
          />
          
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleSkipVideo}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70 hover:bg-white/20 transition-colors"
          >
            Salta →
          </motion.button>
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
        
        {/* Modale con video verticale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-50 w-[85%] max-w-md aspect-[9/16] bg-gray-900 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
        >
          <video
            ref={videoRef}
            src="/videos/BenvenutoPostiscrizione.mp4"
            autoPlay
            playsInline
            onEnded={handlePostVideoEnd}
            className="w-full h-full object-cover"
          />
          
          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={handleSkipVideo}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70 hover:bg-white/20 transition-colors"
          >
            Salta →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark flex flex-col items-center justify-between p-6 pt-safe overflow-hidden relative">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: ['#FF6B6B', '#4ECDC4', '#FFE66D'][i % 3],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Top section - Logo */}
      <motion.div 
        className="flex-1 flex flex-col items-center justify-center relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8"
        >
          <PartyPopper className="w-20 h-20 text-party-300 mx-auto mb-4" />
        </motion.div>
        
        <h1 className="text-4xl font-display font-bold text-center mb-2">
          <span className="text-gradient">30</span>
          <span className="text-white">di</span>
          <span className="text-gradient">Ciaccio</span>
        </h1>
        <h2 className="text-xl font-display font-semibold text-turquoise-400 flex items-center gap-2">
          <Sparkles size={20} />
          Game
          <Sparkles size={20} />
        </h2>
        
        <p className="text-gray-400 text-center mt-4 max-w-xs">
          Il gioco definitivo per il 30° compleanno più epico di sempre!
        </p>
      </motion.div>

      {/* Middle section - Countdown */}
      <motion.div 
        className="mb-8 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-center text-gray-500 mb-4 text-sm">Inizia tra</p>
        <Countdown targetDate={eventDate} />
      </motion.div>

      {/* Bottom section - Auth */}
      <motion.div 
        className="w-full max-w-sm space-y-4 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {viewState === 'splash' ? (
            <motion.button
              key="enter"
              onClick={handleEnterGame}
              className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-4"
              whileTap={{ scale: 0.98 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Fingerprint size={24} />
              Entra nel Game
            </motion.button>
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
                onClick={handleLogin}
                disabled={authLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Fingerprint size={24} />
                    Accedi con Passkey
                  </>
                )}
              </button>
              
              <button
                onClick={handleRegister}
                disabled={authLoading}
                className="btn-secondary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={24} />
                Registrati (Nuovo Account)
              </button>
              
              <button
                onClick={() => setViewState('splash')}
                className="w-full text-center text-gray-500 text-sm py-2"
              >
                Indietro
              </button>
            </motion.div>
          ) : viewState === 'auth' ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 max-h-[70vh] overflow-y-auto scrollbar-hide"
            >
              <p className="text-sm text-gray-400 text-center mb-2">
                Compila i dati per partecipare al gioco
              </p>
              
              <input
                type="text"
                placeholder="Nickname *"
                value={registrationData.nickname}
                onChange={(e) => updateField('nickname', e.target.value)}
                className="input text-center"
                maxLength={20}
                required
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome *"
                  value={registrationData.nome}
                  onChange={(e) => updateField('nome', e.target.value)}
                  className="input text-center"
                  required
                />
                <input
                  type="text"
                  placeholder="Cognome *"
                  value={registrationData.cognome}
                  onChange={(e) => updateField('cognome', e.target.value)}
                  className="input text-center"
                  required
                />
              </div>
              
              <input
                type="email"
                placeholder="Email *"
                value={registrationData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input text-center"
                required
              />
              
              <input
                type="tel"
                placeholder="Telefono"
                value={registrationData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className="input text-center"
              />
              
              <input
                type="date"
                placeholder="Data di nascita"
                value={registrationData.data_nascita}
                onChange={(e) => updateField('data_nascita', e.target.value)}
                className="input text-center"
                max={new Date().toISOString().split('T')[0]}
              />
              
              <button
                onClick={handleAuth}
                disabled={authLoading || !registrationData.nome || !registrationData.cognome || !registrationData.email}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {authLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Fingerprint size={24} />
                    Registrati con Face ID / Impronta
                  </>
                )}
              </button>
              
              <button
                onClick={() => setViewState('splash')}
                className="w-full text-center text-gray-500 text-sm py-2"
              >
                Annulla
              </button>
              
              {/* Debug button */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="w-full text-center text-gray-400 text-xs py-2 underline"
              >
                {showDebug ? 'Nascondi' : 'Mostra'} Debug WebAuthn
              </button>
              
              {/* Debug panel */}
              {showDebug && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <WebAuthnDebug />
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* PWA Install Prompt - Shows automatically when app is not installed */}
      {/* DISABILITATO TEMPORANEAMENTE */}
      {/* {viewState === 'splash' && <PWAInstallPrompt delay={500} autoShow={true} forceShow={true} />} */}

      {/* Footer */}
      <motion.p 
        className="text-xs text-gray-600 mt-6 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        © 2024 30diCiaccioGame - Buon Compleanno! 🎂
      </motion.p>
    </div>
  );
};
