-- ============================================
-- APPLICA SISTEMA GARE MULTI-SQUADRA
-- ============================================
-- Esegui questo script nella Supabase SQL Editor:
-- https://supabase.com/dashboard/project/[PROJECT-REF]/sql/new
--
-- Questo script:
-- 1. Crea la tabella per le classifiche
-- 2. Crea le funzioni per assegnare classifiche
-- 3. Crea i 20 template di giochi da spiaggia

-- IMPORTANTE: Esegui prima 00012_gare_multisquadra.sql, poi 00013_create_20_giochi_spiaggia.sql

-- Tabella per le classifiche delle gare
CREATE TABLE IF NOT EXISTS classifiche_gare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gara_id UUID NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  squadra_id UUID NOT NULL REFERENCES squadre(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL CHECK (posizione > 0),
  punti_assegnati INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gara_id, squadra_id),
  UNIQUE(gara_id, posizione)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_classifiche_gare_gara 
ON classifiche_gare(gara_id);

CREATE INDEX IF NOT EXISTS idx_classifiche_gare_squadra 
ON classifiche_gare(squadra_id);

-- Policy RLS
ALTER TABLE classifiche_gare ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lettura classifiche" ON classifiche_gare;
CREATE POLICY "Lettura classifiche" 
ON classifiche_gare FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert classifiche" ON classifiche_gare;
CREATE POLICY "Insert classifiche" 
ON classifiche_gare FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Update classifiche" ON classifiche_gare;
CREATE POLICY "Update classifiche" 
ON classifiche_gare FOR UPDATE 
USING (true);

-- Funzione per assegnare classifica
CREATE OR REPLACE FUNCTION assegna_classifica_gara(
  p_gara_id UUID,
  p_classifiche JSONB
)
RETURNS VOID AS $$
DECLARE
  v_punti_in_palio INTEGER;
  v_num_squadre INTEGER;
  v_classifica_item JSONB;
  v_squadra_id UUID;
  v_posizione INTEGER;
  v_punti INTEGER;
BEGIN
  SELECT punti_in_palio INTO v_punti_in_palio FROM gare WHERE id = p_gara_id;
  SELECT COUNT(*) INTO v_num_squadre FROM jsonb_array_elements(p_classifiche);
  
  DELETE FROM classifiche_gare WHERE gara_id = p_gara_id;
  
  FOR v_classifica_item IN SELECT * FROM jsonb_array_elements(p_classifiche)
  LOOP
    v_squadra_id := (v_classifica_item->>'squadra_id')::UUID;
    v_posizione := (v_classifica_item->>'posizione')::INTEGER;
    
    v_punti := ROUND(v_punti_in_palio::NUMERIC * (v_num_squadre - v_posizione + 1)::NUMERIC / v_num_squadre::NUMERIC);
    
    INSERT INTO classifiche_gare (gara_id, squadra_id, posizione, punti_assegnati)
    VALUES (p_gara_id, v_squadra_id, v_posizione, v_punti);
    
    UPDATE squadre 
    SET punti_squadra = punti_squadra + v_punti 
    WHERE id = v_squadra_id;
  END LOOP;
  
  UPDATE gare 
  SET stato = 'completata'
  WHERE id = p_gara_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assegna_classifica_gara TO anon, authenticated;

-- Funzione per ottenere classifica gara
CREATE OR REPLACE FUNCTION get_classifica_gara(p_gara_id UUID)
RETURNS TABLE (
  squadra_id UUID,
  squadra_nome TEXT,
  squadra_emoji TEXT,
  posizione INTEGER,
  punti_assegnati INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nome,
    s.emoji,
    cg.posizione,
    cg.punti_assegnati
  FROM classifiche_gare cg
  INNER JOIN squadre s ON cg.squadra_id = s.id
  WHERE cg.gara_id = p_gara_id
  ORDER BY cg.posizione ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_classifica_gara TO anon, authenticated;

-- ✅ Sistema gare completato!
-- Ora gli admin possono definire classifiche per le gare multi-squadra

