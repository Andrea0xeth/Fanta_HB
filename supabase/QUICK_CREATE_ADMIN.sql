-- ============================================
-- CREA RAPIDAMENTE UN UTENTE ADMIN
-- ============================================
-- Istruzioni:
-- 1. Sostituisci 'NICKNAME_UTENTE' con il nickname dell'utente che vuoi rendere admin
-- 2. Esegui questo script nel Supabase SQL Editor
-- 3. L'utente potrà accedere alla pagina /admin nell'app

-- ============================================
-- STEP 1: TROVA L'UTENTE
-- ============================================
-- Mostra tutti gli utenti (per trovare il nickname corretto)
SELECT 
  id,
  nickname,
  email,
  is_admin,
  punti_personali,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- STEP 2: RENDI ADMIN (SOSTITUISCI IL NICKNAME)
-- ============================================
-- ⚠️ IMPORTANTE: Sostituisci 'NICKNAME_UTENTE' con il nickname reale
UPDATE users 
SET is_admin = true 
WHERE nickname = 'NICKNAME_UTENTE';

-- ============================================
-- STEP 3: VERIFICA
-- ============================================
-- Verifica che l'utente sia ora admin
SELECT 
  id,
  nickname,
  email,
  is_admin,
  punti_personali,
  squadra_id,
  created_at
FROM users
WHERE nickname = 'NICKNAME_UTENTE';

-- Se is_admin = true, l'utente è ora admin! ✅

-- ============================================
-- ALTERNATIVA: RENDI ADMIN PER ID
-- ============================================
-- Se conosci l'ID dell'utente, puoi usare questo:
-- UPDATE users SET is_admin = true WHERE id = 'UUID_DELL_UTENTE';

-- ============================================
-- RIMUOVERE PRIVILEGI ADMIN
-- ============================================
-- Se vuoi rimuovere i privilegi admin:
-- UPDATE users SET is_admin = false WHERE nickname = 'NICKNAME_UTENTE';

-- ============================================
-- LISTA TUTTI GLI ADMIN
-- ============================================
SELECT 
  id,
  nickname,
  email,
  is_admin,
  punti_personali,
  created_at
FROM users
WHERE is_admin = true
ORDER BY created_at;

-- ✅ Fatto! L'utente può ora:
-- - Accedere alla pagina /admin nell'app
-- - Dare punti bonus agli utenti
-- - Aggiudicare classifiche delle gare
-- - Inviare notifiche push personalizzate

