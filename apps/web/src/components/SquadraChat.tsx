import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Image, X, Trash2, Smile } from 'lucide-react';
import { supabase, isSupabaseConfigured, uploadChatPhoto } from '../lib/supabase';
import { Avatar } from './Avatar';
import type { User } from '../types';

interface UserLite {
  id: string;
  nickname: string;
  avatar?: string;
}

interface MessaggioChat {
  id: string;
  squadra_id: string;
  user_id: string;
  messaggio: string | null;
  foto_url: string | null;
  created_at: string;
  user?: UserLite;
}

interface ReazioneChat {
  id: string;
  messaggio_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

interface SquadraChatProps {
  squadraId: string;
  currentUser: User;
}

export const SquadraChat: React.FC<SquadraChatProps> = ({ squadraId, currentUser }) => {
  const [messaggi, setMessaggi] = useState<MessaggioChat[]>([]);
  const [nuovoMessaggio, setNuovoMessaggio] = useState('');
  const [fotoSelezionata, setFotoSelezionata] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reazioni, setReazioni] = useState<Record<string, ReazioneChat[]>>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  // Carica messaggi iniziali
  useEffect(() => {
    if (!isSupabaseConfigured() || !squadraId) return;

    const loadMessaggi = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await (supabase
          .from('messaggi_chat') as any)
          .select('*')
          .eq('squadra_id', squadraId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        // Carica le informazioni utente per ogni messaggio
        const messaggiConUser: MessaggioChat[] = await Promise.all(
          (data || []).map(async (msg: any) => {
            // Carica le info utente
            const { data: userData } = await (supabase
              .from('users') as any)
              .select('id, nickname, avatar')
              .eq('id', msg.user_id)
              .single();

            return {
              id: msg.id,
              squadra_id: msg.squadra_id,
              user_id: msg.user_id,
              messaggio: msg.messaggio || null,
              foto_url: msg.foto_url || null,
              created_at: msg.created_at,
              user: userData ? {
                id: (userData as any).id,
                nickname: (userData as any).nickname,
                avatar: (userData as any).avatar || undefined,
              } : undefined,
            };
          })
        );

        setMessaggi(messaggiConUser);
        
        // Carica reazioni per tutti i messaggi
        const messaggiIds = messaggiConUser.map(m => m.id);
        if (messaggiIds.length > 0) {
          const { data: reazioniData } = await (supabase
            .from('reazioni_chat') as any)
            .select('*')
            .in('messaggio_id', messaggiIds);
          
          if (reazioniData) {
            const reazioniMap: Record<string, ReazioneChat[]> = {};
            reazioniData.forEach((r: ReazioneChat) => {
              if (!reazioniMap[r.messaggio_id]) {
                reazioniMap[r.messaggio_id] = [];
              }
              reazioniMap[r.messaggio_id].push(r);
            });
            setReazioni(reazioniMap);
          }
        }
      } catch (e: any) {
        console.error('Errore caricamento messaggi:', e);
        setError(e?.message || 'Errore caricamento messaggi');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessaggi();
  }, [squadraId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !squadraId) return;

    const channel = supabase
      .channel(`squadra-chat-${squadraId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messaggi_chat',
          filter: `squadra_id=eq.${squadraId}`,
        },
        async (payload) => {
          // Carica le info utente per il nuovo messaggio
          const { data: userData } = await supabase
            .from('users')
            .select('id, nickname, avatar')
            .eq('id', payload.new.user_id)
            .single();

          const nuovoMessaggio: MessaggioChat = {
            id: payload.new.id as string,
            squadra_id: payload.new.squadra_id as string,
            user_id: payload.new.user_id as string,
            messaggio: payload.new.messaggio as string || null,
            foto_url: payload.new.foto_url as string || null,
            created_at: payload.new.created_at as string,
            user: userData ? {
              id: (userData as any).id,
              nickname: (userData as any).nickname,
              avatar: (userData as any).avatar || undefined,
            } : undefined,
          };

          setMessaggi((prev) => [...prev, nuovoMessaggio]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadraId]);

  // Setup realtime subscription per reazioni
  useEffect(() => {
    if (!isSupabaseConfigured() || !squadraId) return;

    const channel = supabase
      .channel(`squadra-chat-reazioni-${squadraId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reazioni_chat',
        },
        async (payload) => {
          // Ricarica tutte le reazioni per il messaggio
          const messaggioId = (payload.new as any)?.messaggio_id || (payload.old as any)?.messaggio_id;
          if (messaggioId) {
            const { data: reazioniData } = await (supabase
              .from('reazioni_chat') as any)
              .select('*')
              .eq('messaggio_id', messaggioId);
            
            if (reazioniData) {
              setReazioni(prev => ({
                ...prev,
                [messaggioId]: reazioniData
              }));
            } else {
              setReazioni(prev => {
                const newReazioni = { ...prev };
                delete newReazioni[messaggioId];
                return newReazioni;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadraId]);

  // Scroll automatico quando arrivano nuovi messaggi (solo se non è il caricamento iniziale)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // Al primo caricamento, scrolla senza animazione
      if (chatContainerRef.current && messagesEndRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        isInitialLoadRef.current = false;
        prevMessagesCountRef.current = messaggi.length;
      }
      return;
    }

    // Scroll solo se ci sono nuovi messaggi (non al caricamento iniziale)
    const hasNewMessages = messaggi.length > prevMessagesCountRef.current;
    if (hasNewMessages && chatContainerRef.current && messagesEndRef.current) {
      // Scrolla il container, non la pagina
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      prevMessagesCountRef.current = messaggi.length;
    }
  }, [messaggi]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verifica che sia un'immagine
    if (!file.type.startsWith('image/')) {
      setError('Seleziona solo file immagine');
      return;
    }

    // Verifica dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('L\'immagine è troppo grande (max 10MB)');
      return;
    }

    setFotoSelezionata(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFotoSelezionata(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReaction = async (messaggioId: string, emoji: string) => {
    if (!isSupabaseConfigured()) return;

    const existingReaction = reazioni[messaggioId]?.find(r => r.user_id === currentUser.id);
    
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        // Rimuovi reazione se è la stessa
        await (supabase.from('reazioni_chat') as any).delete().eq('id', existingReaction.id);
      } else {
        // Aggiorna reazione
        await (supabase.from('reazioni_chat') as any)
          .update({ emoji })
          .eq('id', existingReaction.id);
      }
    } else {
      // Aggiungi nuova reazione
      await (supabase.from('reazioni_chat') as any).insert({
        messaggio_id: messaggioId,
        user_id: currentUser.id,
        emoji
      });
    }
    
    setShowEmojiPicker(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!nuovoMessaggio.trim() && !fotoSelezionata) || isSending || isUploadingPhoto || !isSupabaseConfigured()) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      let fotoUrl: string | null = null;

      // Upload foto se presente
      if (fotoSelezionata) {
        setIsUploadingPhoto(true);
        try {
          fotoUrl = await uploadChatPhoto(fotoSelezionata, currentUser.id, squadraId);
        } catch (uploadError: any) {
          throw new Error(`Errore upload foto: ${uploadError?.message || 'Errore sconosciuto'}`);
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      // Invia messaggio
      const { error: insertError } = await (supabase
        .from('messaggi_chat') as any)
        .insert({
          squadra_id: squadraId,
          user_id: currentUser.id,
          messaggio: nuovoMessaggio.trim() || null,
          foto_url: fotoUrl,
        });

      if (insertError) throw insertError;

      setNuovoMessaggio('');
      handleRemovePhoto();
    } catch (e: any) {
      console.error('Errore invio messaggio:', e);
      setError(e?.message || 'Errore invio messaggio');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!isSupabaseConfigured() || deletingMessageId) return;
    
    const confirmDelete = window.confirm('Vuoi eliminare questo messaggio?');
    if (!confirmDelete) return;

    setDeletingMessageId(messageId);
    setError(null);

    try {
      const { error: deleteError } = await (supabase
        .from('messaggi_chat') as any)
        .delete()
        .eq('id', messageId)
        .eq('user_id', currentUser.id); // Solo i propri messaggi

      if (deleteError) throw deleteError;

      // Rimuovi il messaggio dalla lista locale
      setMessaggi((prev) => prev.filter((m) => m.id !== messageId));
    } catch (e: any) {
      console.error('Errore cancellazione messaggio:', e);
      setError(e?.message || 'Errore cancellazione messaggio');
    } finally {
      setDeletingMessageId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-turquoise-950/30 rounded-2xl border border-turquoise-500/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-turquoise-500/20 bg-turquoise-900/20">
        <MessageCircle size={18} className="text-turquoise-400" />
        <h3 className="text-sm font-semibold text-turquoise-200">Chat Squadra</h3>
      </div>

      {/* Messaggi */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 space-y-3 bg-turquoise-950/10"
      >
        {isLoading ? (
          <div className="text-center text-turquoise-300 text-sm py-8">Caricamento messaggi…</div>
        ) : error ? (
          <div className="text-center text-coral-300 text-sm py-8">{error}</div>
        ) : messaggi.length === 0 ? (
          <div className="text-center text-turquoise-400 text-sm py-8">
            <MessageCircle size={32} className="mx-auto mb-2 text-turquoise-500" />
            <p>Nessun messaggio ancora</p>
            <p className="text-xs text-turquoise-500 mt-1">Inizia la conversazione!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messaggi.map((msg) => {
              const isMine = msg.user_id === currentUser.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}
                >
                  {msg.user && (
                    <Avatar
                      user={msg.user}
                      size="sm"
                    />
                  )}
                  <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'} group relative`}>
                    {msg.user && (
                      <span className={`text-[10px] mb-0.5 px-1 ${isMine ? 'text-turquoise-300' : 'text-turquoise-300'}`}>
                        {msg.user.nickname}
                      </span>
                    )}
                    <div className="flex items-end gap-1.5">
                      <div
                        className={`rounded-2xl px-3 py-2 ${
                          isMine
                            ? 'bg-turquoise-500/20 text-turquoise-50 border border-turquoise-500/40'
                            : 'bg-coral-500/10 text-coral-100 border border-coral-500/20'
                        }`}
                      >
                        {msg.foto_url && (
                          <div className="mb-2 rounded-lg overflow-hidden">
                            <img
                              src={msg.foto_url}
                              alt="Foto chat"
                              className="max-w-full max-h-[300px] object-contain rounded-lg"
                              loading="lazy"
                            />
                          </div>
                        )}
                        {msg.messaggio && (
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.messaggio}</p>
                        )}
                      </div>
                      {isMine && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingMessageId === msg.id}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 disabled:opacity-50 transition-colors"
                          aria-label="Elimina messaggio"
                        >
                          {deletingMessageId === msg.id ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full"
                            />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] text-turquoise-400/70 mt-0.5 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                    {/* Reazioni */}
                    {reazioni[msg.id] && reazioni[msg.id].length > 0 && (
                      <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
                        {Object.entries(
                          reazioni[msg.id].reduce((acc, r) => {
                            if (!acc[r.emoji]) acc[r.emoji] = [];
                            acc[r.emoji].push(r);
                            return acc;
                          }, {} as Record<string, ReazioneChat[]>)
                        ).map(([emoji, reazioniEmoji]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] transition-colors ${
                              reazioniEmoji.some(r => r.user_id === currentUser.id)
                                ? 'bg-turquoise-500/30 border border-turquoise-500/50'
                                : 'bg-gray-700/50 border border-gray-600/30 hover:bg-gray-700/70'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-300">{reazioniEmoji.length}</span>
                          </button>
                        ))}
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                          className="px-1.5 py-0.5 rounded-full text-[11px] bg-gray-700/30 border border-gray-600/20 hover:bg-gray-700/50 transition-colors"
                        >
                          <Smile size={12} className="text-gray-400" />
                        </button>
                      </div>
                    )}
                    {(!reazioni[msg.id] || reazioni[msg.id].length === 0) && (
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                        className="mt-1 px-1.5 py-0.5 rounded-full text-[11px] bg-gray-700/30 border border-gray-600/20 hover:bg-gray-700/50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Smile size={12} className="text-gray-400" />
                      </button>
                    )}
                    {/* Emoji Picker */}
                    {showEmojiPicker === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-10 bg-gray-800 border border-gray-700 rounded-xl p-2 shadow-lg flex gap-1"
                        style={{ bottom: '100%', marginBottom: '4px' }}
                      >
                        {EMOJI_LIST.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-turquoise-500/20 p-3 bg-turquoise-900/20">
        {/* Preview foto */}
        {fotoPreview && (
          <div className="mb-2 relative">
            <div className="relative inline-block rounded-lg overflow-hidden">
              <img
                src={fotoPreview}
                alt="Preview"
                className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                aria-label="Rimuovi foto"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSending || isUploadingPhoto}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploadingPhoto}
            className="p-2 rounded-full bg-turquoise-500/20 text-turquoise-300 hover:bg-turquoise-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aggiungi foto"
          >
            <Image size={18} />
          </button>
          <textarea
            ref={textareaRef}
            value={nuovoMessaggio}
            onChange={(e) => setNuovoMessaggio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
            placeholder="Scrivi un messaggio... (Shift+Invio per inviare)"
            className="flex-1 input text-sm py-2 px-3 focus:border-turquoise-500/60 focus:shadow-[0_8px_24px_rgba(78,205,196,0.35),0_0_0_4px_rgba(78,205,196,0.15),0_0_0_1px_rgba(78,205,196,0.45)_inset] resize-none min-h-[40px] max-h-[120px]"
            disabled={isSending || isUploadingPhoto}
            maxLength={500}
            rows={1}
          />
          <button
            type="submit"
            disabled={(!nuovoMessaggio.trim() && !fotoSelezionata) || isSending || isUploadingPhoto}
            className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isUploadingPhoto ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        )}
      </form>
    </div>
  );
};
