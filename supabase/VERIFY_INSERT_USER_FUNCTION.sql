-- ============================================
-- VERIFICA FUNZIONE insert_user_with_passkey
-- ============================================
-- Esegui questo script per verificare che la funzione sia configurata correttamente

-- 1. Verifica che la funzione esista
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  CASE 
    WHEN proname = 'insert_user_with_passkey' THEN '✅ Funzione presente'
    ELSE '❌ Funzione mancante'
  END as status
FROM pg_proc
WHERE proname = 'insert_user_with_passkey';

-- 2. Verifica i parametri della funzione
SELECT 
  p.proname as function_name,
  unnest(p.proargnames) as parameter_name,
  pg_catalog.format_type(unnest(p.proargtypes), NULL) as parameter_type,
  unnest(p.proargmodes) as parameter_mode
FROM pg_proc p
WHERE p.proname = 'insert_user_with_passkey';

-- 3. Verifica permessi
SELECT 
  p.proname as function_name,
  r.rolname as role,
  CASE 
    WHEN r.rolname IN ('anon', 'authenticated') THEN '✅ Permesso concesso'
    ELSE '⚠️ Permesso mancante'
  END as status
FROM pg_proc p
JOIN pg_proc_acl pa ON p.oid = pa.prooid
JOIN pg_roles r ON pa.grantee = r.oid
WHERE p.proname = 'insert_user_with_passkey'
  AND r.rolname IN ('anon', 'authenticated');

-- 4. Test: Prova a chiamare la funzione con parametri di test
-- (Questo fallirà se ci sono problemi con la firma)
-- SELECT * FROM insert_user_with_passkey(
--   gen_random_uuid(),
--   'test_nickname',
--   NULL, -- passkey_id
--   'Test',
--   'User',
--   'test@example.com',
--   NULL, -- telefono
--   NULL, -- data_nascita
--   NULL, -- squadra_id
--   false, -- is_admin
--   NULL -- avatar
-- );

-- 5. Verifica che la tabella users abbia tutte le colonne necessarie
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'nickname', 'passkey_id', 'nome', 'cognome', 'email', 'telefono', 'data_nascita', 'squadra_id', 'punti_personali', 'is_admin', 'avatar')
ORDER BY column_name;

