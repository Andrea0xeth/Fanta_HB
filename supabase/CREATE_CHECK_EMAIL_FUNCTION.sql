-- ============================================
-- CREA FUNZIONE PER VERIFICARE EMAIL ESISTENTE
-- ============================================
-- Questa funzione bypassa i problemi RLS e permette di verificare se un'email esiste
-- senza dover fare una query diretta alla tabella users

CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS TABLE (
  email_exists BOOLEAN,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN u.id IS NOT NULL THEN true ELSE false END as email_exists,
    u.id as user_id
  FROM users u
  WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permetti l'esecuzione con anon key
GRANT EXECUTE ON FUNCTION check_email_exists TO anon, authenticated;

-- Commento sulla funzione
COMMENT ON FUNCTION check_email_exists IS 'Verifica se un''email esiste già nella tabella users. Bypassa RLS usando SECURITY DEFINER.';

