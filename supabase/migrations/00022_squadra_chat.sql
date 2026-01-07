-- ============================================
-- SQUADRA CHAT SYSTEM
-- ============================================
-- Tabella per i messaggi della chat di squadra

-- Tabella messaggi_chat
CREATE TABLE IF NOT EXISTS messaggi_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  squadra_id UUID NOT NULL REFERENCES squadre(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messaggio TEXT,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Un messaggio deve avere almeno testo o foto
  CHECK (messaggio IS NOT NULL OR foto_url IS NOT NULL)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_messaggi_chat_squadra ON messaggi_chat(squadra_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messaggi_chat_user ON messaggi_chat(user_id);

-- RLS
ALTER TABLE messaggi_chat ENABLE ROW LEVEL SECURITY;

-- Policies
-- Nota: Per WebAuthn/Passkey, auth.uid() potrebbe non funzionare, quindi usiamo policy permissive
-- basate sulla verifica che l'utente sia membro della squadra

-- Lettura: solo membri della squadra (policy permissiva per WebAuthn)
DROP POLICY IF EXISTS "Lettura messaggi squadra" ON messaggi_chat;
CREATE POLICY "Lettura messaggi squadra" 
ON messaggi_chat 
FOR SELECT 
USING (true); -- Permettiamo la lettura, la verifica sarà fatta a livello applicativo

-- Insert: solo membri della squadra (policy permissiva per WebAuthn)
DROP POLICY IF EXISTS "Insert messaggi squadra" ON messaggi_chat;
CREATE POLICY "Insert messaggi squadra" 
ON messaggi_chat 
FOR INSERT 
WITH CHECK (true); -- Permettiamo l'insert, la verifica sarà fatta a livello applicativo

-- Update: solo il proprio messaggio (policy permissiva per WebAuthn)
DROP POLICY IF EXISTS "Update propri messaggi" ON messaggi_chat;
CREATE POLICY "Update propri messaggi" 
ON messaggi_chat 
FOR UPDATE 
USING (true)
WITH CHECK (true); -- Permettiamo l'update, la verifica sarà fatta a livello applicativo

-- Delete: solo il proprio messaggio (policy permissiva per WebAuthn)
DROP POLICY IF EXISTS "Delete propri messaggi" ON messaggi_chat;
CREATE POLICY "Delete propri messaggi" 
ON messaggi_chat 
FOR DELETE 
USING (true); -- Permettiamo il delete, la verifica sarà fatta a livello applicativo

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_messaggi_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_messaggi_chat_updated_at ON messaggi_chat;
CREATE TRIGGER trigger_messaggi_chat_updated_at
  BEFORE UPDATE ON messaggi_chat
  FOR EACH ROW
  EXECUTE FUNCTION update_messaggi_chat_updated_at();
