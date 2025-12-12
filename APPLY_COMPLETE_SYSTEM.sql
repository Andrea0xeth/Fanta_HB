-- ============================================
-- SISTEMA COMPLETO: QUEST E GARE
-- ============================================
-- Esegui questo script nella Supabase SQL Editor:
-- https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/sql/new
--
-- Questo script applica TUTTO in una volta:
-- 1. ✅ 100 quest diverse per utenti singoli
-- 2. ✅ Sistema di assegnazione automatica (3 quest al giorno per utente)
-- 3. ✅ Sistema di classifiche per gare multi-squadra
-- 4. ✅ Template dei 20 giochi da spiaggia

-- ============================================
-- PARTE 1: CREA 100 QUEST
-- ============================================

-- Inserisci 100 quest diverse (se non esistono già)
INSERT INTO quest (giorno, titolo, descrizione, punti, difficolta, tipo_prova, emoji, attiva) 
SELECT * FROM (VALUES
-- FACILI (20-30 punti)
(1, 'Selfie con il mare', 'Fai un selfie con il mare sullo sfondo', 20, 'facile', ARRAY['foto'], '🌊', true),
(1, 'Foto del tramonto', 'Cattura un bellissimo tramonto', 25, 'facile', ARRAY['foto'], '🌅', true),
(1, 'Video del cibo', 'Registra un video del tuo piatto preferito', 20, 'facile', ARRAY['video'], '🍕', true),
(1, 'Selfie con amici', 'Fai un selfie di gruppo con i tuoi amici', 25, 'facile', ARRAY['foto'], '👥', true),
(1, 'Foto del paesaggio', 'Scatta una foto di un paesaggio che ti colpisce', 20, 'facile', ARRAY['foto'], '🏞️', true),
(1, 'Video di una risata', 'Registra qualcuno che ride di gusto', 20, 'facile', ARRAY['video'], '😂', true),
(1, 'Selfie con animale', 'Fai un selfie con un animale (cane, gatto, uccello...)', 25, 'facile', ARRAY['foto'], '🐕', true),
(1, 'Foto del cielo', 'Cattura il cielo in un momento particolare', 20, 'facile', ARRAY['foto'], '☁️', true),
(1, 'Video di una danza', 'Registra qualcuno che balla', 25, 'facile', ARRAY['video'], '💃', true),
(1, 'Selfie con cappello', 'Fai un selfie indossando un cappello divertente', 20, 'facile', ARRAY['foto'], '🎩', true),
(1, 'Foto di un fiore', 'Scatta una foto di un fiore particolare', 20, 'facile', ARRAY['foto'], '🌸', true),
(1, 'Video di un saluto', 'Registra un saluto creativo', 20, 'facile', ARRAY['video'], '👋', true),
(1, 'Selfie con occhiali da sole', 'Fai un selfie con occhiali da sole', 20, 'facile', ARRAY['foto'], '🕶️', true),
(1, 'Foto di un monumento', 'Scatta una foto di un monumento o edificio interessante', 25, 'facile', ARRAY['foto'], '🏛️', true),
(1, 'Video di un brindisi', 'Registra un brindisi con gli amici', 25, 'facile', ARRAY['video'], '🥂', true),
(1, 'Selfie con maschera', 'Fai un selfie con una maschera o travestimento', 20, 'facile', ARRAY['foto'], '🎭', true),
(1, 'Foto di un tram', 'Scatta una foto di un tram o mezzo pubblico', 20, 'facile', ARRAY['foto'], '🚃', true),
(1, 'Video di un abbraccio', 'Registra un abbraccio tra amici', 20, 'facile', ARRAY['video'], '🤗', true),
(1, 'Selfie con bandiera', 'Fai un selfie con una bandiera', 20, 'facile', ARRAY['foto'], '🚩', true),
(1, 'Foto di un mercato', 'Scatta una foto di un mercato locale', 25, 'facile', ARRAY['foto'], '🛒', true),
-- MEDIE (30-50 punti)
(1, 'Video di una sfida', 'Registra una sfida divertente con gli amici', 35, 'media', ARRAY['video'], '🎯', true),
(1, 'Foto di un momento emozionante', 'Cattura un momento emozionante della giornata', 40, 'media', ARRAY['foto'], '❤️', true),
(1, 'Video di una canzone', 'Registra qualcuno che canta', 35, 'media', ARRAY['video'], '🎤', true),
(1, 'Selfie con vista panoramica', 'Fai un selfie con una vista panoramica', 40, 'media', ARRAY['foto'], '🏔️', true),
(1, 'Foto di un evento', 'Scatta una foto di un evento o festa', 35, 'media', ARRAY['foto'], '🎉', true),
(1, 'Video di una performance', 'Registra una performance (magia, giocoleria...)', 40, 'media', ARRAY['video'], '🎪', true),
(1, 'Selfie con costume', 'Fai un selfie con un costume o travestimento completo', 35, 'media', ARRAY['foto'], '🎨', true),
(1, 'Foto di un tramonto speciale', 'Cattura un tramonto con elementi particolari', 40, 'media', ARRAY['foto'], '🌇', true),
(1, 'Video di una storia', 'Racconta una storia divertente in video', 35, 'media', ARRAY['video'], '📖', true),
(1, 'Selfie con arte di strada', 'Fai un selfie con street art o murales', 40, 'media', ARRAY['foto'], '🎨', true),
(1, 'Foto di un momento spontaneo', 'Cattura un momento spontaneo e genuino', 35, 'media', ARRAY['foto'], '📸', true),
(1, 'Video di una reazione', 'Registra una reazione sorpresa o divertente', 35, 'media', ARRAY['video'], '😲', true),
(1, 'Selfie con sport', 'Fai un selfie durante un attività sportiva', 40, 'media', ARRAY['foto'], '⚽', true),
(1, 'Foto di un dettaglio artistico', 'Scatta una foto di un dettaglio artistico interessante', 35, 'media', ARRAY['foto'], '🖼️', true),
(1, 'Video di un gioco', 'Registra un gioco o competizione', 40, 'media', ARRAY['video'], '🎮', true),
(1, 'Selfie con natura', 'Fai un selfie immerso nella natura', 35, 'media', ARRAY['foto'], '🌳', true),
(1, 'Foto di un momento magico', 'Cattura un momento che sembra magico', 40, 'media', ARRAY['foto'], '✨', true),
(1, 'Video di una collaborazione', 'Registra una collaborazione creativa', 35, 'media', ARRAY['video'], '🤝', true),
(1, 'Selfie con architettura', 'Fai un selfie con un edificio architettonicamente interessante', 40, 'media', ARRAY['foto'], '🏗️', true),
(1, 'Foto di un contrasto', 'Scatta una foto che mostra un contrasto interessante', 35, 'media', ARRAY['foto'], '⚖️', true),
-- DIFFICILI (50-80 punti)
(1, 'Video di una coreografia', 'Crea e registra una coreografia di gruppo', 60, 'difficile', ARRAY['video'], '💃', true),
(1, 'Foto di una composizione artistica', 'Crea una composizione fotografica artistica', 65, 'difficile', ARRAY['foto'], '🎨', true),
(1, 'Video di una storia completa', 'Racconta una storia completa e coinvolgente', 60, 'difficile', ARRAY['video'], '📚', true),
(1, 'Selfie con location iconica', 'Fai un selfie in una location iconica o famosa', 70, 'difficile', ARRAY['foto'], '🗺️', true),
(1, 'Foto di un momento raro', 'Cattura un momento raro o unico', 65, 'difficile', ARRAY['foto'], '🔍', true),
(1, 'Video di una performance completa', 'Registra una performance completa e professionale', 70, 'difficile', ARRAY['video'], '🎭', true),
(1, 'Selfie con elemento unico', 'Fai un selfie con qualcosa di unico e particolare', 60, 'difficile', ARRAY['foto'], '💎', true),
(1, 'Foto di una serie tematica', 'Crea una serie di foto con un tema specifico', 65, 'difficile', ARRAY['foto'], '📷', true),
(1, 'Video di una sfida complessa', 'Completa e registra una sfida complessa', 70, 'difficile', ARRAY['video'], '🏆', true),
(1, 'Selfie con timing perfetto', 'Fai un selfie con un timing perfetto', 60, 'difficile', ARRAY['foto'], '⏰', true),
(1, 'Foto di un concetto astratto', 'Rappresenta un concetto astratto in una foto', 65, 'difficile', ARRAY['foto'], '🧠', true),
(1, 'Video di una trasformazione', 'Registra una trasformazione o cambiamento', 60, 'difficile', ARRAY['video'], '🦋', true),
(1, 'Selfie con prospettiva unica', 'Fai un selfie con una prospettiva unica', 70, 'difficile', ARRAY['foto'], '🔭', true),
(1, 'Foto di un momento storico', 'Cattura un momento che sembra storico', 65, 'difficile', ARRAY['foto'], '📜', true),
(1, 'Video di una creazione', 'Registra il processo di creazione di qualcosa', 60, 'difficile', ARRAY['video'], '🔨', true),
(1, 'Selfie con elemento culturale', 'Fai un selfie che rappresenta la cultura locale', 70, 'difficile', ARRAY['foto'], '🌍', true),
(1, 'Foto di un contrasto estremo', 'Crea una foto con un contrasto estremo', 65, 'difficile', ARRAY['foto'], '⚡', true),
(1, 'Video di una narrazione', 'Crea una narrazione video completa', 60, 'difficile', ARRAY['video'], '🎬', true),
(1, 'Selfie con elemento naturale raro', 'Fai un selfie con un elemento naturale raro', 70, 'difficile', ARRAY['foto'], '🌿', true),
(1, 'Foto di un momento epico', 'Cattura un momento che sembra epico', 65, 'difficile', ARRAY['foto'], '⚔️', true),
-- EPICHE (80-150 punti)
(1, 'Video di una produzione completa', 'Crea una produzione video completa e professionale', 100, 'epica', ARRAY['video'], '🎬', true),
(1, 'Foto di una serie documentaristica', 'Crea una serie documentaristica fotografica', 120, 'epica', ARRAY['foto'], '📸', true),
(1, 'Video di una performance epica', 'Registra una performance epica e memorabile', 110, 'epica', ARRAY['video'], '🌟', true),
(1, 'Selfie con location leggendaria', 'Fai un selfie in una location leggendaria', 100, 'epica', ARRAY['foto'], '🏰', true),
(1, 'Foto di un momento irripetibile', 'Cattura un momento che non si ripeterà mai', 120, 'epica', ARRAY['foto'], '💫', true),
(1, 'Video di una storia epica', 'Racconta una storia epica e coinvolgente', 110, 'epica', ARRAY['video'], '📖', true),
(1, 'Selfie con elemento mitico', 'Fai un selfie con qualcosa di mitico o leggendario', 100, 'epica', ARRAY['foto'], '🐉', true),
(1, 'Foto di una composizione epica', 'Crea una composizione fotografica epica', 120, 'epica', ARRAY['foto'], '🎨', true),
(1, 'Video di una creazione epica', 'Registra la creazione di qualcosa di epico', 110, 'epica', ARRAY['video'], '🏗️', true),
(1, 'Selfie con momento storico', 'Fai un selfie in un momento storico', 100, 'epica', ARRAY['foto'], '📅', true),
(1, 'Foto di un capolavoro', 'Crea un capolavoro fotografico', 120, 'epica', ARRAY['foto'], '👑', true),
(1, 'Video di una produzione cinematografica', 'Crea una produzione video cinematografica', 110, 'epica', ARRAY['video'], '🎥', true),
(1, 'Selfie con elemento unico al mondo', 'Fai un selfie con qualcosa di unico al mondo', 100, 'epica', ARRAY['foto'], '🌎', true),
(1, 'Foto di un momento leggendario', 'Cattura un momento che diventerà leggendario', 120, 'epica', ARRAY['foto'], '🏆', true),
(1, 'Video di una performance leggendaria', 'Registra una performance che diventerà leggendaria', 110, 'epica', ARRAY['video'], '⭐', true),
(1, 'Selfie con elemento iconico', 'Fai un selfie con qualcosa di iconico e riconoscibile', 100, 'epica', ARRAY['foto'], '🎯', true),
(1, 'Foto di un momento epico', 'Cattura il momento più epico possibile', 120, 'epica', ARRAY['foto'], '💥', true),
(1, 'Video di una creazione leggendaria', 'Registra la creazione di qualcosa di leggendario', 110, 'epica', ARRAY['video'], '🔮', true),
(1, 'Selfie con momento irripetibile', 'Fai un selfie in un momento che non si ripeterà', 100, 'epica', ARRAY['foto'], '⏳', true),
(1, 'Foto di un capolavoro assoluto', 'Crea il capolavoro fotografico definitivo', 150, 'epica', ARRAY['foto'], '👑', true),
-- ALTRE QUEST (per varietà)
(1, 'Video di una reazione estrema', 'Registra la reazione più estrema possibile', 45, 'media', ARRAY['video'], '😱', true),
(1, 'Foto di un momento di gioia', 'Cattura un momento di pura gioia', 30, 'facile', ARRAY['foto'], '😊', true),
(1, 'Selfie con elemento colorato', 'Fai un selfie con qualcosa di molto colorato', 25, 'facile', ARRAY['foto'], '🌈', true),
(1, 'Video di una canzone improvvisata', 'Canta una canzone improvvisata', 40, 'media', ARRAY['video'], '🎵', true),
(1, 'Foto di un dettaglio nascosto', 'Scatta una foto di un dettaglio che normalmente passa inosservato', 35, 'media', ARRAY['foto'], '🔍', true),
(1, 'Selfie con elemento vintage', 'Fai un selfie con qualcosa di vintage', 30, 'facile', ARRAY['foto'], '📻', true),
(1, 'Video di una risata contagiosa', 'Registra una risata così contagiosa da far ridere tutti', 25, 'facile', ARRAY['video'], '🤣', true),
(1, 'Foto di un momento di pace', 'Cattura un momento di pace e tranquillità', 30, 'facile', ARRAY['foto'], '☮️', true),
(1, 'Selfie con elemento tecnologico', 'Fai un selfie con qualcosa di tecnologico', 25, 'facile', ARRAY['foto'], '📱', true),
(1, 'Video di una danza spontanea', 'Registra una danza completamente spontanea', 35, 'media', ARRAY['video'], '🕺', true),
(1, 'Foto di un momento di amicizia', 'Cattura un momento che rappresenta l''amicizia', 30, 'facile', ARRAY['foto'], '🤝', true),
(1, 'Selfie con elemento naturale', 'Fai un selfie immerso nella natura', 25, 'facile', ARRAY['foto'], '🌲', true),
(1, 'Video di una collaborazione spontanea', 'Registra una collaborazione nata spontaneamente', 40, 'media', ARRAY['video'], '🤝', true),
(1, 'Foto di un momento di condivisione', 'Cattura un momento di condivisione', 30, 'facile', ARRAY['foto'], '💝', true),
(1, 'Selfie con elemento musicale', 'Fai un selfie con qualcosa legato alla musica', 25, 'facile', ARRAY['foto'], '🎸', true),
(1, 'Video di una performance improvvisata', 'Registra una performance completamente improvvisata', 45, 'media', ARRAY['video'], '🎭', true),
(1, 'Foto di un momento di scoperta', 'Cattura un momento di scoperta', 35, 'media', ARRAY['foto'], '🔎', true),
(1, 'Selfie con elemento artistico', 'Fai un selfie con qualcosa di artistico', 30, 'facile', ARRAY['foto'], '🎨', true),
(1, 'Video di una storia divertente', 'Racconta una storia divertente in video', 40, 'media', ARRAY['video'], '😄', true),
(1, 'Foto di un momento di unione', 'Cattura un momento che unisce le persone', 30, 'facile', ARRAY['foto'], '💞', true)
) AS v(giorno, titolo, descrizione, punti, difficolta, tipo_prova, emoji, attiva)
WHERE NOT EXISTS (
  SELECT 1 FROM quest WHERE quest.titolo = v.titolo
);

-- ============================================
-- PARTE 2: SISTEMA QUEST PERSONALI
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

  INSERT INTO user_quest_assignments (user_id, quest_id, giorno)
  SELECT 
    p_user_id,
    q.id,
    p_giorno
  FROM quest q
  WHERE q.attiva = true
  ORDER BY RANDOM()
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
-- PARTE 3: SISTEMA GARE MULTI-SQUADRA
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
-- PARTE 4: TEMPLATE GIOCHI (opzionale, solo per riferimento)
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
-- 1. ✅ 100 quest diverse per utenti singoli
-- 2. ✅ Sistema di assegnazione automatica (3 quest casuali al giorno per utente)
-- 3. ✅ Sistema di classifiche per gare multi-squadra
-- 4. ✅ Template dei 20 giochi da spiaggia
--
-- Gli admin possono:
-- - Creare nuove gare usando i 20 giochi disponibili
-- - Definire classifiche per le gare completate (primo, secondo, terzo, ecc.)
-- - I punti vengono distribuiti automaticamente in base alla posizione

