-- ============================================
-- OTTIMIZZAZIONE SISTEMA VOTAZIONE E QUEST
-- ============================================
-- Esegui questo script nella Supabase SQL Editor
-- https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new
--
-- Questo script ottimizza:
-- 1. ✅ Indici per performance su voti e prove_quest
-- 2. ✅ Funzione di validazione ottimizzata
-- 3. ✅ RLS policies complete
-- 4. ✅ Fix assegnazione quest diverse per utente

-- ============================================
-- PARTE 1: INDICI PER PERFORMANCE
-- ============================================

-- Indici per prove_quest (query comuni)
CREATE INDEX IF NOT EXISTS idx_prove_quest_quest_id 
ON prove_quest(quest_id);

CREATE INDEX IF NOT EXISTS idx_prove_quest_stato_user 
ON prove_quest(stato, user_id) 
WHERE stato IN ('in_verifica', 'validata');

CREATE INDEX IF NOT EXISTS idx_prove_quest_created_at 
ON prove_quest(created_at DESC);

-- Indici per voti (critici per il trigger)
CREATE INDEX IF NOT EXISTS idx_voti_prova_id 
ON voti(prova_id);

CREATE INDEX IF NOT EXISTS idx_voti_user_id 
ON voti(user_id);

CREATE INDEX IF NOT EXISTS idx_voti_prova_user 
ON voti(prova_id, user_id);

-- Indici per user_quest_assignments
CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_user_giorno 
ON user_quest_assignments(user_id, giorno);

CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_quest 
ON user_quest_assignments(quest_id);

CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_completed 
ON user_quest_assignments(user_id, completed_at) 
WHERE completed_at IS NOT NULL;

-- ============================================
-- PARTE 2: FUNZIONE DI VALIDAZIONE OTTIMIZZATA
-- ============================================

CREATE OR REPLACE FUNCTION check_proof_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_positive INTEGER;
  v_quest_punti INTEGER;
  v_user_id UUID;
  v_stato TEXT;
