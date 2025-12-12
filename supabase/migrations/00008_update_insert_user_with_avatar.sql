-- Aggiorna la funzione insert_user_with_passkey per supportare l'avatar
-- Esegui questo script nella console SQL di Supabase

-- Rimuovi tutte le versioni esistenti della funzione (con tutte le possibili firme)
DROP FUNCTION IF EXISTS insert_user_with_passkey(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS insert_user_with_passkey(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS insert_user_with_passkey CASCADE;

-- Funzione per registrazione con passkey (aggiornata con avatar)
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

