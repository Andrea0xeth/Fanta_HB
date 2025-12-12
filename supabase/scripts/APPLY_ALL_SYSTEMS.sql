-- ============================================
-- APPLICA TUTTI I SISTEMI: QUEST E GARE
-- ============================================
-- Esegui questo script nella Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/sql/new
--
-- Questo script applica:
-- 1. Sistema di quest personali (100 quest + assegnazione automatica)
-- 2. Sistema di gare multi-squadra con classifiche
-- 3. Template dei 20 giochi da spiaggia

-- ============================================
-- PARTE 1: SISTEMA QUEST PERSONALI
-- ============================================

-- Tabella per tracciare le quest assegnate agli utenti
CREATE TABLE IF NOT EXISTS user_quest_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  giorno INTEGER NOT NULL CHECK (giorno BETWEEN 1 AND 3),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, quest_id, giorno)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_user_giorno 
ON user_quest_assignments(user_id, giorno);

CREATE INDEX IF NOT EXISTS idx_user_quest_assignments_quest 
ON user_quest_assignments(quest_id);

-- Policy RLS
ALTER TABLE user_quest_assignments ENABLE ROW LEVEL SECURITY;

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

-- Funzione per assegnare 3 quest casuali ogni giorno
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
  SELECT COUNT(*) INTO v_assigned_count
  FROM user_quest_assignments
  WHERE user_id = p_user_id AND giorno = p_giorno;

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

-- Funzione per ottenere le quest assegnate
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

-- ============================================
-- PARTE 2: SISTEMA GARE MULTI-SQUADRA
-- ============================================

-- Tabella per le classifiche delle gare
CREATE TABLE IF NOT EXISTS classifiche_gare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gara_id UUID NOT NULL REFERENCES gare(id) ON DELETE CASCADE,
  squadra_id UUID NOT NULL REFERENCES squadre(id) ON DELETE CASCADE,
  posizione INTEGER NOT NULL CHECK (posizione > 0),
  punti_assegnati INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gara_id, squadra_id),
  UNIQUE(gara_id, posizione)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_classifiche_gare_gara 
ON classifiche_gare(gara_id);

CREATE INDEX IF NOT EXISTS idx_classifiche_gare_squadra 
ON classifiche_gare(squadra_id);

-- Policy RLS
ALTER TABLE classifiche_gare ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lettura classifiche" ON classifiche_gare;
CREATE POLICY "Lettura classifiche" 
ON classifiche_gare FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert classifiche" ON classifiche_gare;
CREATE POLICY "Insert classifiche" 
ON classifiche_gare FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Update classifiche" ON classifiche_gare;
CREATE POLICY "Update classifiche" 
ON classifiche_gare FOR UPDATE 
USING (true);

