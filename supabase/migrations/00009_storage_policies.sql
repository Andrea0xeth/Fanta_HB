-- ============================================
-- STORAGE POLICIES PER AVATAR E PROVE
-- ============================================
-- Questo script crea le policy necessarie per permettere
-- l'upload di avatar e prove nel bucket prove-quest

-- Abilita RLS sul bucket (se non già abilitato)
-- Nota: Le policy storage vengono create tramite l'API o la dashboard
-- Questo è un esempio di come dovrebbero essere configurate

-- Policy per permettere upload di avatar agli utenti anonimi (durante registrazione)
-- IMPORTANTE: Esegui questo nella Supabase SQL Editor o tramite l'API Storage

-- Per creare le policy storage, vai su:
-- Supabase Dashboard > Storage > prove-quest > Policies > New Policy

-- Oppure usa questo SQL (se supportato dalla tua versione di Supabase):

-- Rimuovi le policy esistenti se ci sono (per evitare errori)
DROP POLICY IF EXISTS "Permetti upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Permetti lettura file pubblici" ON storage.objects;

-- Policy per INSERT (upload) - permette a chiunque di caricare file nella cartella avatars
CREATE POLICY "Permetti upload avatar"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Policy per SELECT (lettura) - permette a chiunque di leggere i file pubblici
CREATE POLICY "Permetti lettura file pubblici"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'prove-quest'
);

-- Policy per UPDATE - permette agli utenti di aggiornare i propri file
CREATE POLICY IF NOT EXISTS "Permetti update propri file"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy per DELETE - permette agli utenti di eliminare i propri file
CREATE POLICY IF NOT EXISTS "Permetti delete propri file"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- NOTA: Se le policy sopra non funzionano, creale manualmente dalla dashboard:
-- 1. Vai su: https://supabase.com/dashboard/project/[PROJECT-REF]/storage/policies
-- 2. Seleziona il bucket "prove-quest"
-- 3. Clicca "New Policy"
-- 4. Per INSERT: 
--    - Policy name: "Permetti upload avatar"
--    - Allowed operation: INSERT
--    - Target roles: anon, authenticated
--    - Policy definition: 
--      bucket_id = 'prove-quest' AND (storage.foldername(name))[1] = 'avatars'
-- 5. Per SELECT:
--    - Policy name: "Permetti lettura file pubblici"
--    - Allowed operation: SELECT
--    - Target roles: anon, authenticated
--    - Policy definition: bucket_id = 'prove-quest'
