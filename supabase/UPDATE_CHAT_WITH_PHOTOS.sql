-- ============================================
-- AGGIORNA CHAT PER SUPPORTARE FOTO
-- ============================================
-- Esegui questo script se la tabella messaggi_chat esiste già
-- per aggiungere il supporto alle foto

-- Aggiungi colonna foto_url se non esiste
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messaggi_chat' AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE messaggi_chat ADD COLUMN foto_url TEXT;
  END IF;
END $$;

-- Modifica messaggio per essere nullable (ora può essere NULL se c'è solo foto)
DO $$ 
BEGIN
  -- Rimuovi il constraint NOT NULL se esiste
  ALTER TABLE messaggi_chat ALTER COLUMN messaggio DROP NOT NULL;
  
  -- Aggiungi constraint CHECK per garantire che ci sia almeno testo o foto
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messaggi_chat_messaggio_or_foto_check'
  ) THEN
    ALTER TABLE messaggi_chat 
    ADD CONSTRAINT messaggi_chat_messaggio_or_foto_check 
    CHECK (messaggio IS NOT NULL OR foto_url IS NOT NULL);
  END IF;
END $$;

-- Verifica che tutto sia stato aggiornato correttamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'messaggi_chat'
ORDER BY ordinal_position;
