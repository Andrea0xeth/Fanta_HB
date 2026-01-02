import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Countdown } from './Countdown';
import { useGame } from '../context/GameContext';

interface CountdownGateProps {
  children: React.ReactNode;
  description: string;
  title?: string;
  icon?: React.ReactNode;
}

export const CountdownGate: React.FC<CountdownGateProps> = ({ 
  children, 
  description,
  title,
  icon 
}) => {
  const { gameState, user } = useGame();
  const [hasStarted, setHasStarted] = useState(false);

  // Usa data_inizio dal gameState, altrimenti usa la data hardcoded
  const eventDate = gameState.data_inizio 
    ? new Date(gameState.data_inizio).toISOString()
    : new Date('2026-01-08T00:00:00+01:00').toISOString();

  useEffect(() => {
    const checkIfStarted = () => {
      const now = Date.now();
      const start = new Date(eventDate).getTime();
      const started = now >= start || gameState.evento_iniziato;
      setHasStarted(started);
    };

    checkIfStarted();
    const interval = setInterval(checkIfStarted, 1000);
    return () => clearInterval(interval);
  }, [eventDate, gameState.evento_iniziato]);

  // Gli admin vedono sempre il contenuto
  if (user?.is_admin) {
    return <>{children}</>;
  }

  // Se l'evento è iniziato, mostra il contenuto
  if (hasStarted) {
    return <>{children}</>;
  }

  // Altrimenti mostra il countdown con descrizione
  return (
    <div className="min-h-full bg-dark flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex justify-center"
          >
            {icon}
          </motion.div>
        )}

        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-bold text-2xl mb-4 text-gradient"
          >
            {title}
          </motion.h1>
        )}

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 text-base mb-8 leading-relaxed"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <p className="text-gray-500 text-sm mb-4">L'evento inizia tra</p>
          <Countdown 
            targetDate={eventDate}
            onComplete={() => setHasStarted(true)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-gray-500 text-xs"
        >
          Preparati per l'avventura! 🎉
        </motion.div>
      </motion.div>
    </div>
  );
};

