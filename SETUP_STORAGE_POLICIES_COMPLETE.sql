-- ============================================
-- SETUP STORAGE POLICIES COMPLETE
-- ============================================
-- Esegui questo script nella Supabase SQL Editor:
-- https://supabase.com/dashboard/project/[PROJECT-REF]/sql/new
--
-- Questo crea le policy necessarie per:
-- 1. Upload avatar (durante registrazione)
-- 2. Upload prove quest (foto/video)
-- 3. Lettura pubblica di tutti i file

-- Rimuovi le policy esistenti se ci sono (per evitare errori)
DROP POLICY IF EXISTS "Permetti upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Permetti upload prove" ON storage.objects;
DROP POLICY IF EXISTS "Permetti lettura file pubblici" ON storage.objects;
DROP POLICY IF EXISTS "Permetti update propri file" ON storage.objects;
DROP POLICY IF EXISTS "Permetti delete propri file" ON storage.objects;

-- ============================================
-- POLICY 1: UPLOAD AVATAR
-- ============================================
-- Permette a chiunque (anon/authenticated) di caricare avatar
-- Necessario durante la registrazione quando l'utente non è ancora autenticato
CREATE POLICY "Permetti upload avatar"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- ============================================
-- POLICY 2: UPLOAD PROVE QUEST
-- ============================================
-- Permette agli utenti autenticati di caricare prove (foto/video)
-- Le prove vengono salvate in: {userId}/{questId}/{timestamp}.{ext}
CREATE POLICY "Permetti upload prove"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] != 'avatars' -- Tutto tranne avatars
);

-- ============================================
-- POLICY 3: LETTURA PUBBLICA
-- ============================================
-- Permette a chiunque di leggere tutti i file pubblici
-- Necessario per visualizzare avatar e prove
CREATE POLICY "Permetti lettura file pubblici"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'prove-quest'
);

-- ============================================
-- POLICY 4: UPDATE PROPRI FILE
-- ============================================
-- Permette agli utenti di aggiornare solo i propri file
CREATE POLICY "Permetti update propri file"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prove-quest' AND
  (
    -- Avatar: può aggiornare solo nella sua cartella
    ((storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Prove: può aggiornare solo nella sua cartella
    ((storage.foldername(name))[1] != 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- ============================================
-- POLICY 5: DELETE PROPRI FILE
-- ============================================
-- Permette agli utenti di eliminare solo i propri file
CREATE POLICY "Permetti delete propri file"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prove-quest' AND
  (
    -- Avatar: può eliminare solo nella sua cartella
    ((storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text)
    OR
    -- Prove: può eliminare solo nella sua cartella
    ((storage.foldername(name))[1] != 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  )
);

-- ✅ Policy create!
-- 
-- Ora gli utenti possono:
-- 1. ✅ Caricare avatar durante la registrazione (anon)
-- 2. ✅ Caricare prove quest (foto/video) quando autenticati
-- 3. ✅ Visualizzare tutti i file pubblici
-- 4. ✅ Aggiornare/eliminare solo i propri file

