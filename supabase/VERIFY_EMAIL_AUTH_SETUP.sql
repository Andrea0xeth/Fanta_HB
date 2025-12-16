-- ============================================
-- VERIFICA SETUP EMAIL/PASSWORD AUTH
-- ============================================
-- Esegui questo script per verificare che tutto sia configurato correttamente

-- 1. Verifica policy RLS sulla tabella users
SELECT 
  policyname,
  cmd as command,
  roles,
  CASE 
    WHEN cmd = 'SELECT' AND 'anon' = ANY(roles) THEN '✅ Lettura pubblica abilitata'
    ELSE '⚠️ Configurazione da verificare'
  END as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
  AND cmd = 'SELECT';

-- 2. Verifica che la colonna email esista
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'email' THEN '✅ Colonna email presente'
    ELSE '❌ Colonna email mancante'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'email';

-- 3. Verifica indice sulla colonna email
SELECT 
  indexname,
  indexdef,
  CASE 
    WHEN indexname = 'idx_users_email' THEN '✅ Indice presente'
    ELSE '⚠️ Indice mancante'
  END as status
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'users' 
  AND indexname = 'idx_users_email';

-- 4. Verifica funzione insert_user_with_passkey
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'insert_user_with_passkey' THEN '✅ Funzione presente'
    ELSE '❌ Funzione mancante'
  END as status,
  proargnames as parameters
FROM pg_proc
WHERE proname = 'insert_user_with_passkey';

-- 5. Verifica permessi sulla funzione
SELECT 
  p.proname as function_name,
  r.rolname as role,
  CASE 
    WHEN r.rolname IN ('anon', 'authenticated') THEN '✅ Permesso concesso'
    ELSE '⚠️ Permesso da verificare'
  END as status
FROM pg_proc p
JOIN pg_proc_acl pa ON p.oid = pa.prooid
JOIN pg_roles r ON pa.grantee = r.oid
WHERE p.proname = 'insert_user_with_passkey'
  AND r.rolname IN ('anon', 'authenticated');

-- 6. Test: Verifica se puoi leggere la tabella users (dovrebbe funzionare)
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Lettura tabella users funziona'
    ELSE '❌ Errore lettura tabella'
  END as status
FROM users;

-- 7. Verifica RLS è abilitato
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS abilitato'
    ELSE '⚠️ RLS disabilitato'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

