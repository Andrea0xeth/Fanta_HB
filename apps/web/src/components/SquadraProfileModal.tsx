import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Flame } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { Squadra, User } from '../types';
import { Avatar } from './Avatar';

interface SquadraProfileModalProps {
  isOpen: boolean;
  squadraId: string | null;
  onClose: () => void;
}

export const SquadraProfileModal: React.FC<SquadraProfileModalProps> = ({ isOpen, squadraId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [squadra, setSquadra] = useState<Squadra | null>(null);
  const [membri, setMembri] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !squadraId) return;
    if (!isSupabaseConfigured()) {
      setError('Supabase non configurato');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setSquadra(null);
      setMembri([]);
      try {
        // Fetch squadra
        const { data: squadraRow, error: squadraErr } = await supabase
          .from('squadre')
          .select('*')
          .eq('id', squadraId)
          .single();

        if (squadraErr) throw squadraErr;
        if (!squadraRow) throw new Error('Squadra non trovata');

        const s = squadraRow as Database['public']['Tables']['squadre']['Row'];
        const mappedSquadra: Squadra = {
          id: s.id,
          nome: s.nome,
          emoji: s.emoji,
          punti_squadra: s.punti_squadra,
          colore: s.colore,
          membri: [],
        };

        if (cancelled) return;
        setSquadra(mappedSquadra);

        // Fetch membri della squadra
        const { data: membriData, error: membriErr } = await supabase
          .from('users')
          .select('id, nickname, nome, cognome, email, telefono, data_nascita, avatar, passkey_id, punti_personali, squadra_id, is_admin, created_at')
          .eq('squadra_id', squadraId)
          .order('punti_personali', { ascending: false });

        if (membriErr) throw membriErr;

        const mappedMembri: User[] = (membriData || []).map((u: Database['public']['Tables']['users']['Row']) => ({
          id: u.id,
          nickname: u.nickname,
          nome: u.nome || undefined,
          cognome: u.cognome || undefined,
          email: u.email || undefined,
          telefono: u.telefono || undefined,
          data_nascita: u.data_nascita || undefined,
          avatar: u.avatar || undefined,
          passkey_id: u.passkey_id || undefined,
          squadra_id: u.squadra_id,
          punti_personali: u.punti_personali || 0,
          is_admin: Boolean(u.is_admin),
          created_at: u.created_at,
        }));

        if (!cancelled) {
          setMembri(mappedMembri);
          // Aggiorna anche la squadra con i membri
          setSquadra({ ...mappedSquadra, membri: mappedMembri });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Errore caricamento squadra');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, squadraId]);

  if (!isOpen || !squadraId) return null;

  const avgPunti = membri.length > 0 
    ? Math.round(membri.reduce((sum, m) => sum + m.punti_personali, 0) / membri.length) 
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-strong rounded-3xl p-5 max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-200">Squadra</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" aria-label="Chiudi">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Caricamento…</div>
          ) : error ? (
            <div className="py-6 text-center text-red-300 text-sm">{error}</div>
          ) : squadra ? (
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Header Squadra */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: `${squadra.colore}20` }}
                >
                  {squadra.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold text-white truncate">{squadra.nome}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      {membri.length} membri
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400">Punti squadra</div>
                  <div className="text-base font-bold text-turquoise-400 flex items-center justify-center gap-1">
                    <Flame size={14} className="text-party-300" />
                    {squadra.punti_squadra}
                  </div>
                </div>
                <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400">Membri</div>
                  <div className="text-base font-bold text-coral-300">{membri.length}</div>
                </div>
                <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] text-gray-400">Media punti</div>
                  <div className="text-base font-bold text-party-300">{avgPunti}</div>
                </div>
              </div>

              {/* Membri */}
              {membri.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-gray-300 mb-2">Membri</div>
                  <div className="space-y-1.5">
                    {membri.map((membro, index) => (
                      <div
                        key={membro.id}
                        className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-gray-700/30"
                      >
                        <div className="w-5 text-center font-bold text-gray-500 text-[10px] flex-shrink-0">
                          {index + 1}
                        </div>
                        <Avatar user={membro} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-100 truncate">{membro.nickname}</div>
                          {(membro.nome || membro.cognome) && (
                            <div className="text-[10px] text-gray-400 truncate">
                              {[membro.nome, membro.cognome].filter(Boolean).join(' ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-turquoise-400 text-sm">{membro.punti_personali}</span>
                          <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500 text-sm">Nessun membro</div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-sm">Nessun dato</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
