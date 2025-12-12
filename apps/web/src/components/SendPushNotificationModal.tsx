import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, AlertCircle, Users, User, Building2 } from 'lucide-react';
import { sendPushNotification, sendPushNotificationToSquadra, sendPushNotificationToAll } from '../lib/pushNotifications';
import { useGame } from '../context/GameContext';

interface SendPushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RecipientType = 'user' | 'squadra' | 'all';

export const SendPushNotificationModal: React.FC<SendPushNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { squadre, leaderboardSingoli } = useGame();
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedSquadraId, setSelectedSquadraId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ type: 'error', message: 'Compila tutti i campi' });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        url: '/',
      };

      console.log('[PushModal] Invio notifica:', { recipientType, payload });

      let success = false;
      let count = 0;
      let errorMessage = '';

      switch (recipientType) {
        case 'user':
          if (!selectedUserId) {
            setResult({ type: 'error', message: 'Seleziona un utente' });
            setIsSending(false);
            return;
          }
          console.log('[PushModal] Invio a utente:', selectedUserId);
          try {
            success = await sendPushNotification(selectedUserId, payload);
            count = success ? 1 : 0;
            if (!success) {
              errorMessage = 'Impossibile inviare la notifica. Verifica che:\n- L\'utente abbia abilitato le notifiche push\n- Le chiavi VAPID siano configurate nell\'Edge Function\n- L\'Edge Function sia deployata correttamente';
            }
          } catch (err: any) {
            console.error('[PushModal] Errore specifico:', err);
            errorMessage = err.message || 'Errore durante l\'invio. Controlla la console per i dettagli.';
            success = false;
          }
          break;

        case 'squadra':
          if (!selectedSquadraId) {
            setResult({ type: 'error', message: 'Seleziona una squadra' });
            setIsSending(false);
            return;
          }
          console.log('[PushModal] Invio a squadra:', selectedSquadraId);
          count = await sendPushNotificationToSquadra(selectedSquadraId, payload);
          success = count > 0;
          if (!success) {
            errorMessage = `Nessuna notifica inviata. Verifica che gli utenti della squadra abbiano abilitato le notifiche push.`;
          }
          break;

        case 'all':
          console.log('[PushModal] Invio a tutti gli utenti');
          count = await sendPushNotificationToAll(payload);
          success = count > 0;
          if (!success) {
            errorMessage = `Nessuna notifica inviata. Verifica che ci siano utenti con notifiche push abilitate.`;
          }
          break;
      }

      console.log('[PushModal] Risultato:', { success, count });

      if (success) {
        setResult({
          type: 'success',
          message: `Notifica inviata a ${count} ${count === 1 ? 'utente' : 'utenti'}`,
        });
        // Reset form dopo 2 secondi
        setTimeout(() => {
          setTitle('');
          setBody('');
          setSelectedUserId('');
          setSelectedSquadraId('');
          setResult(null);
        }, 2000);
      } else {
        setResult({ 
          type: 'error', 
          message: errorMessage || 'Errore durante l\'invio della notifica. Controlla la console per i dettagli.' 
        });
      }
    } catch (error) {
      console.error('[PushModal] Errore invio notifica:', error);
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Errore sconosciuto. Controlla la console per i dettagli.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send size={24} />
              Invia Notifica Push
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-700/50 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Tipo destinatario */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Destinatario
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientType('all')}
                className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  recipientType === 'all'
                    ? 'bg-coral-500 text-white'
                    : 'glass text-gray-400'
                }`}
              >
                <Users size={18} />
                <span className="text-sm">Tutti</span>
              </button>
              <button
                onClick={() => setRecipientType('squadra')}
                className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  recipientType === 'squadra'
                    ? 'bg-coral-500 text-white'
                    : 'glass text-gray-400'
                }`}
              >
                <Building2 size={18} />
                <span className="text-sm">Squadra</span>
              </button>
              <button
                onClick={() => setRecipientType('user')}
                className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  recipientType === 'user'
                    ? 'bg-coral-500 text-white'
                    : 'glass text-gray-400'
                }`}
              >
                <User size={18} />
                <span className="text-sm">Utente</span>
              </button>
            </div>
          </div>

          {/* Selezione utente */}
          {recipientType === 'user' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Seleziona Utente
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Seleziona utente --</option>
                {leaderboardSingoli.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selezione squadra */}
          {recipientType === 'squadra' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Seleziona Squadra
              </label>
              <select
                value={selectedSquadraId}
                onChange={(e) => setSelectedSquadraId(e.target.value)}
                className="input w-full"
              >
                <option value="">-- Seleziona squadra --</option>
                {squadre.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Titolo */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Titolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es: Nuova Sfida!"
              className="input w-full"
              maxLength={50}
            />
          </div>

          {/* Messaggio */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Messaggio
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Es: Una nuova sfida è iniziata! Partecipa ora!"
              className="input w-full min-h-[100px] resize-none"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{body.length}/200</p>
          </div>

          {/* Risultato */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                  result.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle2 className="text-green-400 flex-shrink-0" size={18} />
                ) : (
                  <AlertCircle className="text-red-400 flex-shrink-0" size={18} />
                )}
                <p
                  className={`text-sm ${
                    result.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {result.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Azioni */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={isSending}
            >
              Annulla
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !title.trim() || !body.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Invio...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Invia</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

