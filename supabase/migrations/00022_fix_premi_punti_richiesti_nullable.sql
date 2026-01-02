-- ============================================
-- FIX: Permetti NULL per punti_richiesti nei premi
-- ============================================
-- Per i premi di squadra, punti_richiesti deve essere NULL
-- e posizione_classifica deve essere valorizzato

-- Rimuovi il constraint NOT NULL se esiste
ALTER TABLE premi 
ALTER COLUMN punti_richiesti DROP NOT NULL;

-- Verifica che il constraint CHECK permetta NULL
-- (dovrebbe già essere presente dalla migration 00021, ma verifichiamo)
DO $$ 
BEGIN
  -- Rimuovi constraint CHECK esistente se non corretto
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'premi_punti_richiesti_check' 
    AND contype = 'c'
  ) THEN
    ALTER TABLE premi DROP CONSTRAINT IF EXISTS premi_punti_richiesti_check;
  END IF;
END $$;

-- Aggiungi constraint CHECK che permette NULL
ALTER TABLE premi 
ADD CONSTRAINT premi_punti_richiesti_check 
CHECK (punti_richiesti IS NULL OR punti_richiesti >= 0);

-- Verifica che posizione_classifica possa essere NULL
ALTER TABLE premi 
ALTER COLUMN posizione_classifica DROP NOT NULL;

-- Verifica che il constraint CHECK per posizione_classifica sia corretto
DO $$ 
BEGIN
  -- Rimuovi constraint CHECK esistente se non corretto
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'premi_posizione_classifica_check' 
    AND contype = 'c'
  ) THEN
    ALTER TABLE premi DROP CONSTRAINT IF EXISTS premi_posizione_classifica_check;
  END IF;
END $$;

-- Aggiungi constraint CHECK per posizione_classifica
ALTER TABLE premi 
ADD CONSTRAINT premi_posizione_classifica_check 
CHECK (posizione_classifica IS NULL OR (posizione_classifica > 0 AND tipo = 'squadra'));

-- Verifica finale: mostra lo stato delle colonne
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'premi'
  AND column_name IN ('punti_richiesti', 'posizione_classifica')
ORDER BY column_name;

