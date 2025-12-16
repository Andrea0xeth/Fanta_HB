-- ============================================
-- FIX COMPLETO: Upload Avatar durante registrazione
-- ============================================
-- Questo script risolve il problema "new row violates row-level security policy"
-- quando si carica l'avatar durante la registrazione con passkey

-- ============================================
-- STEP 1: Verifica che RLS sia abilitato sul bucket
-- ============================================
-- Se RLS non è abilitato, abilitalo dalla dashboard:
-- Storage > prove-quest > Settings > Enable RLS

-- ============================================
-- STEP 2: Rimuovi tutte le policy esistenti per avatar
-- ============================================
DROP POLICY IF EXISTS "Permetti upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload anon" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow avatar upload" ON storage.objects;

-- ============================================
-- STEP 3: Crea policy per UPLOAD AVATAR
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
-- STEP 4: Verifica che esista la policy per LETTURA
-- ============================================
-- Se non esiste, creala
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname = 'Permetti lettura file pubblici'
  ) THEN
    CREATE POLICY "Permetti lettura file pubblici"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (
      bucket_id = 'prove-quest'
    );
  END IF;
END $$;

-- ============================================
-- STEP 5: Verifica configurazione
-- ============================================
SELECT 
  policyname as "Policy Name",
  cmd as "Operation",
  roles as "Roles",
  CASE 
    WHEN with_check LIKE '%avatars/%' THEN '✅ Avatar upload policy'
    WHEN with_check LIKE '%prove-quest%' THEN '✅ Storage policy'
    ELSE '⚠️ Other policy'
  END as "Status"
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (
    policyname LIKE '%avatar%' 
    OR policyname LIKE '%lettura%'
    OR policyname LIKE '%prove%'
  )
ORDER BY policyname;

-- ============================================
-- VERIFICA BUCKET
-- ============================================
-- Verifica che il bucket esista e abbia RLS abilitato
SELECT 
  name as "Bucket Name",
  public as "Public",
  file_size_limit as "Size Limit",
  allowed_mime_types as "Allowed Types"
FROM storage.buckets
WHERE name = 'prove-quest';

-- ✅ Se vedi il bucket sopra, è configurato correttamente
-- ✅ Se vedi la policy "Permetti upload avatar" sopra, è configurata correttamente
-- 
-- Se non vedi la policy, esegui manualmente:
-- 1. Vai su: Supabase Dashboard > Storage > prove-quest > Policies
-- 2. Clicca "New Policy"
-- 3. Nome: "Permetti upload avatar"
-- 4. Operation: INSERT
-- 5. Roles: anon, authenticated
-- 6. Policy definition: bucket_id = 'prove-quest' AND name LIKE 'avatars/%'

