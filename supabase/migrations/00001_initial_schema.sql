-- ============================================
-- 30diCiaccioGame - Database Schema
-- ============================================
-- Esegui questo file nella console SQL di Supabase
-- oppure usa: supabase db push

-- Imposta timezone Italia
ALTER DATABASE postgres SET timezone TO 'Europe/Rome';

-- ============================================
-- TABELLE PRINCIPALI
-- ============================================

-- Squadre (creale PRIMA degli users per la FK)
CREATE TABLE IF NOT EXISTS squadre (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  punti_squadra INTEGER DEFAULT 0,
  colore TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  nome TEXT,
  cognome TEXT,
  email TEXT,
  telefono TEXT,
  data_nascita DATE,
  avatar TEXT,
  passkey_id TEXT UNIQUE,
  squadra_id UUID REFERENCES squadre(id) ON DELETE SET NULL,
  punti_personali INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest giornaliere
CREATE TABLE IF NOT EXISTS quest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giorno INTEGER NOT NULL CHECK (giorno BETWEEN 1 AND 3),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  punti INTEGER NOT NULL CHECK (punti > 0),
  difficolta TEXT NOT NULL CHECK (difficolta IN ('facile', 'media', 'difficile', 'epica')),
  tipo_prova TEXT[] DEFAULT ARRAY['foto'],
  emoji TEXT DEFAULT '🎯',
  scadenza TIMESTAMP WITH TIME ZONE,
  attiva BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prove delle quest (upload utenti)
CREATE TABLE IF NOT EXISTS prove_quest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('foto', 'video', 'testo')),
  contenuto TEXT NOT NULL,
  stato TEXT DEFAULT 'in_verifica' CHECK (stato IN ('pending', 'in_verifica', 'validata', 'rifiutata')),
  voti_positivi INTEGER DEFAULT 0,
  voti_totali INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id) -- Un utente può fare una prova per quest
);

-- Gare squadra vs squadra
CREATE TABLE IF NOT EXISTS gare (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descrizione TEXT,
  squadra_a_id UUID NOT NULL REFERENCES squadre(id),
  squadra_b_id UUID NOT NULL REFERENCES squadre(id),
  vincitore_id UUID REFERENCES squadre(id),
  punti_in_palio INTEGER DEFAULT 50 CHECK (punti_in_palio > 0),
  orario TIMESTAMP WITH TIME ZONE NOT NULL,
  giorno INTEGER NOT NULL CHECK (giorno BETWEEN 1 AND 3),
  stato TEXT DEFAULT 'programmata' CHECK (stato IN ('programmata', 'live', 'completata')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (squadra_a_id != squadra_b_id)
);

-- Voti peer-to-peer per le prove
CREATE TABLE IF NOT EXISTS voti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prova_id UUID NOT NULL REFERENCES prove_quest(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valore BOOLEAN NOT NULL, -- true = valida, false = rifiuta
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prova_id, user_id) -- Un utente può votare una volta per prova
);

-- Bonus punti assegnati dall'admin
CREATE TABLE IF NOT EXISTS bonus_punti (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  punti INTEGER NOT NULL,
  motivo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stato del gioco
CREATE TABLE IF NOT EXISTS game_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Solo una riga
  giorno_corrente INTEGER DEFAULT 0 CHECK (giorno_corrente BETWEEN 0 AND 3),
  evento_iniziato BOOLEAN DEFAULT FALSE,
  data_inizio TIMESTAMP WITH TIME ZONE,
  data_fine TIMESTAMP WITH TIME ZONE
);

