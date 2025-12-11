-- Crea una funzione RPC per inserire utenti, bypassando la cache PostgREST
-- Questa funzione userà SECURITY DEFINER per bypassare RLS e la cache

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
  p_is_admin BOOLEAN DEFAULT FALSE
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
    passkey_id, squadra_id, punti_personali, is_admin
  )
  VALUES (
    p_id, p_nickname, p_nome, p_cognome, p_email, p_telefono, p_data_nascita,
    p_passkey_id, p_squadra_id, 0, p_is_admin
  );
  
  RETURN QUERY
  SELECT 
    u.id, u.nickname, u.nome, u.cognome, u.email, u.telefono, u.data_nascita,
    u.avatar, u.passkey_id, u.squadra_id, u.punti_personali, u.is_admin, u.created_at
  FROM users u
  WHERE u.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permetti l'esecuzione con anon key
GRANT EXECUTE ON FUNCTION insert_user_with_passkey TO anon, authenticated;

