-- ============================================
-- FIX: Policy per upload avatar durante registrazione
-- ============================================
-- Questo script risolve il problema "new row violates row-level security policy"
-- quando si carica l'avatar durante la registrazione con passkey

-- Rimuovi le policy esistenti per avatar (se ci sono)
DROP POLICY IF EXISTS "Permetti upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload anon" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload authenticated" ON storage.objects;

-- ============================================
-- POLICY: UPLOAD AVATAR (anon + authenticated)
-- ============================================
-- Permette a chiunque (anon/authenticated) di caricare avatar
-- Necessario durante la registrazione quando l'utente non ha ancora sessione Supabase Auth
CREATE POLICY "Permetti upload avatar"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  name LIKE 'avatars/%'
);

-- ============================================
-- VERIFICA
-- ============================================
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- ✅ Policy creata!
-- Ora gli utenti possono caricare avatar anche durante la registrazione

