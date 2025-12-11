-- ============================================
-- Aggiungi campi aggiuntivi alla tabella users
-- ============================================

-- Aggiungi colonne per dati utente aggiuntivi
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS cognome TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT,
ADD COLUMN IF NOT EXISTS data_nascita DATE;

-- Crea indice su email per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Aggiungi constraint per email unica (opzionale, se vuoi email univoche)
-- ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Commenti per documentazione
COMMENT ON COLUMN users.nome IS 'Nome dell''utente';
COMMENT ON COLUMN users.cognome IS 'Cognome dell''utente';
COMMENT ON COLUMN users.email IS 'Email dell''utente';
COMMENT ON COLUMN users.telefono IS 'Numero di telefono dell''utente';
COMMENT ON COLUMN users.data_nascita IS 'Data di nascita dell''utente';
