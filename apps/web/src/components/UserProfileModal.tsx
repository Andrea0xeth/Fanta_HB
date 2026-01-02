import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Flame } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { User } from '../types';
import { Avatar } from './Avatar';

type SquadraLite = Pick<Database['public']['Tables']['squadre']['Row'], 'id' | 'nome' | 'emoji' | 'punti_squadra'>;

interface UserProfileModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, userId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [squadra, setSquadra] = useState<SquadraLite | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    if (!isSupabaseConfigured()) {
      setError('Supabase non configurato');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      setProfile(null);
      setSquadra(null);
      try {
        // Fetch minimal user profile
        const { data: userRow, error: userErr } = await supabase
          .from('users')
          .select('id, nickname, nome, cognome, avatar, punti_personali, squadra_id, is_admin, created_at')
          .eq('id', userId)
          .single();

        if (userErr) throw userErr;
        if (!userRow) throw new Error('Utente non trovato');

        const u = userRow as Database['public']['Tables']['users']['Row'];
        const mapped: User = {
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
        };

        if (cancelled) return;
        setProfile(mapped);

        if (u.squadra_id) {
          const { data: squadraRow } = await supabase
            .from('squadre')
            .select('id, nome, emoji, punti_squadra')
            .eq('id', u.squadra_id)
            .single();
          if (!cancelled && squadraRow) setSquadra(squadraRow as SquadraLite);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Errore caricamento profilo');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

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
          className="glass-strong rounded-3xl p-5 max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-gray-200">Profilo</div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors" aria-label="Chiudi">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Caricamento…</div>
          ) : error ? (
            <div className="py-6 text-center text-red-300 text-sm">{error}</div>
          ) : profile ? (
            <div>
              <div className="flex items-center gap-3">
                <Avatar user={profile} size="lg" />
                <div className="min-w-0">
                  <div className="text-lg font-bold text-white truncate">{profile.nickname}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {[profile.nome, profile.cognome].filter(Boolean).join(' ') || '—'}
                  </div>
                  {squadra && (
                    <div className="mt-1 text-[11px] text-gray-300 flex items-center gap-1.5">
                      <Users size={12} className="text-gray-400" />
                      <span className="truncate">
                        {squadra.emoji} {squadra.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-gray-400">Punti personali</div>
                  <div className="text-base font-bold text-turquoise-400 flex items-center gap-1">
                    {profile.punti_personali}
                    <Flame size={14} className="text-party-300" />
                  </div>
                </div>
                <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2">
                  <div className="text-[10px] text-gray-400">Punti squadra</div>
                  <div className="text-base font-bold text-coral-300">
                    {squadra?.punti_squadra ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-sm">Nessun dato</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


