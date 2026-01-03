import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, UtensilsCrossed, Wine, Waves, Users, Sunset, Ship, Home, Music, Pizza, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AgendaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-300" />
              </motion.button>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-turquoise-500/10">
                  <Calendar size={22} className="text-turquoise-400" />
                </div>
                <h1 className="font-display font-bold text-xl text-gradient">Agenda</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          {/* GIOVEDÌ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 border border-white/10 overflow-hidden relative"
          >
            {/* Header con icona */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-coral-500/10">
                <UtensilsCrossed size={20} className="text-coral-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-coral-500 text-lg">GIOVEDÌ 08</h2>
                <p className="text-xs text-gray-400">Primo giorno</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cena */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-coral-500/10 flex items-center justify-center">
                  <span className="text-coral-500 font-bold text-sm">1</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-200 text-sm">Cena in ristorante</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-coral-500/20 text-coral-400 font-bold text-xs whitespace-nowrap">
                      35€
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Ciaccio ha organizzato una cena in un ristorante che a breve vi mostrerà. Menu di tapas e paella con inclusi 2 birre o 2 vini. Tutto il resto dell'alcol sarà a spese di Ciaccio. Ha già dato acconto e bloccato anche quello.
                  </p>
                </div>
              </div>

              {/* Locali */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-coral-500/10 flex items-center justify-center">
                  <Wine size={14} className="text-coral-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">Post serata in Locale del posto</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Tutti a sfasciarsi in qualche fetido locale del posto 🍸🍸🍸
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* VENERDÌ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5 border border-white/10 overflow-hidden relative"
          >
            {/* Header con icona */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-turquoise-500/10">
                <Waves size={20} className="text-turquoise-400" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-turquoise-400 text-lg">VENERDÌ 09</h2>
                <p className="text-xs text-gray-400">Mare e spiaggia</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Giochi a squadre */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-500/10 flex items-center justify-center">
                  <Users size={16} className="text-turquoise-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">Giochi a squadre Mattina/Pomeriggio</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    🌊 🏖️ 🍸 per vincere i premi e accumulare punti
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    L'organizzazione delle squadre seguirà a breve.
                  </p>
                </div>
              </div>

              {/* Pranzo */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-500/10 flex items-center justify-center">
                  <span className="text-turquoise-400 font-bold text-xs">🍽</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-200 text-sm">Pranzo a sacco</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-turquoise-500/20 text-turquoise-400 font-bold text-xs whitespace-nowrap">
                      15€
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-1">
                    Budget 15€ per persona per Spesa di panini e alcol massiccio.
                  </p>
                </div>
              </div>

              {/* Apericena */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-500/10 flex items-center justify-center">
                  <Sunset size={16} className="text-turquoise-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">
                    Apericena terrazza <span className="text-xs text-gray-400 font-normal">(19:00-24:00)</span>
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Ciaccio sta bloccando una terrazza per fare apericena con tapas e bottiglie, previsto fino alle 12:00. Questo sarà completamente a spesa di Di Ciaccio. 🌅
                  </p>
                </div>
              </div>

              {/* Locali */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-500/10 flex items-center justify-center">
                  <Wine size={14} className="text-turquoise-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">Bar Tour</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    A seguire solito bordello in qualche locale dove comunque Ciaccio prenderà da bere (si accettano consigli)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SABATO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5 border border-white/10 overflow-hidden relative"
          >
            {/* Header con icona */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-party-300/10">
                <Ship size={20} className="text-party-300" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-party-300 text-lg">SABATO 10</h2>
                <p className="text-xs text-gray-400">Catamarano e villa</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Catamarano */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-party-300/10 flex items-center justify-center">
                  <Ship size={16} className="text-party-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-200 text-sm">Catamarano</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-party-300/20 text-party-300 font-bold text-xs whitespace-nowrap">
                      50€
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Ciaccio ha bloccato il catamarano per 60 persone nell'isola lì vicino.
                  </p>
                   <p className="text-xs text-gray-400 italic">
                   Il prezzo Include cibo, alcol  ⛵️ <span className="line-through">e sballo</span> (a no scusate).
                   </p>
                </div>
              </div>

              {/* Villa */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-party-300/10 flex items-center justify-center">
                  <Home size={16} className="text-party-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">Evento serale in villa</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    A seguire in serata Ciaccio sta organizzando l'evento nella villa che ha bloccato a 15 minuti di macchina dall'hotel 🏠
                  </p>
                </div>
              </div>

              {/* Cena */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-party-300/10 flex items-center justify-center">
                  <Pizza size={16} className="text-party-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-200 text-sm">Cena</h3>
                    <span className="px-2.5 py-1 rounded-lg bg-party-300/20 text-party-300 font-bold text-xs whitespace-nowrap">
                      20€
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Pizze e cose del genere per tutti. Ciaccio si sta occupando di prendere il DJ con l'impianto 🎶 e l'alcol ovviamente. 🍸
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DOMENICA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-5 border border-white/10 overflow-hidden relative"
          >
            {/* Header con icona */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-xl bg-gray-500/10">
                <Plane size={20} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-400 text-lg">DOMENICA 11</h2>
                <p className="text-xs text-gray-400">Chill e partenza</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <Plane size={16} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-200 text-sm mb-1">Chill e partenza</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Chill, island vibes e finalmente ce ne andiamo a casa ✈️
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-5 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-xl bg-gradient-to-br from-coral-500/20 to-party-300/20">
                <Music size={18} className="text-coral-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Questo a grandi linee è l'idea di Ciaccio, spera che vi piaccia, sta lavorando per mettere insieme tutti i pezzi 👀 e piano piano la cosa sta prendendo forma.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
  );
};
