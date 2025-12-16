-- ============================================
-- TEST FUNZIONE check_email_exists
-- ============================================
-- Esegui questo script per testare che la funzione funzioni correttamente

-- Test 1: Verifica che la funzione esista
SELECT 
  proname as function_name,
  CASE 
    WHEN proname = 'check_email_exists' THEN '✅ Funzione presente'
    ELSE '❌ Funzione mancante'
  END as status
FROM pg_proc
WHERE proname = 'check_email_exists';

-- Test 2: Prova a chiamare la funzione con un'email che non esiste
SELECT * FROM check_email_exists('test-nonexistent@example.com');
-- Dovrebbe restituire: email_exists = false, user_id = null

-- Test 3: Se hai già utenti nel database, prova con un'email esistente
-- (Sostituisci con un'email reale se ce l'hai)
-- SELECT * FROM check_email_exists('email-esistente@example.com');
-- Dovrebbe restituire: email_exists = true, user_id = <uuid>

-- Test 4: Verifica permessi
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
WHERE p.proname = 'check_email_exists'
  AND r.rolname IN ('anon', 'authenticated');

