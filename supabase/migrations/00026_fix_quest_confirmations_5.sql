-- ============================================
-- FIX: SISTEMA CONFERME E ASSEGNAZIONE PUNTI
-- ============================================
-- Questo script corregge il sistema di conferme e assegnazione punti:
-- 1. Riduce le conferme richieste da 10 a 5 per le quest normali
-- 2. Assegna i punti immediatamente quando si raggiungono 5 conferme (non aspetta mezzanotte)
-- 3. Mantiene le quest speciali con conferma admin (già corretto)
-- 4. Non resetta le quest già completate (già corretto)

-- ============================================
-- FUNZIONE AGGIORNATA: CHECK_PROOF_VALIDATION
-- ============================================
-- Modifica la funzione per:
-- - Quest normali: richiedono 5 conferme (voti positivi) invece di 10
-- - Quest normali: assegnano punti immediatamente quando si raggiungono 5 conferme
-- - Quest speciali: richiedono 66% dei votanti e conferma admin (invariato)

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
    -- QUEST NORMALI: richiedono 5 conferme (voti positivi) invece di 10
    -- Assegnano punti immediatamente quando si raggiungono 5 conferme
    
    -- Valida se:
    -- 1. Almeno 5 voti positivi (conferme)
    -- 2. Non già validata
    IF v_positive >= 5 
       AND v_stato != 'validata' THEN
      
      -- Aggiorna stato a validata
      UPDATE prove_quest 
      SET stato = 'validata' 
      WHERE id = NEW.prova_id;
      
      -- Assegna punti all'utente IMMEDIATAMENTE (atomic update)
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
-- VERIFICA
-- ============================================
-- Mostra la funzione aggiornata
SELECT 
  proname as function_name,
  CASE 
    WHEN prosrc LIKE '%v_positive >= 5%' AND prosrc LIKE '%v_is_special%' THEN '✅ Aggiornata (5 conferme per normali)'
    WHEN prosrc LIKE '%v_total >= 10%' AND prosrc LIKE '%v_is_special%' THEN '❌ Vecchia (10 voti per normali)'
    ELSE '⚠️ Sconosciuta'
  END as stato
FROM pg_proc
WHERE proname = 'check_proof_validation';

-- ============================================
-- FUNZIONE AGGIORNATA: ASSIGN_DAILY_QUESTS
-- ============================================
-- Modifica la funzione per non rimuovere le quest già completate
-- quando cambiano a mezzanotte

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

  -- Rimuovi le quest scadute (assegnate prima di oggi) - solo quelle randomiche NON completate
  -- IMPORTANTE: Non rimuovere le quest già completate (completed_at IS NOT NULL)
  DELETE FROM user_quest_assignments uqa
  USING quest q
  WHERE uqa.quest_id = q.id
    AND uqa.user_id = p_user_id 
    AND uqa.giorno = p_giorno
    AND uqa.assigned_at < v_today_start
    AND uqa.completed_at IS NULL -- NON rimuovere le quest completate
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
      -- Escludi quest già assegnate oggi o completate in passato
      SELECT uqa2.quest_id 
      FROM user_quest_assignments uqa2
      WHERE uqa2.user_id = p_user_id 
        AND uqa2.giorno = p_giorno
        AND (
          (uqa2.assigned_at >= v_today_start AND uqa2.assigned_at < v_today_end)
          OR uqa2.completed_at IS NOT NULL -- Non riassegnare quest già completate
        )
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
-- FUNZIONE: VALIDA RETROATTIVAMENTE PROVE ESISTENTI
-- ============================================
-- Valida retroattivamente tutte le prove esistenti che hanno >= 5 conferme
-- ma non sono ancora state validate (per applicare il nuovo sistema a 5 conferme)
CREATE OR REPLACE FUNCTION validate_existing_proofs_with_5_confirmations()
RETURNS INTEGER AS $$
DECLARE
  v_prova RECORD;
  v_quest_punti INTEGER;
  v_count INTEGER := 0;
BEGIN
  -- Trova tutte le prove non speciali che hanno >= 5 voti positivi ma non sono ancora validate
  FOR v_prova IN
    SELECT 
      pq.id as prova_id,
      pq.user_id,
      pq.quest_id,
      COUNT(*) FILTER (WHERE v.valore = true) as voti_positivi
    FROM prove_quest pq
    INNER JOIN quest q ON q.id = pq.quest_id
    LEFT JOIN voti v ON v.prova_id = pq.id
    WHERE pq.stato != 'validata'
      AND COALESCE(q.is_special, false) = false -- Solo quest normali
    GROUP BY pq.id, pq.user_id, pq.quest_id
    HAVING COUNT(*) FILTER (WHERE v.valore = true) >= 5
  LOOP
    -- Ottieni punti della quest
    SELECT q.punti INTO v_quest_punti
    FROM quest q
    WHERE q.id = v_prova.quest_id;
    
    -- Valida la prova
    UPDATE prove_quest 
    SET stato = 'validata' 
    WHERE id = v_prova.prova_id;
    
    -- Assegna punti all'utente
    UPDATE users 
    SET punti_personali = punti_personali + v_quest_punti 
    WHERE id = v_prova.user_id;
    
    -- Aggiorna completed_at nell'assegnazione quest
    UPDATE user_quest_assignments
    SET completed_at = NOW()
    WHERE user_id = v_prova.user_id 
      AND quest_id = v_prova.quest_id
      AND completed_at IS NULL;
    
    -- Crea notifica
    INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
    VALUES (
      v_prova.user_id, 
      'Quest Validata! 🎉', 
      'La tua prova è stata validata! +' || v_quest_punti || ' punti', 
      'quest'
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION validate_existing_proofs_with_5_confirmations TO authenticated;

-- ============================================
-- ESEGUI VALIDAZIONE RETROATTIVA
-- ============================================
-- Valida tutte le prove esistenti che hanno >= 5 conferme
-- Restituisce il numero di prove validate
DO $$
DECLARE
  v_validated_count INTEGER;
BEGIN
  SELECT validate_existing_proofs_with_5_confirmations() INTO v_validated_count;
  RAISE NOTICE 'Validated % existing proofs with 5+ confirmations', v_validated_count;
END $$;

-- ============================================
-- VERIFICA FINALE
-- ============================================
-- ✅ Funzione aggiornata!
-- Ora la validazione funziona così:
-- 1. Quest normali: richiedono 5 conferme (voti positivi) e assegnano punti immediatamente
-- 2. Quest speciali: richiedono 66% dei votanti (minimo 10 voti) e richiedono conferma admin
-- 3. I punti vengono assegnati immediatamente quando si raggiungono 5 conferme (non aspetta mezzanotte)
-- 4. Le quest già completate non vengono rimosse quando cambiano a mezzanotte
-- 5. Le prove già caricate vengono validate retroattivamente se hanno >= 5 conferme
