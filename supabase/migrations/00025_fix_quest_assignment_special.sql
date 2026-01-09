-- ============================================
-- FIX: ASSEGNAZIONE QUEST RANDOMICHE
-- ============================================
-- Questo script corregge assign_daily_quests per:
-- 1. Escludere le quest speciali (che sono disponibili a tutti)
-- 2. Assegnare solo quest randomiche che cambiano ogni giorno a mezzanotte
-- 3. Le quest speciali sono sempre disponibili e non vengono assegnate

-- ============================================
-- FUNZIONE CORRETTA: ASSEGNA SOLO QUEST RANDOMICHE
-- ============================================
DROP FUNCTION IF EXISTS assign_daily_quests(uuid, integer);

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
  emoji TEXT,
  scadenza TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_assigned_count INTEGER;
  v_today_start TIMESTAMP WITH TIME ZONE;
  v_today_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcola inizio e fine del giorno corrente (mezzanotte a mezzanotte, timezone Italia)
  v_today_start := date_trunc('day', (NOW() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';
  v_today_end := v_today_start + INTERVAL '1 day';
  
  -- Verifica se l'utente ha già le quest assegnate per questo giorno
  -- E se sono state assegnate oggi (non scadute)
  SELECT COUNT(*) INTO v_assigned_count
  FROM user_quest_assignments uqa
  INNER JOIN quest q ON uqa.quest_id = q.id
  WHERE uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND uqa.assigned_at >= v_today_start
    AND uqa.assigned_at < v_today_end
    AND q.attiva = true
    AND COALESCE(q.is_special, false) = false; -- Solo quest randomiche

  -- Se ha già 10 quest assegnate oggi, restituisci quelle esistenti
  IF v_assigned_count >= 10 THEN
    RETURN QUERY
    SELECT 
      q.id,
      q.titolo,
      q.descrizione,
      q.punti,
      q.difficolta,
      q.tipo_prova,
      q.emoji,
      v_today_end as scadenza -- Scade a mezzanotte
    FROM quest q
    INNER JOIN user_quest_assignments uqa ON q.id = uqa.quest_id
    WHERE uqa.user_id = p_user_id 
      AND uqa.giorno = p_giorno
      AND uqa.assigned_at >= v_today_start
      AND uqa.assigned_at < v_today_end
      AND q.attiva = true
      AND COALESCE(q.is_special, false) = false -- Solo quest randomiche
    ORDER BY uqa.assigned_at;
    RETURN;
  END IF;

  -- Rimuovi le quest scadute (assegnate prima di oggi) - solo quelle randomiche
  DELETE FROM user_quest_assignments uqa
  USING quest q
  WHERE uqa.quest_id = q.id
    AND uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND uqa.assigned_at < v_today_start
    AND COALESCE(q.is_special, false) = false; -- Rimuovi solo quest randomiche scadute

  -- Assegna 10 quest randomiche usando un hash deterministico basato sull'ID utente e sul giorno
  -- ESCLUDI le quest speciali (is_special = true)
  INSERT INTO user_quest_assignments (user_id, quest_id, giorno, assigned_at)
  SELECT 
    p_user_id,
    q.id,
    p_giorno,
    NOW() -- Assegna con timestamp corrente
  FROM quest q
  WHERE q.attiva = true
    AND COALESCE(q.is_special, false) = false -- ESCLUDI quest speciali
    AND q.giorno BETWEEN 1 AND 3 -- Solo quest con giorno 1-3 (non speciali)
    AND q.id NOT IN (
      -- Escludi quest già assegnate oggi
      SELECT uqa2.quest_id 
      FROM user_quest_assignments uqa2
      WHERE uqa2.user_id = p_user_id 
        AND uqa2.giorno = p_giorno
        AND uqa2.assigned_at >= v_today_start
        AND uqa2.assigned_at < v_today_end
    )
  ORDER BY md5(q.id::text || p_user_id::text || p_giorno::text || v_today_start::text)
  LIMIT 10;

  -- Restituisci le quest assegnate con scadenza a mezzanotte
  RETURN QUERY
  SELECT 
    q.id,
    q.titolo,
    q.descrizione,
    q.punti,
    q.difficolta,
    q.tipo_prova,
    q.emoji,
    v_today_end as scadenza -- Scade a mezzanotte del giorno successivo
  FROM quest q
  INNER JOIN user_quest_assignments uqa ON q.id = uqa.quest_id
  WHERE uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND uqa.assigned_at >= v_today_start
    AND uqa.assigned_at < v_today_end
    AND q.attiva = true
    AND COALESCE(q.is_special, false) = false -- Solo quest randomiche
  ORDER BY uqa.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_daily_quests TO anon, authenticated;

-- ============================================
-- FUNZIONE AGGIORNATA: GET_USER_QUESTS
-- ============================================
-- Restituisce solo le quest randomiche assegnate (non le speciali)
-- Le quest speciali vengono caricate separatamente nel frontend
DROP FUNCTION IF EXISTS get_user_quests(uuid, integer);

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
  completed BOOLEAN,
  is_special BOOLEAN
) AS $$
DECLARE
  v_today_start TIMESTAMP WITH TIME ZONE;
  v_today_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcola inizio e fine del giorno corrente (mezzanotte a mezzanotte, timezone Italia)
  v_today_start := date_trunc('day', (NOW() AT TIME ZONE 'Europe/Rome')) AT TIME ZONE 'Europe/Rome';
  v_today_end := v_today_start + INTERVAL '1 day';
  
  RETURN QUERY
  SELECT 
    q.id,
    q.titolo,
    q.descrizione,
    q.punti,
    q.difficolta,
    q.tipo_prova,
    q.emoji,
    v_today_end as scadenza, -- Scade a mezzanotte
    uqa.assigned_at,
    (uqa.completed_at IS NOT NULL) as completed,
    COALESCE(q.is_special, false) as is_special
  FROM user_quest_assignments uqa
  INNER JOIN quest q ON uqa.quest_id = q.id
  WHERE uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND uqa.assigned_at >= v_today_start
    AND uqa.assigned_at < v_today_end
    AND q.attiva = true
    AND COALESCE(q.is_special, false) = false -- Solo quest randomiche
  ORDER BY uqa.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_quests TO anon, authenticated;

-- ============================================
-- NOTA IMPORTANTE
-- ============================================
-- Le quest speciali (is_special = true) sono sempre disponibili a tutti
-- e vengono caricate separatamente nel frontend tramite:
-- SELECT * FROM quest WHERE is_special = true AND attiva = true
--
-- Le quest randomiche vengono assegnate automaticamente:
-- - Quando l'utente accede (chiamata a assign_daily_quests)
-- - Cambiano automaticamente a mezzanotte (controllo della data)
-- - Ogni utente riceve 10 quest diverse basate su hash deterministico
