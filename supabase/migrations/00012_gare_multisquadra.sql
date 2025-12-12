-- ============================================
-- SISTEMA GARE MULTI-SQUADRA CON CLASSIFICHE
-- ============================================
-- Modifica le gare per supportare più squadre e classifiche

-- Tabella per le classifiche delle gare
CREATE TABLE IF NOT EXISTS classifiche_gare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gara_id UUID NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  squadra_id UUID NOT NULL REFERENCES squadre(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL CHECK (posizione > 0),
  punti_assegnati INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gara_id, squadra_id), -- Una squadra può avere solo una posizione per gara
  UNIQUE(gara_id, posizione) -- Ogni posizione può essere assegnata solo a una squadra
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_classifiche_gare_gara 
ON classifiche_gare(gara_id);

CREATE INDEX IF NOT EXISTS idx_classifiche_gare_squadra 
ON classifiche_gare(squadra_id);

-- Policy RLS
ALTER TABLE classifiche_gare ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettura classifiche" 
ON classifiche_gare FOR SELECT 
USING (true);

CREATE POLICY "Insert classifiche" 
ON classifiche_gare FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Update classifiche" 
ON classifiche_gare FOR UPDATE 
USING (true);

-- ============================================
-- FUNZIONE PER ASSEGNARE CLASSIFICA
-- ============================================
-- Questa funzione permette agli admin di definire la classifica di una gara
-- Le posizioni devono essere uniche e consecutive (1, 2, 3, ...)
CREATE OR REPLACE FUNCTION assegna_classifica_gara(
  p_gara_id UUID,
  p_classifiche JSONB -- Array di {squadra_id, posizione}
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
  -- Ottieni punti in palio e numero di squadre
  SELECT punti_in_palio INTO v_punti_in_palio FROM gare WHERE id = p_gara_id;
  SELECT COUNT(*) INTO v_num_squadre FROM jsonb_array_elements(p_classifiche);
  
  -- Rimuovi classifiche esistenti per questa gara
  DELETE FROM classifiche_gare WHERE gara_id = p_gara_id;
  
  -- Calcola e assegna punti in base alla posizione
  -- Formula: punti = punti_in_palio * (num_squadre - posizione + 1) / num_squadre
  -- Esempio con 4 squadre e 100 punti:
  -- 1°: 100 * (4-1+1)/4 = 100 punti
  -- 2°: 100 * (4-2+1)/4 = 75 punti
  -- 3°: 100 * (4-3+1)/4 = 50 punti
  -- 4°: 100 * (4-4+1)/4 = 25 punti
  
  FOR v_classifica_item IN SELECT * FROM jsonb_array_elements(p_classifiche)
  LOOP
    v_squadra_id := (v_classifica_item->>'squadra_id')::UUID;
    v_posizione := (v_classifica_item->>'posizione')::INTEGER;
    
    -- Calcola punti per questa posizione
    v_punti := ROUND(v_punti_in_palio::NUMERIC * (v_num_squadre - v_posizione + 1)::NUMERIC / v_num_squadre::NUMERIC);
    
    -- Inserisci classifica
    INSERT INTO classifiche_gare (gara_id, squadra_id, posizione, punti_assegnati)
    VALUES (p_gara_id, v_squadra_id, v_posizione, v_punti);
    
    -- Aggiorna punti squadra
    UPDATE squadre 
    SET punti_squadra = punti_squadra + v_punti 
    WHERE id = v_squadra_id;
  END LOOP;
  
  -- Aggiorna stato gara
  UPDATE gare 
  SET stato = 'completata'
  WHERE id = p_gara_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assegna_classifica_gara TO anon, authenticated;

-- ============================================
-- FUNZIONE PER OTTENERE CLASSIFICA GARA
-- ============================================
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

