-- ============================================
-- AGGIORNA VALIDAZIONE: 66% DEGLI UTENTI ATTIVI
-- ============================================
-- Questo script modifica la funzione check_proof_validation per:
-- 1. Contare il numero totale di utenti attivi (non admin)
-- 2. Calcolare il 66% di quegli utenti
-- 3. Validare quando i voti positivi raggiungono almeno il 66% degli utenti attivi
--    (invece del 66% dei votanti)

-- ============================================
-- FUNZIONE AGGIORNATA: CHECK_PROOF_VALIDATION
-- ============================================
CREATE OR REPLACE FUNCTION check_proof_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;           -- Totale voti ricevuti
  v_positive INTEGER;        -- Voti positivi
  v_quest_punti INTEGER;
  v_user_id UUID;
  v_stato TEXT;
  v_active_users_count INTEGER;  -- Numero di utenti attivi
  v_required_positive_votes INTEGER;  -- Numero minimo di voti positivi richiesti (66% degli utenti attivi)
BEGIN
  -- Conta voti per questa prova (query ottimizzata con indice)
  SELECT 
    COUNT(*), 
    COUNT(*) FILTER (WHERE valore = true)
  INTO v_total, v_positive
  FROM voti 
  WHERE prova_id = NEW.prova_id;

  -- Conta il numero di utenti attivi (tutti gli utenti non admin)
  SELECT COUNT(*) 
  INTO v_active_users_count
  FROM users
  WHERE is_admin = false;

  -- Calcola il numero minimo di voti positivi richiesti (66% degli utenti attivi)
  -- Arrotondato per eccesso (CEIL) per garantire almeno il 66%
  v_required_positive_votes := CEIL(v_active_users_count * 0.66);

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

  -- Valida se:
  -- 1. Almeno 10 voti totali (minimo per validazione)
  -- 2. Voti positivi >= 66% degli utenti attivi (non dei votanti!)
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
    WHEN prosrc LIKE '%v_active_users_count%' THEN '✅ Aggiornata (66% utenti attivi)'
    WHEN prosrc LIKE '%0.66%' AND prosrc LIKE '%v_total%' THEN '❌ Vecchia (66% votanti)'
    ELSE '⚠️ Sconosciuta'
  END as stato
FROM pg_proc
WHERE proname = 'check_proof_validation';

-- Mostra esempio di calcolo
SELECT 
  COUNT(*) as total_active_users,
  CEIL(COUNT(*) * 0.66) as required_positive_votes_66_percent
FROM users
WHERE is_admin = false;

-- ✅ Funzione aggiornata!
-- Ora la validazione richiede:
-- 1. Almeno 3 voti totali
-- 2. Voti positivi >= 66% degli utenti attivi (non dei votanti)
-- Esempio: se ci sono 30 utenti attivi, servono almeno 20 voti positivi (66% di 30)

