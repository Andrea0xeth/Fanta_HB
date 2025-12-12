-- ============================================
-- SETUP STORAGE POLICIES PER AVATAR
-- ============================================
-- Esegui questo script nella Supabase SQL Editor:
-- https://supabase.com/dashboard/project/[PROJECT-REF]/sql/new
--
-- Questo crea le policy necessarie per permettere l'upload di avatar
-- durante la registrazione (anche per utenti anonimi)

-- Rimuovi le policy esistenti se ci sono (per evitare errori)
DROP POLICY IF EXISTS "Permetti upload avatar" ON storage.objects;
DROP POLICY IF EXISTS "Permetti lettura file pubblici" ON storage.objects;

-- Policy per INSERT (upload) - permette a chiunque di caricare file nella cartella avatars
-- Questo è necessario perché durante la registrazione l'utente non è ancora autenticato
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

-- ✅ Policy create!
-- Ora gli utenti possono caricare avatar durante la registrazione

