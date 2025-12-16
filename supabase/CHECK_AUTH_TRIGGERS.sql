-- ============================================
-- VERIFICA TRIGGER E VALIDAZIONI AUTH
-- ============================================
-- Questo script verifica se ci sono trigger o funzioni che potrebbero bloccare la registrazione

-- 1. Verifica trigger sulla tabella auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Verifica funzioni che potrebbero validare email
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname LIKE '%email%' 
   OR proname LIKE '%validate%'
   OR proname LIKE '%signup%'
   OR proname LIKE '%auth%'
ORDER BY proname;

-- 3. Verifica se ci sono policy RLS su auth.users (non dovrebbero esserci)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'auth'
  AND tablename = 'users';

-- 4. Verifica configurazione Auth
-- Nota: La tabella auth.config non è accessibile direttamente
-- La configurazione Auth si trova nel dashboard Supabase:
-- Authentication → Providers → Email
-- Authentication → Settings

-- 5. Verifica se ci sono restrizioni su domini email nella configurazione
-- (Questo potrebbe essere in una tabella di configurazione custom)
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND (column_name LIKE '%email%' OR column_name LIKE '%domain%' OR column_name LIKE '%restrict%');

