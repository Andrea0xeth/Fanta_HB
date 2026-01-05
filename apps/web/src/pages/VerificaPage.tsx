import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { VerificaCard } from '../components/VerificaCard';

export const VerificaPage: React.FC = () => {
  const navigate = useNavigate();
  const { proveInVerifica, user, votaProva } = useGame();

  // Raggruppa tutte le prove per giorno (incluse quelle passate)
  const proveByGiorno = useMemo(() => {
    const grouped: Record<number, typeof proveInVerifica> = {};
    
    // Includi tutte le prove, non solo quelle in verifica
    const allProve = proveInVerifica.filter(p => p.user_id !== user?.id);
    
    allProve.forEach(prova => {
      const giorno = prova.quest?.giorno || 0; // 0 per quest speciali
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
      }, {} as Record<number, typeof proveInVerifica>);
  }, [proveInVerifica, user?.id]);

  const giorniLabels: Record<number, string> = {
    0: 'Quest Speciali',
    1: 'GIOVEDÌ 8',
    2: 'VENERDÌ 9',
    3: 'SABATO 10',
    4: 'DOMENICA 11',
  };

  const totalProve = Object.values(proveByGiorno).flat().length;
  const proveInVerificaCount = Object.values(proveByGiorno)
    .flat()
    .filter(p => p.stato === 'in_verifica').length;

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
            {totalProve > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {proveInVerificaCount > 0 
                  ? `${proveInVerificaCount} da verificare` 
                  : 'Tutte verificate'}
              </p>
            )}
          </div>
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
                  Verifica delle Sfide
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Questo sarà il metodo di verifica delle sfide degli altri utenti.
                </p>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-turquoise-500/20 flex items-center justify-center">
                      <span className="text-turquoise-400 text-xs font-bold">1</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Qui avrete modo di votare per le sfide personali degli altri partecipanti al <span className="font-semibold text-coral-400">DC-30</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-turquoise-500/20 flex items-center justify-center">
                      <span className="text-turquoise-400 text-xs font-bold">2</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Solo al raggiungimento di <span className="font-semibold text-turquoise-400">10 voti</span> e almeno il <span className="font-semibold text-turquoise-400">66%</span> dei voti positivi, i punti delle sfide saranno distribuiti
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-turquoise-500/20 flex items-center justify-center">
                      <span className="text-turquoise-400 text-xs font-bold">3</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Le sfide verranno mostrate divise per giorno, così potrete verificare anche quelle passate
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-gray-500 text-xs">
                  Torna più tardi quando ci saranno sfide da verificare! 😊
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(proveByGiorno).map(([giornoStr, prove], index) => {
              const giorno = Number(giornoStr);
              const proveInVerificaGiorno = prove.filter(p => p.stato === 'in_verifica');
              const proveVerificateGiorno = prove.filter(p => p.stato !== 'in_verifica');
              
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
                        {prove.length} {prove.length === 1 ? 'prova' : 'prove'} totali
                        {proveInVerificaGiorno.length > 0 && (
                          <span className="text-turquoise-400 ml-1">
                            • {proveInVerificaGiorno.length} da verificare
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Prove in Verifica */}
                  {proveInVerificaGiorno.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-turquoise-400 mb-3 uppercase tracking-wide">
                        In Verifica
                      </h3>
                      <div className="space-y-3">
                        {proveInVerificaGiorno.map((prova) => (
                          <VerificaCard
                            key={prova.id}
                            prova={prova}
                            onVote={(id, valore) => {
                              votaProva(id, valore);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prove Verificate/Passate */}
                  {proveVerificateGiorno.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        {giorno === 0 || giorno >= 1 
                          ? 'Verificate' 
                          : 'Passate'}
                      </h3>
                      <div className="space-y-3 opacity-60">
                        {proveVerificateGiorno.map((prova) => (
                          <VerificaCard
                            key={prova.id}
                            prova={prova}
                            onVote={(id, valore) => {
                              votaProva(id, valore);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
