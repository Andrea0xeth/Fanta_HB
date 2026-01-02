-- ============================================
-- Tabella Premi
-- ============================================

CREATE TABLE IF NOT EXISTS premi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  immagine TEXT NOT NULL, -- Emoji o URL immagine
  tipo TEXT NOT NULL CHECK (tipo IN ('squadra', 'singolo', 'giornaliero', 'speciale')),
  punti_richiesti INTEGER CHECK (punti_richiesti IS NULL OR punti_richiesti >= 0),
  posizione_classifica INTEGER CHECK (posizione_classifica IS NULL OR (posizione_classifica > 0 AND tipo = 'squadra')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per tipo
CREATE INDEX IF NOT EXISTS idx_premi_tipo ON premi(tipo);

-- Aggiungi colonna posizione_classifica se non esiste (per aggiornamenti a tabelle esistenti)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'premi' AND column_name = 'posizione_classifica'
  ) THEN
    ALTER TABLE premi ADD COLUMN posizione_classifica INTEGER CHECK (posizione_classifica IS NULL OR (posizione_classifica > 0 AND tipo = 'squadra'));
  END IF;
END $$;

-- RLS Policies per premi (tutti possono leggere, solo admin può modificare)
ALTER TABLE premi ENABLE ROW LEVEL SECURITY;

-- Rimuovi policies esistenti se esistono (per permettere re-run della migration)
DROP POLICY IF EXISTS "premi_select_all" ON premi;
DROP POLICY IF EXISTS "premi_admin_all" ON premi;

-- Policy: Tutti possono leggere i premi
CREATE POLICY "premi_select_all" ON premi
  FOR SELECT
  USING (true);

-- Policy: Solo admin possono inserire/modificare/eliminare
CREATE POLICY "premi_admin_all" ON premi
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_premi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Rimuovi trigger esistente se esiste (per permettere re-run della migration)
DROP TRIGGER IF EXISTS premi_updated_at ON premi;

CREATE TRIGGER premi_updated_at
  BEFORE UPDATE ON premi
  FOR EACH ROW
  EXECUTE FUNCTION update_premi_updated_at();

