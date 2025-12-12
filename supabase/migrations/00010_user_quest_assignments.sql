-- ============================================
-- SISTEMA QUEST PER UTENTE
-- ============================================
-- Questo script crea il sistema per assegnare quest personalizzate agli utenti

-- Tabella per assegnare quest agli utenti (3 per giorno)
CREATE TABLE IF NOT EXISTS user_quest_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  giorno INTEGER NOT NULL CHECK (giorno BETWEEN 1 AND 3),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id, giorno) -- Un utente può avere una quest solo una volta per giorno
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_user_giorno 
ON user_quest_assignments(user_id, giorno);

CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_quest 
ON user_quest_assignments(quest_id);

-- Policy per lettura e inserimento
CREATE POLICY "Lettura assegnazioni proprie" ON user_quest_assignments 
FOR SELECT USING (true);

CREATE POLICY "Insert assegnazioni" ON user_quest_assignments 
FOR INSERT WITH CHECK (true);

-- Funzione per assegnare 3 quest casuali a un utente per un giorno
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
  v_quest_ids UUID[];
BEGIN
  -- Rimuovi assegnazioni esistenti per questo utente e giorno (se esistono)
  DELETE FROM user_quest_assignments 
  WHERE user_id = p_user_id AND giorno = p_giorno;
  
  -- Seleziona 3 quest usando un hash deterministico basato sull'ID utente e sul giorno
  -- Questo garantisce che ogni utente riceva quest diverse ma deterministiche
  SELECT ARRAY_AGG(id ORDER BY md5(id::text || p_user_id::text || p_giorno::text))
  INTO v_quest_ids
  FROM quest
  WHERE attiva = true
    AND id NOT IN (
      SELECT quest_id 
      FROM user_quest_assignments 
      WHERE user_id = p_user_id AND giorno = p_giorno
    )
  LIMIT 3;
  
  -- Se non ci sono abbastanza quest, prendi comunque quelle disponibili
  IF array_length(v_quest_ids, 1) < 3 THEN
    SELECT ARRAY_AGG(id ORDER BY md5(id::text || p_user_id::text || p_giorno::text))
    INTO v_quest_ids
    FROM quest
    WHERE attiva = true
    LIMIT 3;
  END IF;
  
  -- Inserisci le assegnazioni
  IF v_quest_ids IS NOT NULL THEN
    INSERT INTO user_quest_assignments (user_id, quest_id, giorno)
    SELECT p_user_id, unnest(v_quest_ids), p_giorno;
  END IF;
  
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
  WHERE q.id = ANY(v_quest_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_daily_quests TO anon, authenticated;

-- Funzione per assegnare quest a tutti gli utenti per un giorno
CREATE OR REPLACE FUNCTION assign_daily_quests_to_all_users(p_giorno INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Per ogni utente, assegna 3 quest casuali
  FOR v_user_id IN SELECT id FROM users
  LOOP
    PERFORM assign_daily_quests(v_user_id, p_giorno);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_daily_quests_to_all_users TO anon, authenticated;



