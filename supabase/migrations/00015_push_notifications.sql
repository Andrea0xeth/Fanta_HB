-- ============================================
-- PUSH NOTIFICATIONS SYSTEM
-- ============================================
-- Tabella per salvare le subscription push degli utenti

-- Tabella push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint) -- Un utente può avere più dispositivi, ma non la stessa subscription due volte
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id, enabled);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (drop se esistono già, poi ricrea)
DROP POLICY IF EXISTS "Lettura proprie subscriptions" ON push_subscriptions;
CREATE POLICY "Lettura proprie subscriptions" ON push_subscriptions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert proprie subscriptions" ON push_subscriptions;
CREATE POLICY "Insert proprie subscriptions" ON push_subscriptions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update proprie subscriptions" ON push_subscriptions;
CREATE POLICY "Update proprie subscriptions" ON push_subscriptions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Delete proprie subscriptions" ON push_subscriptions;
CREATE POLICY "Delete proprie subscriptions" ON push_subscriptions FOR DELETE USING (true);

-- Funzione per inviare notifiche push a un utente
-- Questa funzione sarà chiamata da trigger o da Edge Functions
CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_icon TEXT DEFAULT '/pwa-192x192.png',
  p_badge TEXT DEFAULT '/pwa-192x192.png',
  p_data JSONB DEFAULT '{}'::JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Questa funzione registra solo la notifica nel database
  -- L'invio effettivo sarà gestito da una Edge Function o da un servizio esterno
  -- che leggerà questa tabella e invierà le notifiche push
  
  -- Crea la notifica nel database
  INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
  VALUES (p_user_id, p_title, p_body, 'sistema');
  
  -- Restituisce il numero di subscription attive per questo utente
  SELECT COUNT(*) INTO v_count
  FROM push_subscriptions
  WHERE user_id = p_user_id AND enabled = TRUE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_push_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_subscription_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscription_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_push_subscription_updated_at();

-- ============================================
-- TRIGGER PER NOTIFICHE AUTOMATICHE
-- ============================================

-- Trigger: Nuova quest assegnata
CREATE OR REPLACE FUNCTION notify_new_quest_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_quest_titolo TEXT;
  v_quest_emoji TEXT;
BEGIN
  -- Ottieni info della quest
  SELECT titolo, emoji INTO v_quest_titolo, v_quest_emoji
  FROM quest
  WHERE id = NEW.quest_id;
  
  -- Crea notifica
  INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
  VALUES (
    NEW.user_id,
    'Nuova Quest! 🎯',
    v_quest_emoji || ' ' || v_quest_titolo || ' - Hai una nuova quest da completare!',
    'quest'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_quest_assigned ON user_quest_assignments;
CREATE TRIGGER trigger_notify_new_quest_assigned
AFTER INSERT ON user_quest_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_new_quest_assigned();

-- Trigger: Nuova prova da verificare (per admin e altri utenti)
CREATE OR REPLACE FUNCTION notify_new_proof_to_verify()
RETURNS TRIGGER AS $$
DECLARE
  v_user_nickname TEXT;
  v_quest_titolo TEXT;
BEGIN
  -- Ottieni info utente e quest
  SELECT u.nickname, q.titolo INTO v_user_nickname, v_quest_titolo
  FROM users u, quest q
  WHERE u.id = NEW.user_id AND q.id = NEW.quest_id;
  
  -- Notifica tutti gli utenti (tranne chi ha caricato la prova) che c'è una nuova prova da verificare
  -- In produzione, potresti voler notificare solo gli admin o un gruppo specifico
  INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
  SELECT 
    u.id,
    'Nuova Prova da Verificare! 🔍',
    v_user_nickname || ' ha caricato una prova per: ' || v_quest_titolo,
    'quest'
  FROM users u
  WHERE u.id != NEW.user_id AND u.is_admin = FALSE; -- Notifica tutti tranne l'autore (per ora)
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_proof_to_verify ON prove_quest;
CREATE TRIGGER trigger_notify_new_proof_to_verify
AFTER INSERT ON prove_quest
FOR EACH ROW
WHEN (NEW.stato = 'in_verifica')
EXECUTE FUNCTION notify_new_proof_to_verify();

-- Trigger: Nuova gara creata (notifica le squadre partecipanti)
CREATE OR REPLACE FUNCTION notify_new_gara()
RETURNS TRIGGER AS $$
DECLARE
  v_squadra_a_nome TEXT;
  v_squadra_b_nome TEXT;
BEGIN
  -- Ottieni nomi squadre
  SELECT s1.nome, s2.nome INTO v_squadra_a_nome, v_squadra_b_nome
  FROM squadre s1, squadre s2
  WHERE s1.id = NEW.squadra_a_id AND s2.id = NEW.squadra_b_id;
  
  -- Notifica tutti i membri delle squadre partecipanti
  INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
  SELECT 
    u.id,
    'Nuova Sfida di Squadra! ⚔️',
    'Nuova gara: ' || NEW.nome || ' - ' || v_squadra_a_nome || ' vs ' || v_squadra_b_nome,
    'gara'
  FROM users u
  WHERE u.squadra_id IN (NEW.squadra_a_id, NEW.squadra_b_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_gara ON gare;
CREATE TRIGGER trigger_notify_new_gara
AFTER INSERT ON gare
FOR EACH ROW
EXECUTE FUNCTION notify_new_gara();

-- Trigger: Gara inizia (stato = 'live')
CREATE OR REPLACE FUNCTION notify_gara_started()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifica solo quando la gara passa a 'live'
  IF NEW.stato = 'live' AND (OLD.stato IS NULL OR OLD.stato != 'live') THEN
    INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
    SELECT 
      u.id,
      'Gara Iniziata! 🏁',
      'La gara "' || NEW.nome || '" è iniziata!',
      'gara'
    FROM users u
    WHERE u.squadra_id IN (NEW.squadra_a_id, NEW.squadra_b_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_gara_started ON gare;
CREATE TRIGGER trigger_notify_gara_started
AFTER UPDATE OF stato ON gare
FOR EACH ROW
EXECUTE FUNCTION notify_gara_started();