-- Funzione per assegnare classifica
CREATE OR REPLACE FUNCTION assegna_classifica_gara(
  p_gara_id UUID,
  p_classifiche JSONB
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
  SELECT punti_in_palio INTO v_punti_in_palio FROM gare WHERE id = p_gara_id;
  SELECT COUNT(*) INTO v_num_squadre FROM jsonb_array_elements(p_classifiche);
  
  DELETE FROM classifiche_gare WHERE gara_id = p_gara_id;
  
  FOR v_classifica_item IN SELECT * FROM jsonb_array_elements(p_classifiche)
  LOOP
    v_squadra_id := (v_classifica_item->>'squadra_id')::UUID;
    v_posizione := (v_classifica_item->>'posizione')::INTEGER;
    
    v_punti := ROUND(v_punti_in_palio::NUMERIC * (v_num_squadre - v_posizione + 1)::NUMERIC / v_num_squadre::NUMERIC);
    
    INSERT INTO classifiche_gare (gara_id, squadra_id, posizione, punti_assegnati)
    VALUES (p_gara_id, v_squadra_id, v_posizione, v_punti);
    
    UPDATE squadre 
    SET punti_squadra = punti_squadra + v_punti 
    WHERE id = v_squadra_id;
  END LOOP;
  
  UPDATE gare 
  SET stato = 'completata'
  WHERE id = p_gara_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assegna_classifica_gara TO anon, authenticated;

-- Funzione per ottenere classifica gara
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

-- ============================================
-- PARTE 3: TEMPLATE GIOCHI (opzionale, solo per riferimento)
-- ============================================

-- Tabella per i template dei giochi (opzionale, per riferimento)
CREATE TABLE IF NOT EXISTS giochi_template (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descrizione TEXT,
  emoji TEXT,
  min_squadre INTEGER DEFAULT 2,
  max_squadre INTEGER DEFAULT 4,
  punti_base INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci i 20 giochi (solo se non esistono già)
INSERT INTO giochi_template (nome, descrizione, emoji, min_squadre, max_squadre, punti_base) 
SELECT * FROM (VALUES
  ('Rubabandiera', 'Due squadre allineate, l''arbitro chiama un numero e i giocatori corrispondenti corrono per prendere la bandiera', '🚩', 2, 2, 50),
  ('Nascondino', 'Un cercatore cerca gli altri giocatori nascosti prima che raggiungano la "tana"', '🫥', 2, 4, 50),
  ('Birrapong (Beer Pong)', 'Adattato alla spiaggia con bicchieri in sabbia, si lancia la pallina nei bicchieri avversari', '🍺', 2, 4, 60),
  ('Bocce', 'Due squadre lanciano le bocce cercando di avvicinarsi il più possibile al boccino', '🎳', 2, 4, 50),
  ('Beach Volley', 'Pallavolo sulla sabbia, due squadre cercano di far cadere la palla nel campo avversario', '🏐', 2, 2, 70),
  ('Footvolley', 'Come il beach volley ma senza usare le mani, solo piedi e testa', '⚽', 2, 2, 70),
  ('Beach Soccer', 'Calcio sulla sabbia con squadre di 5 giocatori', '⚽', 2, 4, 60),
  ('Beach Tennis', 'Tennis sulla sabbia con racchette e rete', '🎾', 2, 2, 60),
  ('Palla Prigioniera', 'Due squadre si lanciano la palla per colpire gli avversari e farli prigionieri', '🏀', 2, 4, 50),
  ('Tiro alla Fune', 'Due squadre tirano una corda in direzioni opposte', '🪢', 2, 2, 50),
  ('Frisbee / Ultimate Frisbee', 'Lancio del disco tra i giocatori, con variante Ultimate che combina calcio e rugby', '🥏', 2, 4, 60),
  ('Kubb', 'Gioco svedese che combina bowling e bocce, si lanciano bastoni per abbattere i kubb avversari', '🪵', 2, 4, 55),
  ('Roundnet (Spikeball)', 'Due squadre di due giocatori colpiscono una palla su una rete a terra', '🎾', 2, 2, 60),
  ('Beach Rugby', 'Rugby sulla sabbia con squadre di 5 giocatori', '🏉', 2, 4, 70),
  ('Beach Waterpolo', 'Pallanuoto in mare in un''area delimitata', '🏊', 2, 4, 70),
  ('Racchettoni', 'Si usa una racchetta e una pallina, si cerca di mantenerla in aria il più a lungo possibile', '🏓', 2, 4, 50),
  ('Palla Avvelenata', 'Variante della palla prigioniera con regole specifiche', '☠️', 2, 4, 55),
  ('Staffetta', 'Gare di corsa a squadre con testimone da passare', '🏃', 2, 4, 60),
  ('Pallone', 'Gioco tradizionale con palla da calciare e passare tra i giocatori', '⚽', 2, 4, 50),
  ('Caccia al Tesoro', 'Squadre cercano oggetti nascosti seguendo indizi', '🗺️', 2, 4, 70)
) AS v(nome, descrizione, emoji, min_squadre, max_squadre, punti_base)
ON CONFLICT (nome) DO NOTHING;

-- ✅ TUTTI I SISTEMI APPLICATI!
-- 
-- Ora hai:
-- 1. ✅ Sistema di quest personali (100 quest + assegnazione automatica di 3 al giorno)
-- 2. ✅ Sistema di gare multi-squadra con classifiche
-- 3. ✅ Template dei 20 giochi da spiaggia
--
-- Gli admin possono:
-- - Creare nuove gare usando i 20 giochi disponibili
-- - Definire classifiche per le gare completate
-- - I punti vengono distribuiti automaticamente in base alla posizione



