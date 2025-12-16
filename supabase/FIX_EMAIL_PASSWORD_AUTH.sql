-- ============================================
-- FIX EMAIL/PASSWORD AUTHENTICATION
-- ============================================
-- Questo script risolve i problemi di registrazione con email/password:
-- 1. Verifica e aggiorna le policy RLS per la tabella users
-- 2. Assicura che la funzione insert_user_with_passkey funzioni correttamente
-- 3. Abilita la lettura pubblica della tabella users per verificare email esistenti

-- ============================================
-- PARTE 1: VERIFICA E FIX POLICY RLS
-- ============================================

-- Rimuovi policy duplicate o problematiche
DROP POLICY IF EXISTS "Lettura pubblica users" ON users;
DROP POLICY IF EXISTS "Lettura users" ON users;
DROP POLICY IF EXISTS "Select users" ON users;

-- Crea policy per lettura pubblica (necessaria per verificare email esistenti)
CREATE POLICY "Lettura pubblica users" 
ON users 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Verifica che RLS sia abilitato
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTE 2: VERIFICA FUNZIONE insert_user_with_passkey
-- ============================================

-- Assicura che la funzione esista e funzioni correttamente
CREATE OR REPLACE FUNCTION insert_user_with_passkey(
  p_id UUID,
  p_nickname TEXT,
  p_passkey_id TEXT DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_cognome TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_data_nascita DATE DEFAULT NULL,
  p_squadra_id UUID DEFAULT NULL,
  p_is_admin BOOLEAN DEFAULT FALSE,
  p_avatar TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  nome TEXT,
  cognome TEXT,
  email TEXT,
  telefono TEXT,
  data_nascita DATE,
  avatar TEXT,
  passkey_id TEXT,
  squadra_id UUID,
  punti_personali INTEGER,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  INSERT INTO users (
    id, nickname, nome, cognome, email, telefono, data_nascita,
    passkey_id, squadra_id, punti_personali, is_admin, avatar
  )
  VALUES (
    p_id, p_nickname, p_nome, p_cognome, p_email, p_telefono, p_data_nascita,
    p_passkey_id, p_squadra_id, 0, p_is_admin, p_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    nome = EXCLUDED.nome,
    cognome = EXCLUDED.cognome,
    email = EXCLUDED.email,
    telefono = EXCLUDED.telefono,
    data_nascita = EXCLUDED.data_nascita,
    avatar = EXCLUDED.avatar,
    passkey_id = COALESCE(EXCLUDED.passkey_id, users.passkey_id),
    squadra_id = COALESCE(EXCLUDED.squadra_id, users.squadra_id),
    is_admin = EXCLUDED.is_admin;
  
  RETURN QUERY
  SELECT 
    u.id, u.nickname, u.nome, u.cognome, u.email, u.telefono, u.data_nascita,
    u.avatar, u.passkey_id, u.squadra_id, u.punti_personali, u.is_admin, u.created_at
  FROM users u
  WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assicura che la funzione sia eseguibile da anon e authenticated
GRANT EXECUTE ON FUNCTION insert_user_with_passkey TO anon, authenticated;

-- ============================================
-- PARTE 3: VERIFICA CONFIGURAZIONE
-- ============================================

-- Verifica che la tabella users abbia la colonna email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;
END $$;

-- Verifica che ci sia un indice sulla colonna email per performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- ============================================
-- VERIFICA FINALE
-- ============================================

-- Mostra le policy attive
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Mostra se la funzione esiste
SELECT 
  proname as function_name,
  proargnames as arguments
FROM pg_proc
WHERE proname = 'insert_user_with_passkey';

