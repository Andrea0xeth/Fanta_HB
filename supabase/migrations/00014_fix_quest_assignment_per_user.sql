-- ============================================
-- FIX: ASSEGNAZIONE QUEST DIVERSE PER UTENTE
-- ============================================
-- Modifica la funzione assign_daily_quests per garantire che
-- ogni utente riceva quest diverse usando un hash deterministico
-- basato sull'ID utente e sul giorno

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

  -- Assegna 3 quest usando un hash deterministico basato sull'ID utente e sul giorno
  -- Questo garantisce che ogni utente riceva quest diverse ma deterministiche
  -- L'hash combina l'ID della quest con l'ID utente e il giorno per creare
  -- un ordine diverso per ogni utente
  INSERT INTO user_quest_assignments (user_id, quest_id, giorno)
  SELECT 
    p_user_id,
    q.id,
    p_giorno
  FROM quest q
  WHERE q.attiva = true
  ORDER BY md5(q.id::text || p_user_id::text || p_giorno::text)
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

