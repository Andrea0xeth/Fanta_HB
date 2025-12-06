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
        className="card border-green-500/30 bg-green-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
            <Check className="text-green-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-400 line-through opacity-70">
              {quest.emoji} {quest.titolo}
            </h3>
            <p className="text-sm text-gray-500">Completata! +{quest.punti}pts</p>
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-500/20 to-party-300/20 flex items-center justify-center text-2xl">
          {quest.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{quest.titolo}</h3>
            <span className={`badge ${difficultyColors[quest.difficolta]}`}>
              {difficultyLabels[quest.difficolta]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-party-300 font-semibold">{quest.punti}pts</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeRemaining()}
            </span>
          </div>
        </div>
        <ChevronRight 
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          size={20} 
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
            <div className="pt-4 mt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-4">{quest.descrizione}</p>
              
              {/* Proof Type Selection */}
              <div className="flex gap-2 mb-4">
                {quest.tipo_prova.includes('foto') && (
                  <button
                    onClick={() => setSelectedType('foto')}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedType === 'foto' 
                        ? 'bg-coral-500 text-white' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Camera size={20} />
                    <span className="text-xs">Foto</span>
                  </button>
                )}
                {quest.tipo_prova.includes('video') && (
                  <button
                    onClick={() => setSelectedType('video')}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedType === 'video' 
                        ? 'bg-coral-500 text-white' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Video size={20} />
                    <span className="text-xs">Video</span>
                  </button>
                )}
                {quest.tipo_prova.includes('testo') && (
                  <button
                    onClick={() => setSelectedType('testo')}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      selectedType === 'testo' 
                        ? 'bg-coral-500 text-white' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <FileText size={20} />
                    <span className="text-xs">Testo</span>
                  </button>
                )}
              </div>

              {/* Text input for text proofs */}
              {selectedType === 'testo' && (
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Descrivi la tua prova..."
                  className="input mb-4 min-h-[100px] resize-none"
                />
              )}

              {/* Submit button */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="btn-ghost flex-1"
                >
                  Annulla
                </button>
                <button
                  onClick={handleProofSubmit}
                  disabled={!selectedType || (selectedType === 'testo' && !proofText)}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedType === 'testo' ? 'Invia Prova' : 'Carica Prova'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
