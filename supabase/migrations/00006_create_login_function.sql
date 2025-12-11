-- Crea una funzione RPC per login con passkey, bypassando la cache PostgREST
-- Questa funzione userà SECURITY DEFINER per bypassare RLS e la cache

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

-- Permetti l'esecuzione con anon key
GRANT EXECUTE ON FUNCTION login_with_passkey TO anon, authenticated;

