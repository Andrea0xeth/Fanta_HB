-- Forza l'aggiornamento della cache dello schema di PostgREST
-- Questo è necessario dopo aver aggiunto nuove colonne

-- Notifica a PostgREST di ricaricare lo schema
NOTIFY pgrst, 'reload schema';

-- Verifica che le colonne esistano
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('nome', 'cognome', 'email', 'telefono', 'data_nascita')
ORDER BY column_name;



