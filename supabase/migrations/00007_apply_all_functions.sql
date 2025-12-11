-- Applica tutte le funzioni RPC necessarie per passkey authentication
-- Questo file combina le funzioni di login e registrazione

-- Funzione per registrazione con passkey
CREATE OR REPLACE FUNCTION insert_user_with_passkey(
  p_id UUID,
  p_nickname TEXT,
  p_passkey_id TEXT,
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
  );
  
  RETURN QUERY
  SELECT 
    u.id, u.nickname, u.nome, u.cognome, u.email, u.telefono, u.data_nascita,
    u.avatar, u.passkey_id, u.squadra_id, u.punti_personali, u.is_admin, u.created_at
  FROM users u
  WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION insert_user_with_passkey TO anon, authenticated;

-- Funzione per login con passkey
CREATE OR REPLACE FUNCTION login_with_passkey(p_passkey_id TEXT)
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
  -- Usa TRIM per rimuovere spazi e confronta esattamente
  -- Gestisce anche caratteri speciali come + e = nel base64
  RETURN QUERY
  SELECT 
    u.id, u.nickname, u.nome, u.cognome, u.email, u.telefono, u.data_nascita,
    u.avatar, u.passkey_id, u.squadra_id, u.punti_personali, u.is_admin, u.created_at
  FROM users u
  WHERE TRIM(u.passkey_id) = TRIM(p_passkey_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION login_with_passkey TO anon, authenticated;

