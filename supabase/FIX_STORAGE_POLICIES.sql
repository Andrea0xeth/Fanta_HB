-- ============================================
-- FIX STORAGE POLICIES - UPLOAD PROVE QUEST
-- ============================================
-- Esegui questo script nella Supabase SQL Editor per risolvere l'errore:
-- "new row violates row-level security policy"
--
-- Vai su: https://supabase.com/dashboard/project/[PROJECT-REF]/sql/new
-- Copia e incolla questo script, poi clicca "Run"

-- Verifica che RLS sia abilitato sul bucket
-- (Questo dovrebbe essere già fatto, ma lo verifichiamo)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prove-quest';

-- Rimuovi la policy esistente se c'è (per evitare errori)
DROP POLICY IF EXISTS "Permetti upload prove" ON storage.objects;

-- Crea la policy per permettere agli utenti autenticati di caricare prove
-- Le prove vengono salvate in: {userId}/{questId}/{timestamp}.{ext}
CREATE POLICY "Permetti upload prove"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  (storage.foldername(name))[1] != 'avatars' -- Tutto tranne avatars
);

-- Verifica che anche la policy per la lettura esista
DROP POLICY IF EXISTS "Permetti lettura file pubblici" ON storage.objects;

CREATE POLICY "Permetti lettura file pubblici"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'prove-quest'
);

-- ✅ Policy create!
-- Ora gli utenti autenticati possono caricare prove (foto/video) nel bucket prove-quest