BEGIN
  -- Conta voti per questa prova (query ottimizzata con indice)
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE valore = true)
  INTO v_total, v_positive
  FROM voti 
  WHERE prova_id = NEW.prova_id;

  -- Ottieni stato corrente e dati della prova in una query
  SELECT 
    pq.stato,
    pq.user_id,
    q.punti
  INTO v_stato, v_user_id, v_quest_punti
  FROM prove_quest pq
  INNER JOIN quest q ON q.id = pq.quest_id
  WHERE pq.id = NEW.prova_id;

  -- Aggiorna contatori nella prova (solo se cambiati)
  UPDATE prove_quest 
  SET 
    voti_totali = v_total, 
    voti_positivi = v_positive
  WHERE id = NEW.prova_id
    AND (voti_totali != v_total OR voti_positivi != v_positive);

  -- Valida se >= 3 voti, >= 66% positivi, e non già validata
  IF v_total >= 3 
     AND (v_positive::float / v_total) >= 0.66 
     AND v_stato != 'validata' THEN
    
    -- Aggiorna stato a validata
    UPDATE prove_quest 
    SET stato = 'validata' 
    WHERE id = NEW.prova_id;
    
    -- Assegna punti all'utente (atomic update)
    UPDATE users 
    SET punti_personali = punti_personali + v_quest_punti 
    WHERE id = v_user_id;
    
    -- Aggiorna completed_at nell'assegnazione quest
    UPDATE user_quest_assignments
    SET completed_at = NOW()
    WHERE user_id = v_user_id 
      AND quest_id = (SELECT quest_id FROM prove_quest WHERE id = NEW.prova_id)
      AND completed_at IS NULL;
    
    -- Crea notifica
    INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
    VALUES (
      v_user_id, 
      'Quest Validata! 🎉', 
      'La tua prova è stata validata! +' || v_quest_punti || ' punti', 
      'quest'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 3: FIX ASSEGNAZIONE QUEST DIVERSE
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

  -- Assegna 3 quest usando un hash deterministico basato sull'ID utente e sul giorno
  -- Questo garantisce che ogni utente riceva quest diverse ma deterministiche
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

-- ============================================
-- PARTE 4: RLS POLICIES (Verifica e Fix)
-- ============================================

-- Abilita RLS se non già abilitato
ALTER TABLE prove_quest ENABLE ROW LEVEL SECURITY;
ALTER TABLE voti ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_assignments ENABLE ROW LEVEL SECURITY;

-- Policies per prove_quest
DROP POLICY IF EXISTS "Lettura pubblica prove" ON prove_quest;
CREATE POLICY "Lettura pubblica prove" 
ON prove_quest FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert prove anon" ON prove_quest;
CREATE POLICY "Insert prove anon" 
ON prove_quest FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Update prove" ON prove_quest;
CREATE POLICY "Update prove" 
ON prove_quest FOR UPDATE 
USING (true);

-- Policies per voti
DROP POLICY IF EXISTS "Lettura pubblica voti" ON voti;
CREATE POLICY "Lettura pubblica voti" 
ON voti FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert voti anon" ON voti;
CREATE POLICY "Insert voti anon" 
ON voti FOR INSERT 
WITH CHECK (true);

-- Policies per user_quest_assignments
DROP POLICY IF EXISTS "Lettura assegnazioni proprie" ON user_quest_assignments;
CREATE POLICY "Lettura assegnazioni proprie" 
ON user_quest_assignments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert assegnazioni" ON user_quest_assignments;
CREATE POLICY "Insert assegnazioni" 
ON user_quest_assignments FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Update assegnazioni" ON user_quest_assignments;
CREATE POLICY "Update assegnazioni" 
ON user_quest_assignments FOR UPDATE 
USING (true);

-- ============================================
-- PARTE 5: TRIGGER (Verifica e Ricrea)
-- ============================================

-- Rimuovi trigger esistente se presente
DROP TRIGGER IF EXISTS trigger_check_validation ON voti;

-- Ricrea trigger con funzione ottimizzata
CREATE TRIGGER trigger_check_validation
AFTER INSERT ON voti
FOR EACH ROW
EXECUTE FUNCTION check_proof_validation();

-- ============================================
-- PARTE 6: ANALISI STATISTICHE (Opzionale)
-- ============================================

-- Aggiorna statistiche per query planner
ANALYZE prove_quest;
ANALYZE voti;
ANALYZE user_quest_assignments;
ANALYZE quest;

-- ============================================
-- VERIFICA FINALE
-- ============================================

-- Verifica che tutto sia stato creato correttamente
DO $$
DECLARE
  v_index_count INTEGER;
  v_trigger_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Conta indici
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('prove_quest', 'voti', 'user_quest_assignments')
    AND indexname LIKE 'idx_%';
  
  -- Conta trigger
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname = 'trigger_check_validation';
  
  -- Conta funzioni
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname IN ('check_proof_validation', 'assign_daily_quests');
  
  RAISE NOTICE '✅ Indici creati: %', v_index_count;
  RAISE NOTICE '✅ Trigger creati: %', v_trigger_count;
  RAISE NOTICE '✅ Funzioni create: %', v_function_count;
  
  IF v_index_count >= 8 AND v_trigger_count = 1 AND v_function_count = 2 THEN
    RAISE NOTICE '🎉 Sistema ottimizzato con successo!';
  ELSE
    RAISE WARNING '⚠️ Verifica manuale necessaria';
  END IF;
END $$;

-- ============================================
-- FINE SCRIPT
-- ============================================
-- ✅ Tutte le ottimizzazioni sono state applicate
-- ✅ Il sistema di votazione è ora ottimizzato
-- ✅ Le quest vengono assegnate in modo diverso per utente
-- ✅ Performance migliorate con indici appropriati

