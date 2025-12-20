import React, { useState, useRef } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<'foto' | 'video' | 'testo' | null>(null);
  const [proofText, setProofText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

    // Crea preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTypeSelect = (type: 'foto' | 'video' | 'testo') => {
    setSelectedType(type);
    setError(null);
    
    if (type === 'foto' || type === 'video') {
      // Reset file precedente
      setSelectedFile(null);
      setFilePreview(null);
      // Trigger file input
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } else {
      // Reset file se si passa a testo
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
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
        setFilePreview(null);
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
      setFilePreview(null);
      setError(null);
      setSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (completed) {
    return (
      <motion.div 
        layout
        className="card border-turquoise-500/30"
        style={{ background: 'rgba(78, 205, 196, 0.08)', borderColor: 'rgba(78, 205, 196, 0.3)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-turquoise-500/20 flex items-center justify-center text-xl flex-shrink-0">
            <Check className="text-turquoise-400" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-turquoise-400 text-sm truncate">
              {quest.emoji} {quest.titolo}
            </h3>
            <p className="text-[10px] text-muted">Prova inviata! In attesa di verifica</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className="card-interactive"
    >
      {/* Header - Compact */}
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={handleToggleExpand}
      >
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
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <span className="text-party-300 font-semibold">{quest.punti}pts</span>
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {timeRemaining()}
            </span>
          </div>
        </div>
        <ChevronRight 
          className={`text-white/60 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
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
              <p className="text-xs text-muted mb-3 leading-relaxed">{quest.descrizione}</p>
              
              {/* Success message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-green-400 flex-shrink-0" size={18} />
                      <div className="flex-1">
                        <p className="text-green-400 font-semibold text-sm">Caricamento completato!</p>
                        <p className="text-green-400/80 text-xs mt-0.5">
                          {selectedType === 'foto' && 'La tua foto è stata caricata con successo'}
                          {selectedType === 'video' && 'Il tuo video è stato caricato con successo'}
                          {selectedType === 'testo' && 'Il tuo testo è stato inviato con successo'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                      <div className="flex-1">
                        <p className="text-red-400 font-semibold text-sm">Errore nel caricamento</p>
                        <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Proof Type Selection - Compact */}
              <div className="flex gap-1.5 mb-3">
                {quest.tipo_prova.includes('foto') && (
                  <button
                    onClick={() => handleTypeSelect('foto')}
                    className={`flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'foto' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-white/80'
                    }`}
                  >
                    <Camera size={16} />
                    <span className="text-[10px]">Foto</span>
                  </button>
                )}
                {quest.tipo_prova.includes('video') && (
                  <button
                    onClick={() => handleTypeSelect('video')}
                    className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'video' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-white/80'
                    }`}
                  >
                    <Video size={16} />
                    <span className="text-[10px]">Video</span>
                  </button>
                )}
                {quest.tipo_prova.includes('testo') && (
                  <button
                    onClick={() => handleTypeSelect('testo')}
                    className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                      selectedType === 'testo' 
                        ? 'bg-coral-500 text-white' 
                        : 'glass text-white/80'
                    }`}
                  >
                    <FileText size={16} />
                    <span className="text-[10px]">Testo</span>
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedType === 'foto' ? 'image/*' : selectedType === 'video' ? 'video/*' : ''}
                onChange={handleFileSelect}
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
                  <div className="mt-1 text-[10px] text-subtle">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                </div>
              )}

              {/* Text input for text proofs */}
              {selectedType === 'testo' && (
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Descrivi la tua prova..."
                  className="input mb-3 min-h-[80px] resize-none text-sm"
                />
              )}

              {/* File selection prompt */}
              {(selectedType === 'foto' || selectedType === 'video') && !selectedFile && (
                <div className="mb-3 p-4 rounded-xl glass border-2 border-dashed border-gray-600 text-center">
                  <Upload className="mx-auto mb-2 text-white/70" size={24} />
                  <p className="text-xs text-muted">
                    {selectedType === 'foto' ? 'Clicca per selezionare una foto' : 'Clicca per selezionare un video'}
                  </p>
                  <p className="text-[10px] text-subtle mt-1">Dimensione massima: 50MB</p>
                </div>
              )}

              {/* Submit button - Compact */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleToggleExpand}
                  disabled={isUploading}
                  className="btn-ghost flex-1 text-sm py-2 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleProofSubmit}
                  disabled={
                    isUploading || 
                    success ||
                    !selectedType || 
                    (selectedType === 'testo' && !proofText.trim()) ||
                    ((selectedType === 'foto' || selectedType === 'video') && !selectedFile)
                  }
                  className="btn-primary flex-1 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>
                        {selectedType === 'foto' && 'Caricamento foto...'}
                        {selectedType === 'video' && 'Caricamento video...'}
                        {selectedType === 'testo' && 'Invio in corso...'}
                        {!selectedType && 'Caricamento...'}
                      </span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={14} />
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
