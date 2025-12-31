-- Update quest proof validation: require at least 10 votes (was 3)
-- Keeps the 66% positive threshold.
-- This affects when punti_personali get assigned (only when the proof becomes 'validata').

CREATE OR REPLACE FUNCTION check_proof_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_positive INTEGER;
  v_quest_punti INTEGER;
  v_user_id UUID;
  v_stato TEXT;
BEGIN
  -- Count votes for this proof
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE valore = true)
  INTO v_total, v_positive
  FROM voti
  WHERE prova_id = NEW.prova_id;

  -- Fetch current status + proof owner + quest points
  SELECT
    pq.stato,
    pq.user_id,
    q.punti
  INTO v_stato, v_user_id, v_quest_punti
  FROM prove_quest pq
  INNER JOIN quest q ON q.id = pq.quest_id
  WHERE pq.id = NEW.prova_id;

  -- Update counters on the proof
  UPDATE prove_quest
  SET
    voti_totali = v_total,
    voti_positivi = v_positive
  WHERE id = NEW.prova_id;

  -- Validate only when >= 10 votes and >= 66% positive, and not already validated
  IF v_total >= 10
     AND (v_positive::float / v_total) >= 0.66
     AND v_stato != 'validata' THEN

    UPDATE prove_quest
    SET stato = 'validata'
    WHERE id = NEW.prova_id;

    UPDATE users
    SET punti_personali = punti_personali + v_quest_punti
    WHERE id = v_user_id;

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


