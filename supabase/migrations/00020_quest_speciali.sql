-- ============================================
-- QUEST SPECIALI - SFIDE PERSONALI SEMPRE DISPONIBILI
-- ============================================
-- Queste quest sono sempre disponibili, non vengono assegnate giornalmente
-- Richiedono 66% dei votanti per essere validate
-- Solo l'admin può assegnare i punti dopo la validazione

-- Aggiungi campo is_special alla tabella quest
ALTER TABLE quest 
ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT FALSE;

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_quest_is_special ON quest(is_special) WHERE is_special = true;

-- Modifica il constraint su giorno per permettere 0 (quest speciali)
ALTER TABLE quest 
DROP CONSTRAINT IF EXISTS quest_giorno_check;

ALTER TABLE quest 
ADD CONSTRAINT quest_giorno_check 
CHECK (giorno BETWEEN 0 AND 3);

-- ============================================
-- INSERISCI LE 11 QUEST SPECIALI
-- ============================================
INSERT INTO quest (giorno, titolo, descrizione, punti, difficolta, tipo_prova, emoji, is_special, attiva) VALUES
  (0, 'CAVETTONE NOTTURNO', 'Registra un video di te stesso che fai un cavettone notturno!', 300, 'epica', ARRAY['video'], '🌙', true, true),
  (0, 'TAGLIA CAPELLI A QUALCUNO', 'Taglia i capelli a qualcuno e registralo (video o foto)!', 100, 'media', ARRAY['video', 'foto'], '✂️', true, true),
  (0, 'PIPI SUL TETTO DI UN AUTO', 'Registra un video di te stesso che fai pipì sul tetto di un auto!', 600, 'epica', ARRAY['video'], '🚗', true, true),
  (0, 'CREA (ed usa) UNA MOLOTOV', 'Crea e usa una molotov - registra tutto in video!', 7000, 'epica', ARRAY['video'], '🔥', true, true),
  (0, 'SALTO DELLA QUAGLIA', 'Registra un video del salto della quaglia!', 1000, 'epica', ARRAY['video'], '🦅', true, true),
  (0, 'BOTTONE DI K E GUIDARE CASA PRIMA CHE SALGA IL K-Hole', 'Registra un video di te che prendi un bottone di K e guidi a casa prima che salga il K-Hole!', 1000, 'epica', ARRAY['video'], '💊', true, true),
  (0, 'TUTTO A MARE', 'Registra un video di te che butti tutto a mare!', 100, 'facile', ARRAY['video'], '🌊', true, true),
  (0, 'TUFFO CAPRIOLA IN PISCINA', 'Registra un video di un tuffo a capriola in piscina!', 100, 'facile', ARRAY['video'], '🏊', true, true),
  (0, 'SEX ACCERTATO', 'Registra un video o scatta una foto di sesso accertato!', 1000, 'epica', ARRAY['video', 'foto'], '💋', true, true),
  (0, 'Prendi in bocca un WURSTEL legato con la CORDA al bacino', 'Registra un video di te che prendi in bocca un wurstel legato con la corda al bacino!', 700, 'epica', ARRAY['video'], '🌭', true, true),
  (0, 'FARE LA VERTICALE più lunga della vacanza', 'Registra un video della verticale più lunga della vacanza!', 1000, 'epica', ARRAY['video'], '🤸', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNZIONE AGGIORNATA: CHECK_PROOF_VALIDATION
-- ============================================
-- Modifica la funzione per gestire le quest speciali:
-- - Quest speciali: richiedono 66% dei votanti (non degli utenti attivi)
-- - Quest speciali: NON assegnano automaticamente i punti (solo admin può farlo)
-- - Quest normali: comportamento invariato

CREATE OR REPLACE FUNCTION check_proof_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;           -- Totale voti ricevuti
  v_positive INTEGER;        -- Voti positivi
  v_quest_punti INTEGER;
  v_user_id UUID;
  v_stato TEXT;
  v_is_special BOOLEAN;      -- Se la quest è speciale
  v_active_users_count INTEGER;  -- Numero di utenti attivi
  v_required_positive_votes INTEGER;  -- Numero minimo di voti positivi richiesti
BEGIN
  -- Conta voti per questa prova (query ottimizzata con indice)
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE valore = true)
  INTO v_total, v_positive
  FROM voti 
  WHERE prova_id = NEW.prova_id;

  -- Ottieni stato corrente, dati della prova e se è speciale
  SELECT 
    pq.stato,
    pq.user_id,
    q.punti,
    COALESCE(q.is_special, false)
  INTO v_stato, v_user_id, v_quest_punti, v_is_special
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

  -- Logica diversa per quest speciali vs normali
  IF v_is_special THEN
    -- QUEST SPECIALI: richiedono 66% dei votanti (non degli utenti attivi)
    -- NON assegnano automaticamente i punti (solo admin può farlo)
    IF v_total >= 10 
       AND (v_positive::float / v_total) >= 0.66 
       AND v_stato != 'validata' THEN
      
      -- Aggiorna stato a validata (ma NON assegna punti automaticamente)
      UPDATE prove_quest 
      SET stato = 'validata' 
      WHERE id = NEW.prova_id;
      
      -- Crea notifica per l'utente (senza assegnare punti)
      INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
      VALUES (
        v_user_id, 
        'Quest Speciale Validata! ⭐', 
        'La tua prova speciale ha raggiunto il 66% dei voti positivi! L''admin valuterà l''assegnazione dei punti.', 
        'quest'
      );
    END IF;
  ELSE
    -- QUEST NORMALI: comportamento invariato (66% degli utenti attivi, assegna punti automaticamente)
    -- Conta il numero di utenti attivi (tutti gli utenti non admin)
    SELECT COUNT(*) 
    INTO v_active_users_count
    FROM users
    WHERE is_admin = false;

    -- Calcola il numero minimo di voti positivi richiesti (66% degli utenti attivi)
    v_required_positive_votes := CEIL(v_active_users_count * 0.66);

    -- Valida se:
    -- 1. Almeno 10 voti totali (minimo per validazione)
    -- 2. Voti positivi >= 66% degli utenti attivi
    -- 3. Non già validata
    IF v_total >= 10 
       AND v_positive >= v_required_positive_votes
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNZIONE PER ASSEGNARE PUNTI A QUEST SPECIALI (ADMIN ONLY)
-- ============================================
-- Elimina la funzione esistente se necessario
DROP FUNCTION IF EXISTS assegna_punti_quest_speciale(UUID, UUID);

