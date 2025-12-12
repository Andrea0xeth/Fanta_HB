-- ============================================
-- 20 GIOCHI DI SQUADRA DA SPIAGGIA
-- ============================================
-- Questi giochi possono essere usati per creare gare multi-squadra

-- Nota: Le gare vengono create dinamicamente dall'admin
-- Questo file contiene solo i template dei giochi disponibili

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

-- Inserisci i 20 giochi
INSERT INTO giochi_template (nome, descrizione, emoji, min_squadre, max_squadre, punti_base) VALUES
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
('Caccia al Tesoro', 'Squadre cercano oggetti nascosti seguendo indizi', '🗺️', 2, 4, 70);

-- Nota: Le gare effettive vengono create dall'admin tramite l'interfaccia
-- Questa tabella serve solo come riferimento per i giochi disponibili

