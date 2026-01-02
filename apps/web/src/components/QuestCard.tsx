import React, { useEffect, useRef, useState } from 'react';
import { Clock, Camera, Video, FileText, ChevronRight, Check, Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Quest } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface QuestCardProps {
  quest: Quest;
  onSubmit: (questId: string, tipo: 'foto' | 'video' | 'testo', contenuto: string | File) => Promise<void>;
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
  const MIN_VOTES_FOR_VALIDATION = 10;
  const POSITIVE_THRESHOLD_PERCENT = 66;
  
  // Data/ora di attivazione per le sfide speciali: 08/01/2026 ore 15:20
  const SPECIAL_QUESTS_ACTIVATION_DATE = new Date('2026-01-08T15:20:00');
  
  // Controlla se la quest speciale è ancora bloccata
  const isSpecialQuestLocked = quest.is_special && new Date() < SPECIAL_QUESTS_ACTIVATION_DATE;

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<'foto' | 'video' | 'testo' | null>(null);
  const [proofText, setProofText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview performance: per file grandi (video) evitiamo base64 e usiamo object URL (blob:).
  // Cleanup: rilasciamo l'object URL quando cambia/unmount.
  useEffect(() => {
    return () => {
      if (filePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);
  
  const timeRemaining = () => {
    const diff = new Date(quest.scadenza).getTime() - Date.now();
    if (diff <= 0) return 'Scaduta';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione dimensione file (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError('Il file è troppo grande. Dimensione massima: 50MB');
      return;
    }

    // Validazione tipo file
    if (selectedType === 'foto' && !file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido');
      return;
    }
    if (selectedType === 'video' && !file.type.startsWith('video/')) {
      setError('Seleziona un file video valido');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Crea preview (istantaneo e leggero)
    setFilePreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleTypeSelect = (type: 'foto' | 'video' | 'testo') => {
    if (isSpecialQuestLocked) return;
    
    setSelectedType(type);
    setError(null);
    
    if (type === 'foto' || type === 'video') {
      // Reset file precedente
      setSelectedFile(null);
      setFilePreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
      // Trigger file input
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } else {
      // Reset file se si passa a testo
      setSelectedFile(null);
      setFilePreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProofSubmit = async () => {
    if (isUploading) return;
    
    setError(null);
    setSuccess(false);
    
    try {
      setIsUploading(true);

      if (selectedType === 'testo') {
        if (!proofText.trim()) {
          setError('Inserisci un testo per la prova');
          setIsUploading(false);
          return;
        }
        await onSubmit(quest.id, 'testo', proofText);
      } else if (selectedType === 'foto' || selectedType === 'video') {
        if (!selectedFile) {
          setError('Seleziona un file');
          setIsUploading(false);
          return;
        }
        await onSubmit(quest.id, selectedType, selectedFile);
      } else {
        setError('Seleziona un tipo di prova');
        setIsUploading(false);
        return;
      }

      // Successo!
      setSuccess(true);
      
      // Reset form dopo 2 secondi per mostrare il messaggio di successo
      setTimeout(() => {
        setIsExpanded(false);
        setSelectedType(null);
        setProofText('');
        setSelectedFile(null);
        setFilePreview((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
        setSuccess(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento della prova');
      setSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Reset quando si chiude
    if (isExpanded) {
      setSelectedType(null);
      setProofText('');
      setSelectedFile(null);
      setFilePreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      setSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (completed) {
    const votiTotali = quest.prova?.voti_totali ?? 0;
    const votiPositivi = quest.prova?.voti_positivi ?? 0;
    const percentuale = votiTotali > 0 ? Math.round((votiPositivi / votiTotali) * 100) : 0;
    const hasMinVotes = votiTotali >= MIN_VOTES_FOR_VALIDATION;
    const hasThreshold = percentuale >= POSITIVE_THRESHOLD_PERCENT;
    const isValidata = quest.prova?.stato === 'validata';
    const isRifiutata = quest.prova?.stato === 'rifiutata';

    return (
      <motion.div 
        layout
        className="border-l-2 border-turquoise-500/50 pl-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Check className="text-turquoise-400" size={16} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-turquoise-400 text-sm truncate">
              {quest.emoji} {quest.titolo}
            </h3>
            <p className="text-[10px] text-gray-400">
              {isValidata
                ? '✅ Validata: punti assegnati'
                : isRifiutata
                  ? '❌ Rifiutata'
                  : 'Prova inviata! In attesa di verifica'}
            </p>
          </div>
        </div>

        {/* Contatore voti / soglia */}
        {quest.prova && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>
                Voti <span className="text-gray-200 font-semibold">{votiTotali}</span>/{MIN_VOTES_FOR_VALIDATION}
              </span>
              <span>
                Positivi <span className="text-gray-200 font-semibold">{votiPositivi}</span> ({percentuale}%)
              </span>
            </div>

            <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, percentuale)}%` }}
                className={`h-full ${hasMinVotes && hasThreshold ? 'bg-green-500' : 'bg-coral-500'}`}
              />
            </div>

            <p className="mt-1 text-[10px] text-gray-400">
              {!hasMinVotes
                ? `Servono ${MIN_VOTES_FOR_VALIDATION} voti (mancano ${MIN_VOTES_FOR_VALIDATION - votiTotali})`
                : hasThreshold
                  ? '✅ Soglia raggiunta (≥66%)'
                  : `Serve ≥66% positivi (ancora ${POSITIVE_THRESHOLD_PERCENT - percentuale}%)`}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className={`border-l-2 pl-3 py-2 transition-colors ${
        isSpecialQuestLocked 
          ? 'border-gray-800/50 opacity-60' 
          : 'border-gray-700/50 hover:border-coral-500/50'
      }`}
    >
      {/* Header - Snello */}
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <span className="text-xl">{quest.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold truncate text-sm">{quest.titolo}</h3>
            <span className={`badge ${difficultyColors[quest.difficolta]} flex-shrink-0 text-[10px] px-1.5 py-0.5`}>
              {difficultyLabels[quest.difficolta]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="text-party-300 font-semibold">{quest.punti}pts</span>
            {!isSpecialQuestLocked ? (
              <span className="flex items-center gap-0.5">
                <Clock size={10} />
                {timeRemaining()}
              </span>
            ) : (
              <span className="text-coral-500 font-semibold">
                Disponibile dal 08/01/2026 ore 15:20
              </span>
            )}
          </div>
        </div>
        <ChevronRight 
          className={`text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
          size={14} 
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
            <div className="pt-2 mt-2 border-t border-gray-700/30">
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">{quest.descrizione}</p>

              {/* Messaggio di blocco per quest speciali */}
              {isSpecialQuestLocked && (
                <div className="mb-3 px-3 py-2 rounded-xl border border-coral-500/30 bg-coral-500/10">
                  <p className="text-[11px] text-coral-400 leading-snug text-center">
                    ⏰ Questa sfida speciale sarà disponibile dal <span className="font-semibold text-coral-300">08/01/2026 alle ore 15:20</span>
                  </p>
                </div>
              )}

              {/* Nota sistema votazione */}
              <div className="mb-3 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
                <p className="text-[11px] text-gray-300 leading-snug">
                  Nota: i punti vengono assegnati solo se la prova raggiunge <span className="font-semibold text-gray-100">almeno 10 voti</span>{' '}
                  e una percentuale positiva ≥ <span className="font-semibold text-gray-100">66%</span>.
                </p>
              </div>
              
              {/* Success message - Improved */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-400 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <p className="text-green-400 font-semibold text-base">Caricamento completato!</p>
                        <p className="text-green-400/80 text-sm mt-1">
                          {selectedType === 'foto' && 'La tua foto è stata caricata con successo'}
                          {selectedType === 'video' && 'Il tuo video è stato caricato con successo'}
                          {selectedType === 'testo' && 'Il tuo testo è stato inviato con successo'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message - Improved */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <p className="text-red-400 font-semibold text-base">Errore nel caricamento</p>
                        <p className="text-red-400/80 text-sm mt-1">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Proof Type Selection - Improved spacing */}
              <div className="flex gap-2 mb-4">
                {quest.tipo_prova.includes('foto') && (
                  <button
                    onClick={() => !isSpecialQuestLocked && handleTypeSelect('foto')}
                    disabled={isSpecialQuestLocked}
                    className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                      isSpecialQuestLocked
                        ? 'glass text-gray-600 cursor-not-allowed opacity-50'
                        : selectedType === 'foto' 
                          ? 'bg-coral-500 text-white shadow-lg' 
                          : 'glass text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Camera size={18} />
                    <span className="text-xs font-medium">Foto</span>
                  </button>
                )}
                {quest.tipo_prova.includes('video') && (
                  <button
                    onClick={() => !isSpecialQuestLocked && handleTypeSelect('video')}
                    disabled={isSpecialQuestLocked}
                    className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                      isSpecialQuestLocked
                        ? 'glass text-gray-600 cursor-not-allowed opacity-50'
                        : selectedType === 'video' 
                          ? 'bg-coral-500 text-white shadow-lg' 
                          : 'glass text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Video size={18} />
                    <span className="text-xs font-medium">Video</span>
                  </button>
                )}
                {quest.tipo_prova.includes('testo') && (
                  <button
                    onClick={() => !isSpecialQuestLocked && handleTypeSelect('testo')}
                    disabled={isSpecialQuestLocked}
                    className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                      isSpecialQuestLocked
                        ? 'glass text-gray-600 cursor-not-allowed opacity-50'
                        : selectedType === 'testo' 
                          ? 'bg-coral-500 text-white shadow-lg' 
                          : 'glass text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <FileText size={18} />
                    <span className="text-xs font-medium">Testo</span>
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedType === 'foto' ? 'image/*' : selectedType === 'video' ? 'video/*' : ''}
                onChange={handleFileSelect}
                disabled={isSpecialQuestLocked}
                className="hidden"
              />

              {/* File preview */}
              {filePreview && selectedFile && (
                <div className="mb-3 relative">
                  {selectedType === 'foto' ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="w-full rounded-xl object-cover max-h-48"
                    />
                  ) : (
                    <video 
                      src={filePreview} 
                      controls
                      className="w-full rounded-xl object-cover max-h-48"
                    />
                  )}
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                  >
                    <X size={14} />
                  </button>
                  <div className="mt-1 text-[10px] text-gray-400">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>
              )}

              {/* Text input for text proofs */}
              {selectedType === 'testo' && (
                <textarea
                  value={proofText}
                  onChange={(e) => !isSpecialQuestLocked && setProofText(e.target.value)}
                  placeholder="Descrivi la tua prova..."
                  disabled={isSpecialQuestLocked}
                  className="input mb-3 min-h-[80px] resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}

              {/* File selection prompt */}
              {(selectedType === 'foto' || selectedType === 'video') && !selectedFile && (
                <div className="mb-3 p-4 rounded-xl glass border-2 border-dashed border-gray-600 text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-xs text-gray-400">
                    {selectedType === 'foto' ? 'Clicca per selezionare una foto' : 'Clicca per selezionare un video'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Dimensione massima: 50MB</p>
                </div>
              )}

              {/* Submit button - Improved spacing */}
              <div className="flex gap-2">
                <button
                  onClick={handleToggleExpand}
                  disabled={isUploading}
                  className="btn-ghost flex-1 text-sm py-3 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleProofSubmit}
                  disabled={
                    isSpecialQuestLocked ||
                    isUploading || 
                    success ||
                    !selectedType || 
                    (selectedType === 'testo' && !proofText.trim()) ||
                    ((selectedType === 'foto' || selectedType === 'video') && !selectedFile)
                  }
                  className="btn-primary flex-1 text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>
                        {selectedType === 'foto' && 'Caricamento foto...'}
                        {selectedType === 'video' && 'Caricamento video...'}
                        {selectedType === 'testo' && 'Invio in corso...'}
                        {!selectedType && 'Caricamento...'}
                      </span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Completato!</span>
                    </>
                  ) : (
                    <span>{selectedType === 'testo' ? 'Invia' : 'Carica'}</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
