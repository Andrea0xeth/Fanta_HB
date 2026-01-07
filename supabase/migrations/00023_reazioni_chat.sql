-- ============================================
-- REAZIONI CHAT MESSAGGI
-- ============================================
-- Tabella per le reazioni ai messaggi della chat

-- Tabella reazioni_chat
CREATE TABLE IF NOT EXISTS reazioni_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messaggio_id UUID NOT NULL REFERENCES messaggi_chat(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Un utente può avere solo una reazione per messaggio
  UNIQUE(messaggio_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_reazioni_chat_messaggio ON reazioni_chat(messaggio_id);
CREATE INDEX IF NOT EXISTS idx_reazioni_chat_user ON reazioni_chat(user_id);

-- RLS
ALTER TABLE reazioni_chat ENABLE ROW LEVEL SECURITY;

-- Policies (permissive per WebAuthn)
DROP POLICY IF EXISTS "Lettura reazioni" ON reazioni_chat;
CREATE POLICY "Lettura reazioni" 
ON reazioni_chat 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert reazioni" ON reazioni_chat;
CREATE POLICY "Insert reazioni" 
ON reazioni_chat 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Delete reazioni" ON reazioni_chat;
CREATE POLICY "Delete reazioni" 
ON reazioni_chat 
FOR DELETE 
USING (true);

-- Abilita Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reazioni_chat;
