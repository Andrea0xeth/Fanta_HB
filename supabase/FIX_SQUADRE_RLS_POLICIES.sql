-- ============================================
-- FIX RLS POLICIES PER TABELLA SQUADRE
-- ============================================
-- Questo script aggiunge le policy RLS mancanti per permettere agli admin
-- di creare, modificare ed eliminare squadre

-- ============================================
-- POLICY PER INSERT (Creare nuove squadre)
-- ============================================
-- Permette agli admin di creare nuove squadre
-- Nota: Per WebAuthn, auth.uid() potrebbe non funzionare, quindi usiamo una policy permissiva
-- In produzione, potresti voler restringere questa policy verificando is_admin
DROP POLICY IF EXISTS "Insert squadre anon" ON squadre;
CREATE POLICY "Insert squadre anon" 
ON squadre FOR INSERT 
WITH CHECK (true);

-- ============================================
-- POLICY PER DELETE (Eliminare squadre)
-- ============================================
-- Permette agli admin di eliminare le squadre
-- Nota: La validazione che la squadra sia vuota viene fatta nel codice frontend
DROP POLICY IF EXISTS "Admin può eliminare squadre" ON squadre;
CREATE POLICY "Admin può eliminare squadre" 
ON squadre FOR DELETE 
USING (true);  -- ⚠️ Temporaneamente permissiva

-- ============================================
-- VERIFICA
-- ============================================
-- Mostra tutte le policy esistenti per la tabella squadre
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
WHERE tablename = 'squadre'
ORDER BY policyname;

-- ✅ Policy aggiornate!
-- Ora gli admin possono:
-- - Creare nuove squadre (INSERT) ✅
-- - Aggiornare squadre esistenti (UPDATE) ✅ (già esistente)
-- - Eliminare squadre (DELETE) ✅
-- - Leggere tutte le squadre (SELECT) ✅ (già esistente)

