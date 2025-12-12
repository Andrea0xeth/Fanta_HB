import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Clock } from 'lucide-react';
import type { Squadra } from '../types';

interface CreaGaraModalProps {
  squadre: Squadra[];
  onClose: () => void;
  onCreate: (gara: {
    nome: string;
    descrizione: string;
    squadra_a_id: string;
    squadra_b_id: string;
    punti_in_palio: number;
    orario: string;
    giorno: number;
  }) => Promise<void>;
}

const giochiDisponibili = [
  { nome: 'Rubabandiera', descrizione: 'Due squadre allineate, l\'arbitro chiama un numero e i giocatori corrispondenti corrono per prendere la bandiera', emoji: '🚩' },
  { nome: 'Nascondino', descrizione: 'Un cercatore cerca gli altri giocatori nascosti prima che raggiungano la "tana"', emoji: '🫥' },
  { nome: 'Birrapong (Beer Pong)', descrizione: 'Adattato alla spiaggia con bicchieri in sabbia, si lancia la pallina nei bicchieri avversari', emoji: '🍺' },
  { nome: 'Bocce', descrizione: 'Due squadre lanciano le bocce cercando di avvicinarsi il più possibile al boccino', emoji: '🎳' },
  { nome: 'Beach Volley', descrizione: 'Pallavolo sulla sabbia, due squadre cercano di far cadere la palla nel campo avversario', emoji: '🏐' },
  { nome: 'Footvolley', descrizione: 'Come il beach volley ma senza usare le mani, solo piedi e testa', emoji: '⚽' },
  { nome: 'Beach Soccer', descrizione: 'Calcio sulla sabbia con squadre di 5 giocatori', emoji: '⚽' },
  { nome: 'Beach Tennis', descrizione: 'Tennis sulla sabbia con racchette e rete', emoji: '🎾' },
  { nome: 'Palla Prigioniera', descrizione: 'Due squadre si lanciano la palla per colpire gli avversari e farli prigionieri', emoji: '🏀' },
  { nome: 'Tiro alla Fune', descrizione: 'Due squadre tirano una corda in direzioni opposte', emoji: '🪢' },
  { nome: 'Frisbee / Ultimate Frisbee', descrizione: 'Lancio del disco tra i giocatori, con variante Ultimate che combina calcio e rugby', emoji: '🥏' },
  { nome: 'Kubb', descrizione: 'Gioco svedese che combina bowling e bocce, si lanciano bastoni per abbattere i kubb avversari', emoji: '🪵' },
  { nome: 'Roundnet (Spikeball)', descrizione: 'Due squadre di due giocatori colpiscono una palla su una rete a terra', emoji: '🎾' },
  { nome: 'Beach Rugby', descrizione: 'Rugby sulla sabbia con squadre di 5 giocatori', emoji: '🏉' },
  { nome: 'Beach Waterpolo', descrizione: 'Pallanuoto in mare in un\'area delimitata', emoji: '🏊' },
  { nome: 'Racchettoni', descrizione: 'Si usa una racchetta e una pallina, si cerca di mantenerla in aria il più a lungo possibile', emoji: '🏓' },
  { nome: 'Palla Avvelenata', descrizione: 'Variante della palla prigioniera con regole specifiche', emoji: '☠️' },
  { nome: 'Staffetta', descrizione: 'Gare di corsa a squadre con testimone da passare', emoji: '🏃' },
  { nome: 'Pallone', descrizione: 'Gioco tradizionale con palla da calciare e passare tra i giocatori', emoji: '⚽' },
  { nome: 'Caccia al Tesoro', descrizione: 'Squadre cercano oggetti nascosti seguendo indizi', emoji: '🗺️' },
];

export const CreaGaraModal: React.FC<CreaGaraModalProps> = ({
  squadre,
  onClose,
  onCreate,
}) => {
  const [selectedGioco, setSelectedGioco] = useState<string>('');
  const [squadraA, setSquadraA] = useState<string>('');
  const [squadraB, setSquadraB] = useState<string>('');
  const [puntiInPalio, setPuntiInPalio] = useState<string>('50');
  const [giorno, setGiorno] = useState<number>(1);
  const [orario, setOrario] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const giocoSelezionato = giochiDisponibili.find(g => g.nome === selectedGioco);

  const handleCreate = async () => {
    if (!selectedGioco || !squadraA || !squadraB || !orario) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    if (squadraA === squadraB) {
      alert('Seleziona due squadre diverse');
      return;
    }

    setCreating(true);
    try {
      // Crea la data/orario combinando giorno e orario
      const oggi = new Date();
      const [hours, minutes] = orario.split(':');
      const dataGara = new Date(oggi);
      dataGara.setDate(oggi.getDate() + (giorno - 1));
      dataGara.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await onCreate({
        nome: selectedGioco,
        descrizione: giocoSelezionato?.descrizione || '',
        squadra_a_id: squadraA,
        squadra_b_id: squadraB,
        punti_in_palio: parseInt(puntiInPalio),
        orario: dataGara.toISOString(),
        giorno,
      });
      onClose();
    } catch (error) {
      console.error('Errore creazione gara:', error);
      alert('Errore durante la creazione della gara');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-strong rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{ minWidth: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="text-coral-500" size={24} />
              Crea Nuova Gara
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Selezione Gioco */}
            <div>
              <label className="block text-sm font-semibold mb-2">Gioco *</label>
              <select
                value={selectedGioco}
                onChange={(e) => setSelectedGioco(e.target.value)}
                className="w-full input"
              >
                <option value="">Seleziona un gioco...</option>
                {giochiDisponibili.map((gioco) => (
                  <option key={gioco.nome} value={gioco.nome}>
                    {gioco.emoji} {gioco.nome}
                  </option>
                ))}
              </select>
              {giocoSelezionato && (
                <p className="text-xs text-gray-400 mt-1">{giocoSelezionato.descrizione}</p>
              )}
            </div>

            {/* Squadre */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold mb-2">Squadra A *</label>
                <select
                  value={squadraA}
                  onChange={(e) => setSquadraA(e.target.value)}
                  className="w-full input"
                >
                  <option value="">Seleziona...</option>
                  {squadre.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Squadra B *</label>
                <select
                  value={squadraB}
                  onChange={(e) => setSquadraB(e.target.value)}
                  className="w-full input"
                >
                  <option value="">Seleziona...</option>
                  {squadre.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Giorno e Orario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  Giorno *
                </label>
                <select
                  value={giorno}
                  onChange={(e) => setGiorno(parseInt(e.target.value))}
                  className="w-full input"
                >
                  <option value={1}>Giorno 1</option>
                  <option value={2}>Giorno 2</option>
                  <option value={3}>Giorno 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                  <Clock size={14} />
                  Orario *
                </label>
                <input
                  type="time"
                  value={orario}
                  onChange={(e) => setOrario(e.target.value)}
                  className="w-full input min-w-0"
                  required
                  style={{ minWidth: 0 }}
                />
              </div>
            </div>

            {/* Punti in Palio */}
            <div>
              <label className="block text-sm font-semibold mb-2">Punti in Palio</label>
              <input
                type="number"
                value={puntiInPalio}
                onChange={(e) => setPuntiInPalio(e.target.value)}
                className="w-full input"
                min="1"
                placeholder="50"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl glass border border-gray-700 text-gray-400 font-semibold text-sm"
            >
              Annulla
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !selectedGioco || !squadraA || !squadraB || !orario}
              className="flex-1 py-2.5 rounded-xl bg-coral-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Creazione...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crea Gara
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};



