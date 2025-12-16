-- ============================================
-- VERIFICA SE EMAIL PROVIDER È ABILITATO
-- ============================================
-- Questo script verifica se ci sono configurazioni che potrebbero bloccare le registrazioni email

-- 1. Verifica se ci sono hook o trigger su auth.users che validano email
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND (trigger_name LIKE '%email%' OR trigger_name LIKE '%validate%' OR trigger_name LIKE '%signup%');

-- 2. Verifica funzioni che potrebbero validare email durante signup
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE (
  proname LIKE '%email%validate%' 
  OR proname LIKE '%signup%validate%'
  OR proname LIKE '%auth%email%'
)
AND proname NOT LIKE '%pg_%'
ORDER BY proname;

-- 3. Verifica se ci sono estensioni che potrebbero validare email
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension
WHERE extname LIKE '%email%' OR extname LIKE '%validate%';

-- 4. Verifica configurazione Auth (se accessibile tramite funzioni)
-- Nota: La configurazione Auth principale è nel dashboard, non nel database
SELECT 
  'IMPORTANTE: La configurazione Email Provider si trova nel dashboard Supabase' as note,
  'Vai su: Authentication → Providers → Email' as location,
  'Verifica che "Enable Email provider" sia ON' as check_1,
  'Verifica che "Confirm email" sia OFF' as check_2;

-- 5. Test: Prova a vedere se ci sono utenti esistenti con email simili
-- (Questo potrebbe aiutare a capire se il problema è con email duplicate)
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT email) as unique_emails,
  COUNT(CASE WHEN email LIKE '%@test.com' THEN 1 END) as test_domain_users,
  COUNT(CASE WHEN email LIKE '%@gmail.com' THEN 1 END) as gmail_users
FROM auth.users
WHERE email IS NOT NULL;

