import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Calendar, Clock, Users } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Squadra } from '../types';

type TipoGara = '1v1' | 'tutti' | '1v1v1';

interface GiocoTemplate {
  nome: string;
  descrizione: string | null;
  emoji: string | null;
}

interface CreaGaraModalProps {
  squadre: Squadra[];
  onClose: () => void;
  onCreate: (gara: {
    nome: string;
    descrizione: string;
    squadra_a_id: string;
    squadra_b_id: string;
    squadre_ids: string[]; // Tutte le squadre partecipanti
    punti_in_palio: number;
    orario: string;
    giorno: number;
  }) => Promise<void>;
}

export const CreaGaraModal: React.FC<CreaGaraModalProps> = ({
  squadre,
  onClose,
  onCreate,
}) => {
  const [giochiDisponibili, setGiochiDisponibili] = useState<GiocoTemplate[]>([]);
  const [isLoadingGiochi, setIsLoadingGiochi] = useState(true);
  const [selectedGioco, setSelectedGioco] = useState<string>('');
  const [tipoGara, setTipoGara] = useState<TipoGara>('1v1');
  const [squadraA, setSquadraA] = useState<string>('');
  const [squadraB, setSquadraB] = useState<string>('');
  const [squadraC, setSquadraC] = useState<string>('');
  const [squadreSelezionate, setSquadreSelezionate] = useState<Set<string>>(new Set());
  const [puntiInPalio, setPuntiInPalio] = useState<string>('50');
  const [giorno, setGiorno] = useState<number>(1);
  const [orario, setOrario] = useState<string>('');
  const [creating, setCreating] = useState(false);

  // Carica giochi da giochi_template
  useEffect(() => {
    const loadGiochi = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoadingGiochi(false);
        return;
      }

      try {
        const { data, error } = await (supabase
          .from('giochi_template') as any)
          .select('nome, descrizione, emoji')
          .order('nome', { ascending: true });

        if (error) throw error;

        if (data) {
          setGiochiDisponibili(data.map((g: any) => ({
            nome: g.nome,
            descrizione: g.descrizione || '',
            emoji: g.emoji || '🎯'
          })));
        }
      } catch (error) {
        console.error('Errore caricamento giochi:', error);
      } finally {
        setIsLoadingGiochi(false);
      }
    };

    loadGiochi();
  }, []);

  const giocoSelezionato = giochiDisponibili.find(g => g.nome === selectedGioco);

  const handleCreate = async () => {
    let squadreIds: string[] = [];

    if (tipoGara === '1v1') {
      if (!selectedGioco || !squadraA || !squadraB || !orario) {
        alert('Compila tutti i campi obbligatori');
        return;
      }
      if (squadraA === squadraB) {
        alert('Seleziona due squadre diverse');
        return;
      }
      squadreIds = [squadraA, squadraB];
    } else if (tipoGara === '1v1v1') {
      if (!selectedGioco || !squadraA || !squadraB || !squadraC || !orario) {
        alert('Compila tutti i campi obbligatori');
        return;
      }
      if (squadraA === squadraB || squadraA === squadraC || squadraB === squadraC) {
        alert('Seleziona tre squadre diverse');
        return;
      }
      squadreIds = [squadraA, squadraB, squadraC];
    } else if (tipoGara === 'tutti') {
      if (!selectedGioco || squadreSelezionate.size < 2 || !orario) {
        alert('Seleziona almeno 2 squadre');
        return;
      }
      squadreIds = Array.from(squadreSelezionate);
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
        squadra_a_id: squadreIds[0] || '',
        squadra_b_id: squadreIds[1] || '',
        squadre_ids: squadreIds,
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
          className="w-full max-w-md glass-strong rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ minWidth: 0, maxWidth: '100%' }}
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
              {isLoadingGiochi ? (
                <div className="w-full input text-center text-gray-400 py-2">
                  Caricamento giochi...
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Tipo Gara */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                <Users size={14} />
                Tipo Gara *
              </label>
              <select
                value={tipoGara}
                onChange={(e) => {
                  setTipoGara(e.target.value as TipoGara);
                  setSquadraA('');
                  setSquadraB('');
                  setSquadraC('');
                  setSquadreSelezionate(new Set());
                }}
                className="w-full input"
              >
                <option value="1v1">1 contro 1</option>
                <option value="1v1v1">1 contro 1 contro 1 (3 squadre)</option>
                <option value="tutti">Tutti contro tutti</option>
              </select>
            </div>

            {/* Squadre - Dinamico in base al tipo */}
            {tipoGara === '1v1' && (
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
            )}

            {tipoGara === '1v1v1' && (
              <div className="grid grid-cols-3 gap-2">
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
                <div>
                  <label className="block text-sm font-semibold mb-2">Squadra C *</label>
                  <select
                    value={squadraC}
                    onChange={(e) => setSquadraC(e.target.value)}
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
            )}

            {tipoGara === 'tutti' && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Seleziona Squadre * (minimo 2)
                </label>
                <div className="max-h-48 overflow-y-auto scrollbar-hide border border-white/10 rounded-lg p-2 space-y-1">
                  {squadre.map((s) => {
                    const isSelected = squadreSelezionate.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-turquoise-500/20 border border-turquoise-500/40'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(squadreSelezionate);
                            if (e.target.checked) {
                              newSet.add(s.id);
                            } else {
                              newSet.delete(s.id);
                            }
                            setSquadreSelezionate(newSet);
                          }}
                          className="rounded"
                        />
                        <span className="text-xl">{s.emoji}</span>
                        <span className="text-xs flex-1">{s.nome}</span>
                      </label>
                    );
                  })}
                </div>
                {squadreSelezionate.size > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {squadreSelezionate.size} squadra{squadreSelezionate.size > 1 ? 'e' : ''} selezionata{squadreSelezionate.size > 1 ? 'e' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Giorno e Orario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="min-w-0">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  Giorno *
                </label>
                <select
                  value={giorno}
                  onChange={(e) => setGiorno(parseInt(e.target.value))}
                  className="w-full input"
                  style={{ minWidth: 0 }}
                >
                  <option value={1}>Giorno 1</option>
                  <option value={2}>Giorno 2</option>
                  <option value={3}>Giorno 3</option>
                </select>
              </div>
              <div className="min-w-0 flex-shrink">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1">
                  <Clock size={14} />
                  Orario *
                </label>
                <input
                  type="time"
                  value={orario}
                  onChange={(e) => setOrario(e.target.value)}
                  className="w-full input"
                  required
                  style={{ minWidth: 0, maxWidth: '100%', width: '100%' }}
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
              disabled={
                creating ||
                !selectedGioco ||
                !orario ||
                (tipoGara === '1v1' && (!squadraA || !squadraB)) ||
                (tipoGara === '1v1v1' && (!squadraA || !squadraB || !squadraC)) ||
                (tipoGara === 'tutti' && squadreSelezionate.size < 2)
              }
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