-- Notifiche
CREATE TABLE IF NOT EXISTS notifiche (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titolo TEXT NOT NULL,
  messaggio TEXT NOT NULL,
  tipo TEXT DEFAULT 'sistema' CHECK (tipo IN ('quest', 'gara', 'bonus', 'sistema')),
  letta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_squadra ON users(squadra_id);
CREATE INDEX IF NOT EXISTS idx_users_punti ON users(punti_personali DESC);
CREATE INDEX IF NOT EXISTS idx_squadre_punti ON squadre(punti_squadra DESC);
CREATE INDEX IF NOT EXISTS idx_quest_giorno ON quest(giorno, attiva);
CREATE INDEX IF NOT EXISTS idx_prove_stato ON prove_quest(stato);
CREATE INDEX IF NOT EXISTS idx_prove_user ON prove_quest(user_id);
CREATE INDEX IF NOT EXISTS idx_gare_stato ON gare(stato, giorno);
CREATE INDEX IF NOT EXISTS idx_notifiche_user ON notifiche(user_id, letta);

-- ============================================
-- DATI INIZIALI
-- ============================================

-- Inserisci le 6 squadre
INSERT INTO squadre (nome, emoji, colore, punti_squadra) VALUES
  ('Tigri Pazze', '🐯', '#FF6B6B', 0),
  ('Pecore Volanti', '🐑', '#4ECDC4', 0),
  ('Matti del Bosco', '🌲', '#FFE66D', 0),
  ('Leoni Ruggenti', '🦁', '#FF9F43', 0),
  ('Aquile Veloci', '🦅', '#6C5CE7', 0),
  ('Lupi Notturni', '🐺', '#A29BFE', 0)
ON CONFLICT (nome) DO NOTHING;

-- Stato iniziale del gioco
INSERT INTO game_state (id, giorno_corrente, evento_iniziato) 
VALUES (1, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Quest di esempio per ogni giorno
INSERT INTO quest (giorno, titolo, descrizione, punti, difficolta, tipo_prova, emoji) VALUES
  -- Giorno 1
  (1, 'Fai 10 flessioni', 'Filmati mentre fai 10 flessioni complete!', 25, 'media', ARRAY['video'], '💪'),
  (1, 'Selfie con sconosciuto', 'Fatti un selfie con una persona che non conosci!', 35, 'difficile', ARRAY['foto'], '🤳'),
  (1, 'Imita Di Ciaccio', 'Video imitazione della risata di Di Ciaccio!', 50, 'epica', ARRAY['video'], '🎭'),
  -- Giorno 2
  (2, 'Canta una canzone', 'Registra te stesso mentre canti una canzone a scelta', 30, 'media', ARRAY['video'], '🎤'),
  (2, 'Foto creativa', 'Scatta una foto artistica con un oggetto trovato', 20, 'facile', ARRAY['foto'], '📸'),
  (2, 'Barzelletta epica', 'Racconta la barzelletta più divertente che conosci', 40, 'difficile', ARRAY['video', 'testo'], '😂'),
  -- Giorno 3
  (3, 'Sfida finale', 'Completa una sfida segreta rivelata il giorno stesso', 60, 'epica', ARRAY['foto', 'video'], '🏆'),
  (3, 'Messaggio per Di Ciaccio', 'Registra un messaggio di auguri personale', 25, 'facile', ARRAY['video', 'testo'], '🎂'),
  (3, 'Foto di gruppo', 'Selfie con almeno 5 membri della tua squadra', 35, 'media', ARRAY['foto'], '👥')
ON CONFLICT DO NOTHING;

-- Gare di esempio
INSERT INTO gare (nome, descrizione, squadra_a_id, squadra_b_id, punti_in_palio, orario, giorno, stato)
SELECT 
  'Birra Flip' as nome,
  'Chi riesce a fare il flip della birra più velocemente!' as descrizione,
  (SELECT id FROM squadre WHERE nome = 'Tigri Pazze') as squadra_a_id,
  (SELECT id FROM squadre WHERE nome = 'Pecore Volanti') as squadra_b_id,
  50 as punti_in_palio,
  NOW() + INTERVAL '2 hours' as orario,
  1 as giorno,
  'programmata' as stato
WHERE NOT EXISTS (SELECT 1 FROM gare WHERE nome = 'Birra Flip');

INSERT INTO gare (nome, descrizione, squadra_a_id, squadra_b_id, punti_in_palio, orario, giorno, stato)
SELECT 
  'Karaoke Battle' as nome,
  'Sfida di karaoke tra le squadre!' as descrizione,
  (SELECT id FROM squadre WHERE nome = 'Matti del Bosco') as squadra_a_id,
  (SELECT id FROM squadre WHERE nome = 'Leoni Ruggenti') as squadra_b_id,
  75 as punti_in_palio,
  NOW() + INTERVAL '4 hours' as orario,
  1 as giorno,
  'programmata' as stato
WHERE NOT EXISTS (SELECT 1 FROM gare WHERE nome = 'Karaoke Battle');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE squadre ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest ENABLE ROW LEVEL SECURITY;
ALTER TABLE prove_quest ENABLE ROW LEVEL SECURITY;
ALTER TABLE gare ENABLE ROW LEVEL SECURITY;
ALTER TABLE voti ENABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_punti ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;

-- Policies: Tutti possono leggere
CREATE POLICY "Lettura pubblica users" ON users FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica squadre" ON squadre FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica quest" ON quest FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica prove" ON prove_quest FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica gare" ON gare FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica game_state" ON game_state FOR SELECT USING (true);
CREATE POLICY "Lettura pubblica voti" ON voti FOR SELECT USING (true);

-- Policies: Insert con anon key (per demo - in produzione usare auth)
CREATE POLICY "Insert users anon" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert prove anon" ON prove_quest FOR INSERT WITH CHECK (true);
CREATE POLICY "Insert voti anon" ON voti FOR INSERT WITH CHECK (true);

-- Policies: Update
CREATE POLICY "Update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Update squadre" ON squadre FOR UPDATE USING (true);
CREATE POLICY "Update prove" ON prove_quest FOR UPDATE USING (true);
CREATE POLICY "Update gare" ON gare FOR UPDATE USING (true);
CREATE POLICY "Update game_state" ON game_state FOR UPDATE USING (true);

-- Notifiche: solo per il proprio utente
CREATE POLICY "Lettura notifiche proprie" ON notifiche FOR SELECT USING (true);
CREATE POLICY "Insert notifiche" ON notifiche FOR INSERT WITH CHECK (true);
CREATE POLICY "Update notifiche proprie" ON notifiche FOR UPDATE USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Funzione per assegnare squadra casuale
CREATE OR REPLACE FUNCTION assign_random_team(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_squadra_id UUID;
BEGIN
  -- Seleziona la squadra con meno membri
  SELECT s.id INTO v_squadra_id
  FROM squadre s
  LEFT JOIN users u ON u.squadra_id = s.id
  GROUP BY s.id
  ORDER BY COUNT(u.id) ASC, RANDOM()
  LIMIT 1;
  
  -- Assegna all'utente
  UPDATE users SET squadra_id = v_squadra_id WHERE id = p_user_id;
  
  RETURN v_squadra_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per validare una prova (quando 66% voti positivi)
CREATE OR REPLACE FUNCTION check_proof_validation()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_positive INTEGER;
  v_quest_punti INTEGER;
  v_user_id UUID;
BEGIN
  -- Conta voti per questa prova
  SELECT COUNT(*), COUNT(*) FILTER (WHERE valore = true)
  INTO v_total, v_positive
  FROM voti WHERE prova_id = NEW.prova_id;
  
  -- Aggiorna contatori nella prova
  UPDATE prove_quest 
  SET voti_totali = v_total, voti_positivi = v_positive
  WHERE id = NEW.prova_id;
  
  -- Se almeno 3 voti e >= 66% positivi, valida
  IF v_total >= 3 AND (v_positive::float / v_total) >= 0.66 THEN
    UPDATE prove_quest SET stato = 'validata' WHERE id = NEW.prova_id;
    
    -- Ottieni punti della quest e user_id
    SELECT q.punti, pq.user_id INTO v_quest_punti, v_user_id
    FROM prove_quest pq
    JOIN quest q ON q.id = pq.quest_id
    WHERE pq.id = NEW.prova_id;
    
    -- Assegna punti all'utente
    UPDATE users 
    SET punti_personali = punti_personali + v_quest_punti 
    WHERE id = v_user_id;
    
    -- Crea notifica
    INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
    VALUES (v_user_id, 'Quest Validata! 🎉', 
            'La tua prova è stata validata! +' || v_quest_punti || ' punti', 'quest');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per validazione automatica
DROP TRIGGER IF EXISTS trigger_check_validation ON voti;
CREATE TRIGGER trigger_check_validation
AFTER INSERT ON voti
FOR EACH ROW
EXECUTE FUNCTION check_proof_validation();

-- Funzione per assegnare vincitore gara
CREATE OR REPLACE FUNCTION assign_gara_winner(
  p_gara_id UUID,
  p_vincitore_id UUID
) RETURNS VOID AS $$
DECLARE
  v_punti INTEGER;
BEGIN
  -- Ottieni punti in palio
  SELECT punti_in_palio INTO v_punti FROM gare WHERE id = p_gara_id;
  
  -- Aggiorna gara
  UPDATE gare 
  SET vincitore_id = p_vincitore_id, stato = 'completata'
  WHERE id = p_gara_id;
  
  -- Assegna punti alla squadra
  UPDATE squadre 
  SET punti_squadra = punti_squadra + v_punti 
  WHERE id = p_vincitore_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKET (esegui separatamente)
-- ============================================
-- Vai su Supabase Dashboard > Storage > Create bucket
-- Nome: prove-quest
-- Public: true
-- File size limit: 50MB
-- Allowed MIME types: image/*, video/*