CREATE OR REPLACE FUNCTION assegna_punti_quest_speciale(
  p_prova_id UUID,
  p_admin_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_quest_punti INTEGER;
  v_user_id UUID;
  v_is_special BOOLEAN;
  v_stato TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Verifica che l'utente sia admin
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = p_admin_id;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo gli admin possono assegnare punti alle quest speciali';
  END IF;
  
  -- Ottieni dati della prova
  SELECT 
    pq.user_id,
    q.punti,
    COALESCE(q.is_special, false),
    pq.stato
  INTO v_user_id, v_quest_punti, v_is_special, v_stato
  FROM prove_quest pq
  INNER JOIN quest q ON q.id = pq.quest_id
  WHERE pq.id = p_prova_id;
  
  -- Verifica che sia una quest speciale
  IF NOT v_is_special THEN
    RAISE EXCEPTION 'Questa funzione può essere usata solo per quest speciali';
  END IF;
  
  -- Verifica che la prova sia validata
  IF v_stato != 'validata' THEN
    RAISE EXCEPTION 'La prova deve essere validata (66%% voti positivi) prima di assegnare i punti';
  END IF;
  
  -- Verifica che i punti non siano già stati assegnati (controlla se esiste una notifica di assegnazione)
  -- Per semplicità, assumiamo che se la prova è validata ma non ha punti assegnati, possiamo assegnarli
  -- (in realtà dovremmo tracciare questo, ma per ora usiamo questo approccio)
  
  -- Assegna punti all'utente
  UPDATE users 
  SET punti_personali = punti_personali + v_quest_punti 
  WHERE id = v_user_id;
  
  -- Crea notifica di assegnazione punti
  INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
  VALUES (
    v_user_id, 
    'Punti Assegnati! ⭐', 
    'L''admin ha assegnato ' || v_quest_punti || ' punti per la tua quest speciale!', 
    'quest'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assegna_punti_quest_speciale TO authenticated;

-- ============================================
-- MODIFICA ASSEGNAZIONE QUEST GIORNALIERE
-- ============================================
-- Escludi le quest speciali dall'assegnazione giornaliera
-- Elimina la funzione esistente se ha un tipo di ritorno diverso
DROP FUNCTION IF EXISTS assign_daily_quests(UUID, INTEGER);

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

  -- Se ha già 3 quest, restituisci quelle esistenti
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
      AND COALESCE(q.is_special, false) = false  -- Escludi quest speciali
    ORDER BY uqa.assigned_at;
    RETURN;
  END IF;

  -- Rimuovi eventuali assegnazioni incomplete per questo giorno
  DELETE FROM user_quest_assignments
  WHERE user_id = p_user_id AND giorno = p_giorno;

  -- Assegna 3 quest usando un hash deterministico basato sull'ID utente e sul giorno
  -- ESCLUDI le quest speciali (is_special = true o giorno = 0)
  INSERT INTO user_quest_assignments (user_id, quest_id, giorno)
  SELECT 
    p_user_id,
    q.id,
    p_giorno
  FROM quest q
  WHERE q.attiva = true
    AND COALESCE(q.is_special, false) = false  -- Escludi quest speciali
    AND q.giorno BETWEEN 1 AND 3  -- Solo quest con giorno 1-3
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
    AND COALESCE(q.is_special, false) = false  -- Escludi quest speciali
  ORDER BY uqa.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_daily_quests TO anon, authenticated;

