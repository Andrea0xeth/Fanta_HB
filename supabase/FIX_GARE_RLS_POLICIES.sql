-- ============================================
-- FIX RLS POLICIES PER TABELLA GARE
-- ============================================
-- Questo script aggiunge le policy RLS mancanti per permettere agli admin
-- di creare, aggiornare e gestire le gare

-- ============================================
-- POLICY PER INSERT (Creare nuove gare)
-- ============================================
-- Permette agli admin di creare nuove gare
-- Nota: Per WebAuthn, auth.uid() potrebbe non funzionare, quindi usiamo una policy permissiva
-- In produzione, potresti voler restringere questa policy
DROP POLICY IF EXISTS "Insert gare anon" ON gare;
CREATE POLICY "Insert gare anon" 
ON gare FOR INSERT 
WITH CHECK (true);

-- ============================================
-- POLICY PER UPDATE (Aggiornare gare)
-- ============================================
-- Permette agli admin di aggiornare le gare
DROP POLICY IF EXISTS "Admin può aggiornare gare" ON gare;
CREATE POLICY "Admin può aggiornare gare" 
ON gare FOR UPDATE 
USING (true)  -- ⚠️ Temporaneamente permissiva
WITH CHECK (true);

-- ============================================
-- POLICY PER DELETE (Eliminare gare)
-- ============================================
-- Permette agli admin di eliminare le gare
DROP POLICY IF EXISTS "Admin può eliminare gare" ON gare;
CREATE POLICY "Admin può eliminare gare" 
ON gare FOR DELETE 
USING (true);  -- ⚠️ Temporaneamente permissiva

-- ============================================
-- VERIFICA
-- ============================================
-- Mostra tutte le policy esistenti per la tabella gare
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'gare'
ORDER BY policyname;

-- ✅ Policy aggiornate!
-- Ora gli admin possono:
-- - Creare nuove gare (INSERT)
-- - Aggiornare gare esistenti (UPDATE)
-- - Eliminare gare (DELETE)
-- - Leggere tutte le gare (SELECT - già esistente)

