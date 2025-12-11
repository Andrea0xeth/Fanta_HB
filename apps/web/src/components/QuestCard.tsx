import React, { useState } from 'react';
import { Clock, Camera, Video, FileText, ChevronRight, Check } from 'lucide-react';
import type { Quest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestCardProps {
  quest: Quest;
  onSubmit: (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string) => void;
  completed?: boolean;
}

const difficultyColors = {
  facile: 'bg-green-500/20 text-green-400',
  media: 'bg-yellow-500/20 text-yellow-400',
  difficile: 'bg-orange-500/20 text-orange-400',
  epica: 'bg-purple-500/20 text-purple-400',
};

const difficultyLabels = {
  facile: 'Facile',
  media: 'Media',
  difficile: 'Difficile',
  epica: 'Epica',
};

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onSubmit, completed }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<'foto' | 'video' | 'testo' | null>(null);
  const [proofText, setProofText] = useState('');
  
  const timeRemaining = () => {
    const diff = new Date(quest.scadenza).getTime() - Date.now();
    if (diff <= 0) return 'Scaduta';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleProofSubmit = () => {
    if (selectedType === 'testo' && proofText) {
      onSubmit(quest.id, 'testo', proofText);
    } else if (selectedType) {
      // Simulate file upload
      onSubmit(quest.id, selectedType, 'https://example.com/proof');
    }
    setIsExpanded(false);
    setSelectedType(null);
    setProofText('');
  };

  if (completed) {
    return (
      <motion.div 
        layout
        className="card border-green-500/30"
        style={{ background: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.3)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-xl flex-shrink-0">
            <Check className="text-green-400" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-green-400 line-through opacity-70 text-sm truncate">
              {quest.emoji} {quest.titolo}
            </h3>
            <p className="text-[10px] text-gray-500">Completata! +{quest.punti}pts</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="card-interactive"
      onClick={() => !isExpanded && setIsExpanded(true)}
    >
      {/* Header - Compact */}
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coral-500/20 to-party-300/20 flex items-center justify-center text-xl flex-shrink-0">
          {quest.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold truncate text-sm">{quest.titolo}</h3>
            <span className={`badge ${difficultyColors[quest.difficolta]} flex-shrink-0`}>
              {difficultyLabels[quest.difficolta]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="text-party-300 font-semibold">{quest.punti}pts</span>
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {timeRemaining()}
            </span>
          </div>
        </div>
        <ChevronRight 
          className={`text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
          size={16} 
        />
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 mt-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{quest.descrizione}</p>
              
              {/* Proof Type Selection - Compact */}
              <div className="flex gap-1.5 mb-3">
                {quest.tipo_prova.includes('foto') && (
                  <button
                    onClick={() => setSelectedType('foto')}
                    className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'foto' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-gray-400'
                    }`}
                  >
                    <Camera size={16} />
                    <span className="text-[10px]">Foto</span>
                  </button>
                )}
                {quest.tipo_prova.includes('video') && (
                  <button
                    onClick={() => setSelectedType('video')}
                    className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'video' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-gray-400'
                    }`}
                  >
                    <Video size={16} />
                    <span className="text-[10px]">Video</span>
                  </button>
                )}
                {quest.tipo_prova.includes('testo') && (
                  <button
                    onClick={() => setSelectedType('testo')}
                    className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'testo' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-gray-400'
                    }`}
                  >
                    <FileText size={16} />
                    <span className="text-[10px]">Testo</span>
                  </button>
                )}
              </div>

              {/* Text input for text proofs */}
              {selectedType === 'testo' && (
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Descrivi la tua prova..."
                  className="input mb-3 min-h-[80px] resize-none text-sm"
                />
              )}

              {/* Submit button - Compact */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="btn-ghost flex-1 text-sm py-2"
                >
                  Annulla
                </button>
                <button
                  onClick={handleProofSubmit}
                  disabled={!selectedType || (selectedType === 'testo' && !proofText)}
                  className="btn-primary flex-1 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedType === 'testo' ? 'Invia' : 'Carica'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
