import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Zap, Users, User, Calendar, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import type { Premio } from '../types';

const mockPremi: Premio[] = [
  {
    id: '1',
    titolo: 'Cena Borgese x4',
    descrizione: 'Una cena per 4 persone in stile 4 Ristoranti al ristorante scelto dal vincitore!',
    immagine: '🍕',
    tipo: 'squadra',
    punti_richiesti: 500,
  },
  {
    id: '2',
    titolo: 'iPhone 15',
    descrizione: 'Un iPhone 15 nuovo di zecca per il miglior giocatore singolo!',
    immagine: '📱',
    tipo: 'singolo',
    punti_richiesti: 300,
  },
  {
    id: '3',
    titolo: '100€ Cash',
    descrizione: 'Premio in contanti per il MVP del Giorno 1!',
    immagine: '💰',
    tipo: 'giornaliero',
    punti_richiesti: 100,
  },
  {
    id: '4',
    titolo: 'Weekend Spa',
    descrizione: 'Un weekend di relax in una spa di lusso per due persone!',
    immagine: '🧖',
    tipo: 'singolo',
    punti_richiesti: 250,
  },
  {
    id: '5',
    titolo: 'Voucher Birra x10',
    descrizione: 'Birra gratis per il prossimo mese! 10 consumazioni incluse.',
    immagine: '🍺',
    tipo: 'speciale',
    punti_richiesti: 75,
  },
  {
    id: '6',
    titolo: 'PlayStation 5',
    descrizione: 'Console PlayStation 5 per la squadra vincitrice!',
    immagine: '🎮',
    tipo: 'squadra',
    punti_richiesti: 600,
  },
  {
    id: '7',
    titolo: 'AirPods Pro',
    descrizione: 'Un paio di AirPods Pro per il secondo classificato!',
    immagine: '🎧',
    tipo: 'singolo',
    punti_richiesti: 200,
  },
  {
    id: '8',
    titolo: 'Maglietta Personalizzata',
    descrizione: 'La maglietta ufficiale "30diCiaccioGame Winner Edition"!',
    immagine: '👕',
    tipo: 'giornaliero',
    punti_richiesti: 50,
  },
];

const tipoColors = {
  squadra: { bg: 'bg-turquoise-400/20', text: 'text-turquoise-400', icon: Users },
  singolo: { bg: 'bg-coral-500/20', text: 'text-coral-500', icon: User },
  giornaliero: { bg: 'bg-party-300/20', text: 'text-party-300', icon: Calendar },
  speciale: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Sparkles },
};

const tipoLabels = {
  squadra: 'Squadra',
  singolo: 'Singolo',
  giornaliero: 'Giornaliero',
  speciale: 'Speciale',
};

export const PremiPage: React.FC = () => {
  const { user, mySquadra } = useGame();
  
  const userPoints = user?.punti_personali || 0;
  const teamPoints = mySquadra?.punti_squadra || 0;
  const totalPoints = Math.round(userPoints * 0.7 + teamPoints * 0.3);

  return (
    <div className="min-h-screen bg-dark">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-dark px-4 pt-safe pb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <Gift className="w-12 h-12 text-party-300 mx-auto mb-2" />
          <h1 className="text-2xl font-display font-bold">Premi</h1>
          <p className="text-gray-500 text-sm">Cosa puoi vincere al 30diCiaccioGame!</p>
        </motion.div>

        {/* Points Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-party rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">I tuoi punti totali</p>
              <p className="text-3xl font-bold text-white">{totalPoints}</p>
            </div>
            <div className="text-right text-white/80 text-sm">
              <p>Personali: {userPoints}</p>
              <p>Squadra: {teamPoints}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-6">
        {/* Categories */}
        {(['squadra', 'singolo', 'giornaliero', 'speciale'] as const).map((tipo) => {
          const premi = mockPremi.filter(p => p.tipo === tipo);
          if (premi.length === 0) return null;
          
          const { icon: Icon, bg, text } = tipoColors[tipo];
          
          return (
            <section key={tipo}>
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${bg}`}>
                  <Icon size={18} className={text} />
                </div>
                Premi {tipoLabels[tipo]}
              </h2>
              
              <div className="grid gap-4">
                {premi.map((premio, index) => {
                  const progress = (totalPoints / (premio.punti_richiesti || 1)) * 100;
                  const isUnlocked = progress >= 100;
                  
                  return (
                    <motion.div
                      key={premio.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`card relative overflow-hidden ${
                        isUnlocked ? 'border-party-300/50 bg-party-300/5' : ''
                      }`}
                    >
                      {/* Unlocked badge */}
                      {isUnlocked && (
                        <div className="absolute top-2 right-2">
                          <span className="badge-party flex items-center gap-1">
                            <Star size={10} />
                            Sbloccato!
                          </span>
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Emoji/Image */}
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                          isUnlocked 
                            ? 'bg-gradient-to-br from-party-300/30 to-party-300/10' 
                            : 'bg-gray-800'
                        }`}>
                          {premio.immagine}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1">{premio.titolo}</h3>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {premio.descrizione}
                          </p>
                          
                          {/* Progress */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className={`${bg} ${text} px-2 py-0.5 rounded-full`}>
                                {tipoLabels[tipo]}
                              </span>
                              <span className="text-gray-500">
                                {Math.min(totalPoints, premio.punti_richiesti || 0)}/{premio.punti_richiesti} pts
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-full ${isUnlocked ? 'bg-party-300' : 'bg-coral-500'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Motivation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card text-center"
        >
          <Zap className="w-10 h-10 text-party-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Continua a giocare!</h3>
          <p className="text-gray-500 text-sm">
            Completa quest, vinci gare e scala la classifica per sbloccare tutti i premi! 🚀
          </p>
        </motion.div>
      </div>
    </div>
  );
};
