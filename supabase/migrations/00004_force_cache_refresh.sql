-- Forza l'aggiornamento della cache PostgREST
-- Esegui questa query nel SQL Editor di Supabase

-- 1. Verifica che le colonne esistano
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('nome', 'cognome', 'email', 'telefono', 'data_nascita')
ORDER BY column_name;

-- 2. Forza PostgREST a ricaricare lo schema toccando la tabella
-- Questo a volte aiuta a forzare il refresh della cache
SELECT COUNT(*) FROM users;

-- 3. Se le colonne non esistono, aggiungile (backup)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'nome') THEN
    ALTER TABLE users ADD COLUMN nome TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'cognome') THEN
    ALTER TABLE users ADD COLUMN cognome TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'telefono') THEN
    ALTER TABLE users ADD COLUMN telefono TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'data_nascita') THEN
    ALTER TABLE users ADD COLUMN data_nascita DATE;
  END IF;
END $$;



