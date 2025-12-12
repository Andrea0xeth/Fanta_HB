-- ============================================
-- RENDI ADMIN: f5fc5c57-9726-45ce-ad6a-7e5480f3dcdd
-- ============================================

-- Verifica utente prima di renderlo admin
SELECT 
  id,
  nickname,
  email,
  is_admin,
  punti_personali,
  squadra_id,
  created_at
FROM users
WHERE id = 'f5fc5c57-9726-45ce-ad6a-7e5480f3dcdd';

-- Rendi admin
UPDATE users 
SET is_admin = true 
WHERE id = 'f5fc5c57-9726-45ce-ad6a-7e5480f3dcdd';

-- Verifica che sia stato aggiornato
SELECT 
  id,
  nickname,
  email,
  is_admin,
  punti_personali,
  squadra_id,
  created_at
FROM users
WHERE id = 'f5fc5c57-9726-45ce-ad6a-7e5480f3dcdd';

-- ✅ Se is_admin = true, l'utente è ora admin!
-- L'utente può ora:
-- - Accedere alla pagina /admin nell'app
-- - Dare punti bonus agli utenti
-- - Aggiudicare classifiche delle gare
-- - Inviare notifiche push personalizzate

