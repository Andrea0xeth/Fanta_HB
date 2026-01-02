import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Trophy, Flame } from 'lucide-react';
import type { Squadra } from '../types';
import { Avatar } from './Avatar';

type MemberLite = {
  id: string;
  nickname: string;
  punti: number;
  avatar?: string;
};

interface SquadraModalProps {
  isOpen: boolean;
  squadra: Squadra;
  posizione?: number;
  gareVinte?: number;
  members: MemberLite[];
  onClose: () => void;
  onSelectMember: (userId: string) => void;
}

export const SquadraModal: React.FC<SquadraModalProps> = ({
  isOpen,
  squadra,
  posizione,
  gareVinte,
  members,
  onClose,
  onSelectMember,
}) => {
  if (!isOpen) return null;

  const avg = members.length > 0 ? Math.round(members.reduce((a, m) => a + m.punti, 0) / members.length) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="w-full glass-strong rounded-t-3xl overflow-hidden flex flex-col mb-20 max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-3xl">{squadra.emoji}</div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-white truncate">{squadra.nome}</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-2">
                  {posizione ? (
                    <span className="inline-flex items-center gap-1">
                      <Trophy size={10} /> #{posizione}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1">
                    <Users size={10} /> {members.length} membri
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" aria-label="Chiudi">
              <X size={20} />
            </button>
          </div>

          {/* Stats */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                <div className="text-[10px] text-gray-400">Punti squadra</div>
                <div className="text-base font-bold text-party-300 flex items-center justify-center gap-1">
                  <Flame size={14} />
                  {squadra.punti_squadra}
                </div>
              </div>
              <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                <div className="text-[10px] text-gray-400">Gare vinte</div>
                <div className="text-base font-bold text-turquoise-400">{gareVinte ?? '—'}</div>
              </div>
              <div className="border border-white/10 rounded-2xl bg-white/5 px-3 py-2 text-center">
                <div className="text-[10px] text-gray-400">Media membri</div>
                <div className="text-base font-bold text-coral-300">{avg}</div>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 pb-24">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Membri</div>
              <div className="text-[10px] text-gray-400">{members.length}</div>
            </div>
            <div className="space-y-1.5">
              {members.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => onSelectMember(m.id)}
                  className="w-full text-left flex items-center gap-2 py-2 border-l-2 border-gray-700/30 pl-2 hover:border-coral-500/40 transition-colors"
                >
                  <div className="w-5 text-center font-bold text-gray-500 text-[10px] flex-shrink-0">{idx + 1}</div>
                  <Avatar
                    user={{
                      id: m.id,
                      nickname: m.nickname,
                      avatar: m.avatar,
                      punti_personali: m.punti,
                      squadra_id: squadra.id,
                      is_admin: false,
                      created_at: '',
                    }}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-100 truncate">{m.nickname}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-bold text-turquoise-400 text-sm">{m.punti}</span>
                    <span className="text-gray-400 text-[10px] ml-0.5">pts</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


