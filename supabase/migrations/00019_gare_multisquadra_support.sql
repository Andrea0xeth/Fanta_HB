-- ============================================
-- SUPPORTO GARE MULTI-SQUADRA
-- ============================================
-- Aggiunge supporto per gare con più di 2 squadre

-- Tabella per memorizzare tutte le squadre partecipanti a una gara
CREATE TABLE IF NOT EXISTS gare_squadre (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gara_id UUID NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  squadra_id UUID NOT NULL REFERENCES squadre(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gara_id, squadra_id) -- Una squadra può partecipare solo una volta per gara
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_gare_squadre_gara 
ON gare_squadre(gara_id);

CREATE INDEX IF NOT EXISTS idx_gare_squadre_squadra 
ON gare_squadre(squadra_id);

-- Policy RLS
ALTER TABLE gare_squadre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettura gare_squadre" 
ON gare_squadre FOR SELECT 
USING (true);

CREATE POLICY "Insert gare_squadre" 
ON gare_squadre FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Update gare_squadre" 
ON gare_squadre FOR UPDATE 
USING (true);

CREATE POLICY "Delete gare_squadre" 
ON gare_squadre FOR DELETE 
USING (true);

-- Rimuovi il CHECK che limita a solo 2 squadre diverse
-- (manteniamo squadra_a_id e squadra_b_id per retrocompatibilità)
ALTER TABLE gare 
DROP CONSTRAINT IF EXISTS gare_squadra_a_id_check,
DROP CONSTRAINT IF EXISTS gare_squadra_b_id_check;

-- Rendi squadra_a_id e squadra_b_id nullable per supportare gare con più squadre
-- (manteniamo per retrocompatibilità, ma non sono più obbligatori)
ALTER TABLE gare
ALTER COLUMN squadra_a_id DROP NOT NULL,
ALTER COLUMN squadra_b_id DROP NOT NULL;

-- Rimuovi il CHECK che richiede squadra_a_id != squadra_b_id
-- (ora possiamo avere più squadre)
ALTER TABLE gare
DROP CONSTRAINT IF EXISTS gare_squadra_a_id_squadra_b_id_check;

-- ============================================
-- FUNZIONE PER OTTENERE SQUADRE PARTECIPANTI
-- ============================================
CREATE OR REPLACE FUNCTION get_squadre_partecipanti(p_gara_id UUID)
RETURNS TABLE (
  squadra_id UUID,
  squadra_nome TEXT,
  squadra_emoji TEXT,
  squadra_colore TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nome,
    s.emoji,
    s.colore
  FROM gare_squadre gs
  INNER JOIN squadre s ON gs.squadra_id = s.id
  WHERE gs.gara_id = p_gara_id
  ORDER BY gs.created_at ASC; -- Ordine di inserimento
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_squadre_partecipanti TO anon, authenticated;

-- ============================================
-- FUNZIONE PER AGGIUNGERE SQUADRE A UNA GARA
-- ============================================
CREATE OR REPLACE FUNCTION aggiungi_squadre_a_gara(
  p_gara_id UUID,
  p_squadre_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_squadra_id UUID;
BEGIN
  -- Rimuovi squadre esistenti per questa gara
  DELETE FROM gare_squadre WHERE gara_id = p_gara_id;
  
  -- Aggiungi tutte le squadre
  FOREACH v_squadra_id IN ARRAY p_squadre_ids
  LOOP
    INSERT INTO gare_squadre (gara_id, squadra_id)
    VALUES (p_gara_id, v_squadra_id)
    ON CONFLICT (gara_id, squadra_id) DO NOTHING;
  END LOOP;
  
  -- Aggiorna squadra_a_id e squadra_b_id per retrocompatibilità (prime due squadre)
  IF array_length(p_squadre_ids, 1) >= 1 THEN
    UPDATE gare SET squadra_a_id = p_squadre_ids[1] WHERE id = p_gara_id;
  END IF;
  
  IF array_length(p_squadre_ids, 1) >= 2 THEN
    UPDATE gare SET squadra_b_id = p_squadre_ids[2] WHERE id = p_gara_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION aggiungi_squadre_a_gara TO anon, authenticated;

