-- ============================================
-- SETUP COMPLETO CHAT SQUADRA
-- ============================================
-- Esegui questo script nel SQL Editor di Supabase
-- per configurare completamente la chat di squadra

-- ============================================
-- 1. CREA TABELLA MESSAGGI_CHAT
-- ============================================
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

-- ============================================
-- 2. CREA INDICI PER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messaggi_chat_squadra ON messaggi_chat(squadra_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messaggi_chat_user ON messaggi_chat(user_id);

-- ============================================
-- 3. ABILITA RLS
-- ============================================
ALTER TABLE messaggi_chat ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREA POLICY RLS
-- ============================================
-- Nota: Policy permissive per WebAuthn (auth.uid() potrebbe non funzionare)

-- Lettura: tutti possono leggere (verifica a livello applicativo)
DROP POLICY IF EXISTS "Lettura messaggi squadra" ON messaggi_chat;
CREATE POLICY "Lettura messaggi squadra" 
ON messaggi_chat 
FOR SELECT 
USING (true);

-- Insert: tutti possono inserire (verifica a livello applicativo)
DROP POLICY IF EXISTS "Insert messaggi squadra" ON messaggi_chat;
CREATE POLICY "Insert messaggi squadra" 
ON messaggi_chat 
FOR INSERT 
WITH CHECK (true);

-- Update: tutti possono aggiornare (verifica a livello applicativo)
DROP POLICY IF EXISTS "Update propri messaggi" ON messaggi_chat;
CREATE POLICY "Update propri messaggi" 
ON messaggi_chat 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Delete: tutti possono eliminare (verifica a livello applicativo)
DROP POLICY IF EXISTS "Delete propri messaggi" ON messaggi_chat;
CREATE POLICY "Delete propri messaggi" 
ON messaggi_chat 
FOR DELETE 
USING (true);

-- ============================================
-- 5. CREA TRIGGER PER UPDATED_AT
-- ============================================
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

-- ============================================
-- 6. ABILITA REALTIME
-- ============================================
-- Aggiungi la tabella alla pubblicazione Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messaggi_chat;

-- ============================================
-- 7. AGGIUNGI STORAGE POLICY PER FOTO CHAT
-- ============================================
-- (Solo se non esiste già una policy che copre chat/)
-- Verifica se esiste già una policy per chat/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Permetti upload foto chat'
  ) THEN
    -- Crea policy specifica per chat (opzionale, se la policy generale non copre)
    -- La policy "Permetti upload prove" dovrebbe già coprire chat/ se esclude solo avatars/
    -- Ma aggiungiamo questa per sicurezza
    EXECUTE '
      CREATE POLICY "Permetti upload foto chat"
      ON storage.objects
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        bucket_id = ''prove-quest'' AND
        name LIKE ''chat/%''
      );
    ';
  END IF;
END $$;

-- ============================================
-- 8. VERIFICA FINALE
-- ============================================
-- Verifica che la tabella sia stata creata
SELECT 
  'Tabella messaggi_chat creata' as status,
  COUNT(*) as num_columns
FROM information_schema.columns
WHERE table_name = 'messaggi_chat';

-- Verifica le policy RLS
SELECT 
  'Policy RLS create' as status,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messaggi_chat';

-- Verifica Realtime
SELECT 
  'Realtime abilitato' as status,
  COUNT(*) as num_tables
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'messaggi_chat';

-- ============================================
-- 9. CREA TABELLA REAZIONI CHAT
-- ============================================
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

-- RLS per reazioni
ALTER TABLE reazioni_chat ENABLE ROW LEVEL SECURITY;

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

-- Abilita Realtime per reazioni
ALTER PUBLICATION supabase_realtime ADD TABLE reazioni_chat;

-- ============================================
-- ✅ SETUP COMPLETATO!
-- ============================================
-- La chat è ora configurata e pronta all'uso.
-- 
-- Prossimi passi:
-- 1. Testa l'invio di un messaggio dall'app
-- 2. Testa l'upload di una foto
-- 3. Verifica che i messaggi arrivino in tempo reale
