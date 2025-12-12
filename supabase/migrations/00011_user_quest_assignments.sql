-- ============================================
-- SISTEMA DI ASSEGNAZIONE QUEST PER UTENTE
-- ============================================
-- Ogni utente riceve 3 quest casuali ogni giorno

-- Tabella per tracciare le quest assegnate agli utenti
CREATE TABLE IF NOT EXISTS user_quest_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  giorno INTEGER NOT NULL CHECK (giorno BETWEEN 1 AND 3),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, quest_id, giorno) -- Un utente può avere una quest solo una volta per giorno
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_user_giorno 
ON user_quest_assignments(user_id, giorno);

CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_quest 
ON user_quest_assignments(quest_id);

-- Policy RLS
ALTER TABLE user_quest_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettura assegnazioni proprie" 
ON user_quest_assignments FOR SELECT 
USING (true);

CREATE POLICY "Insert assegnazioni" 
ON user_quest_assignments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Update assegnazioni" 
ON user_quest_assignments FOR UPDATE 
USING (true);

-- ============================================
-- FUNZIONE PER ASSEGNARE 3 QUEST CASUALI
-- ============================================
CREATE OR REPLACE FUNCTION assign_daily_quests(
  p_user_id UUID,
  p_giorno INTEGER
)
RETURNS TABLE (
  quest_id UUID,
  titolo TEXT,
  descrizione TEXT,
  punti INTEGER,
  difficolta TEXT,
  tipo_prova TEXT[],
  emoji TEXT
) AS $$
DECLARE
  v_assigned_count INTEGER;
BEGIN
  -- Verifica se l'utente ha già le quest assegnate per questo giorno
  SELECT COUNT(*) INTO v_assigned_count
  FROM user_quest_assignments
  WHERE user_id = p_user_id AND giorno = p_giorno;

  -- Se ha già 3 quest, non assegnare di nuovo
  IF v_assigned_count >= 3 THEN
    RETURN QUERY
    SELECT 
      q.id,
      q.titolo,
      q.descrizione,
      q.punti,
      q.difficolta,
      q.tipo_prova,
      q.emoji
    FROM quest q
    INNER JOIN user_quest_assignments uqa ON q.id = uqa.quest_id
    WHERE uqa.user_id = p_user_id 
      AND uqa.giorno = p_giorno
      AND q.attiva = true
    ORDER BY uqa.assigned_at;
    RETURN;
  END IF;

  -- Rimuovi eventuali assegnazioni incomplete per questo giorno
  DELETE FROM user_quest_assignments
  WHERE user_id = p_user_id AND giorno = p_giorno;

  -- Assegna 3 quest casuali tra quelle attive
  -- Usa tutte le quest disponibili (non solo quelle del giorno specifico)
  -- per avere più varietà
  INSERT INTO user_quest_assignments (user_id, quest_id, giorno)
  SELECT 
    p_user_id,
    q.id,
    p_giorno
  FROM quest q
  WHERE q.attiva = true
  ORDER BY RANDOM()
  LIMIT 3;

  -- Restituisci le quest assegnate
  RETURN QUERY
  SELECT 
    q.id,
    q.titolo,
    q.descrizione,
    q.punti,
    q.difficolta,
    q.tipo_prova,
    q.emoji
  FROM quest q
  INNER JOIN user_quest_assignments uqa ON q.id = uqa.quest_id
  WHERE uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND q.attiva = true
  ORDER BY uqa.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_daily_quests TO anon, authenticated;

-- ============================================
-- FUNZIONE PER OTTENERE LE QUEST ASSEGNATE
-- ============================================
CREATE OR REPLACE FUNCTION get_user_quests(
  p_user_id UUID,
  p_giorno INTEGER
)
RETURNS TABLE (
  quest_id UUID,
  titolo TEXT,
  descrizione TEXT,
  punti INTEGER,
  difficolta TEXT,
  tipo_prova TEXT[],
  emoji TEXT,
  scadenza TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.titolo,
    q.descrizione,
    q.punti,
    q.difficolta,
    q.tipo_prova,
    q.emoji,
    q.scadenza,
    uqa.assigned_at,
    (uqa.completed_at IS NOT NULL) as completed
  FROM user_quest_assignments uqa
  INNER JOIN quest q ON uqa.quest_id = q.id
  WHERE uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND q.attiva = true
  ORDER BY uqa.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_quests TO anon, authenticated;

