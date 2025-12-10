import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Countdown } from '../components/Countdown';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

type ViewState = 'splash' | 'video-pre' | 'auth' | 'video-post' | 'loading';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useGame();
  const [viewState, setViewState] = useState<ViewState>('splash');
  const [nickname, setNickname] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPostVideo, setShowPostVideo] = useState(false); // Flag per video post
  const videoRef = useRef<HTMLVideoElement>(null);

  // Target date for the event (3 days from now for demo)
  const eventDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  // Redirect solo se già autenticato ALL'AVVIO (non dopo login)
  useEffect(() => {
    if (isAuthenticated && viewState === 'splash' && !showPostVideo) {
      // Se già autenticato all'avvio, vai direttamente alla home
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, viewState, showPostVideo]);

  // Handle "Entra nel Game" click - show pre-registration video
  const handleEnterGame = () => {
    setViewState('video-pre');
  };

  // When pre-registration video ends, show auth form
  const handlePreVideoEnd = () => {
    setViewState('auth');
  };

  // Handle authentication
  const handleAuth = async () => {
    setAuthLoading(true);
    setShowPostVideo(true); // Imposta il flag PRIMA del login
    
    try {
      await login(nickname);
      // After successful login, show post-registration video
      setViewState('video-post');
      setAuthLoading(false);
    } catch (error) {
      console.error('Auth failed:', error);
      setShowPostVideo(false);
      setAuthLoading(false);
    }
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
      <div className="h-screen bg-dark flex flex-col items-center justify-center relative overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/BenvenutoPreIscrizione.mp4"
          autoPlay
          playsInline
          onEnded={handlePreVideoEnd}
          className="w-full h-full object-contain max-h-screen"
        />
        
        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={handleSkipVideo}
          className="absolute bottom-8 right-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70 hover:bg-white/20 transition-colors"
        >
          Salta →
        </motion.button>
      </div>
    );
  }

  // Video Post-Iscrizione
  if (viewState === 'video-post') {
    return (
      <div className="h-screen bg-dark flex flex-col items-center justify-center relative overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/BenvenutoPostiscrizione.mp4"
          autoPlay
          playsInline
          onEnded={handlePostVideoEnd}
          className="w-full h-full object-contain max-h-screen"
        />
        
        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={handleSkipVideo}
          className="absolute bottom-8 right-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/70 hover:bg-white/20 transition-colors"
        >
          Salta →
        </motion.button>
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
          ) : viewState === 'auth' ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Il tuo nickname (opzionale)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input text-center"
                maxLength={20}
              />
              
              <button
                onClick={handleAuth}
                disabled={authLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-70"
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
                    Accedi con Face ID / Impronta
                  </>
                )}
              </button>
              
              <button
                onClick={() => setViewState('splash')}
                className="w-full text-center text-gray-500 text-sm"
              >
                Annulla
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      {/* PWA Install Prompt - Shows automatically when app is not installed */}
      {viewState === 'splash' && <PWAInstallPrompt delay={500} autoShow={true} forceShow={true} />}

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
