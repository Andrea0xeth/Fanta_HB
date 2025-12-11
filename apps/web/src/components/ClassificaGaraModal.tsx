import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Check } from 'lucide-react';
import type { Gara, Squadra } from '../types';

interface ClassificaGaraModalProps {
  gara: Gara;
  squadre: Squadra[];
  onClose: () => void;
  onSave: (classifiche: Array<{squadra_id: string, posizione: number}>) => Promise<void>;
}

export const ClassificaGaraModal: React.FC<ClassificaGaraModalProps> = ({
  gara,
  onClose,
  onSave,
}) => {
  // Squadre partecipanti (per ora solo A e B, ma può essere esteso)
  const squadrePartecipanti = [
    gara.squadra_a,
    gara.squadra_b,
    ...(gara.squadre_partecipanti || []),
  ].filter((s, index, self) => 
    s && self.findIndex(s2 => s2?.id === s.id) === index
  ) as Squadra[];

  const [classifiche, setClassifiche] = useState<Array<{squadra_id: string, posizione: number}>>(
    squadrePartecipanti.map((s, index) => ({
      squadra_id: s.id,
      posizione: index + 1,
    }))
  );
  const [saving, setSaving] = useState(false);

  const handlePosizioneChange = (squadraId: string, nuovaPosizione: number) => {
    // Verifica che la posizione sia valida
    if (nuovaPosizione < 1 || nuovaPosizione > squadrePartecipanti.length) return;

    // Trova se c'è già una squadra con questa posizione
    const existingIndex = classifiche.findIndex(c => c.posizione === nuovaPosizione && c.squadra_id !== squadraId);
    
    if (existingIndex !== -1) {
      // Scambia le posizioni
      const oldPosizione = classifiche.find(c => c.squadra_id === squadraId)?.posizione || 1;
      setClassifiche(prev => prev.map(c => {
        if (c.squadra_id === squadraId) {
          return { ...c, posizione: nuovaPosizione };
        }
        if (c.squadra_id === classifiche[existingIndex].squadra_id) {
          return { ...c, posizione: oldPosizione };
        }
        return c;
      }));
    } else {
      // Aggiorna solo questa squadra
      setClassifiche(prev => prev.map(c => 
        c.squadra_id === squadraId ? { ...c, posizione: nuovaPosizione } : c
      ));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(classifiche);
      onClose();
    } catch (error) {
      console.error('Errore salvataggio classifica:', error);
      alert('Errore durante il salvataggio della classifica');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md glass-strong rounded-3xl p-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-party-300" size={24} />
              Classifica: {gara.nome}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Definisci la classifica finale. I punti verranno distribuiti automaticamente in base alla posizione.
          </p>

          <div className="space-y-3 mb-4">
            {squadrePartecipanti.map((squadra) => {
              const classifica = classifiche.find(c => c.squadra_id === squadra.id);
              const posizione = classifica?.posizione || 1;
              
              return (
                <div
                  key={squadra.id}
                  className="card flex items-center gap-3 p-3"
                >
                  <div className="text-2xl">{squadra.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{squadra.nome}</div>
                    <div className="text-xs text-gray-500">
                      {posizione === 1 && '🥇 Primo'}
                      {posizione === 2 && '🥈 Secondo'}
                      {posizione === 3 && '🥉 Terzo'}
                      {posizione > 3 && `${posizione}° posto`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Posizione:</label>
                    <select
                      value={posizione}
                      onChange={(e) => handlePosizioneChange(squadra.id, parseInt(e.target.value))}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white"
                    >
                      {squadrePartecipanti.map((_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}°
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl glass border border-gray-700 text-gray-400 font-semibold text-sm"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-coral-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Salva Classifica
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
