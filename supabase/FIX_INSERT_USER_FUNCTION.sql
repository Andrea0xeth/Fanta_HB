-- ============================================
-- FIX FUNZIONE insert_user_with_passkey
-- ============================================
-- Questo script assicura che la funzione accetti correttamente tutti i parametri
-- incluso p_passkey_id come nullable (per email/password auth)

-- Rimuovi tutte le versioni esistenti
DROP FUNCTION IF EXISTS insert_user_with_passkey(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS insert_user_with_passkey(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS insert_user_with_passkey CASCADE;

-- Crea la funzione con p_passkey_id nullable (DEFAULT NULL)
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

-- Verifica che la funzione sia stata creata
SELECT 
  proname as function_name,
  proargnames as parameters,
  CASE 
    WHEN proname = 'insert_user_with_passkey' THEN '✅ Funzione creata correttamente'
    ELSE '❌ Funzione mancante'
  END as status
FROM pg_proc
WHERE proname = 'insert_user_with_passkey';

