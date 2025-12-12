-- ============================================
-- GUIDA: CREARE E GESTIRE UTENTI ADMIN
-- ============================================
-- Questo script mostra come:
-- 1. Creare/convertire un utente in admin
-- 2. Usare le funzioni admin esistenti
-- 3. Dare punti extra
-- 4. Aggiudicare classifica gare
-- 5. Inviare notifiche personalizzate

-- ============================================
-- METODO 1: CREARE NUOVO UTENTE ADMIN
-- ============================================
-- Se vuoi creare un nuovo utente admin da zero:

-- Prima, registra l'utente normalmente tramite l'app (con WebAuthn)
-- Poi esegui questo comando per renderlo admin:

-- Sostituisci 'NICKNAME_UTENTE' con il nickname dell'utente che vuoi rendere admin
UPDATE users 
SET is_admin = true 
WHERE nickname = 'NICKNAME_UTENTE';

-- Verifica che sia stato aggiornato
SELECT id, nickname, is_admin, punti_personali 
FROM users 
WHERE nickname = 'NICKNAME_UTENTE';

-- ============================================
-- METODO 2: CONVERTIRE UTENTE ESISTENTE IN ADMIN
-- ============================================
-- Se hai già un utente registrato e vuoi renderlo admin:

-- Trova l'utente per nickname
SELECT id, nickname, is_admin 
FROM users 
WHERE nickname = 'NICKNAME_UTENTE';

-- Oppure trova l'utente per ID (se lo conosci)
SELECT id, nickname, is_admin 
FROM users 
WHERE id = 'UUID_DELL_UTENTE';

-- Rendi admin
UPDATE users 
SET is_admin = true 
WHERE id = 'UUID_DELL_UTENTE';  -- Sostituisci con l'ID reale

-- ============================================
-- METODO 3: CREARE ADMIN DIRETTAMENTE (SENZA WEBAUTHN)
-- ============================================
-- ⚠️ ATTENZIONE: Questo metodo crea un utente senza passkey
-- L'utente dovrà registrarsi normalmente per avere un passkey
-- Ma può già accedere come admin se ha altri metodi di autenticazione

-- Genera un nuovo UUID per l'admin
-- Puoi usare: SELECT gen_random_uuid();

-- Inserisci l'admin direttamente
INSERT INTO users (
  id,
  nickname,
  nome,
  cognome,
  email,
  is_admin,
  punti_personali,
  squadra_id
) VALUES (
  gen_random_uuid(),  -- Oppure usa un UUID specifico
  'Admin',
  'Nome',
  'Cognome',
  'admin@30diciaccio.it',
  true,  -- ✅ IMPORTANTE: is_admin = true
  0,
  NULL  -- Puoi assegnare una squadra se vuoi
);

-- ============================================
-- VERIFICA UTENTI ADMIN
-- ============================================
-- Mostra tutti gli admin
SELECT 
  id,
  nickname,
  nome,
  cognome,
  email,
  is_admin,
  punti_personali,
  squadra_id,
  created_at
FROM users
WHERE is_admin = true
ORDER BY created_at;

-- ============================================
-- FUNZIONI ADMIN DISPONIBILI
-- ============================================

-- 1. DARE PUNTI EXTRA (BONUS PUNTI)
-- ============================================
-- Gli admin possono dare punti extra tramite la tabella bonus_punti
-- La funzione è già implementata nel frontend (aggiungiBonus)

-- Esempio: Dare 50 punti bonus a un utente
INSERT INTO bonus_punti (
  user_id,
  admin_id,
  punti,
  motivo
) VALUES (
  'UUID_UTENTE_DESTINATARIO',  -- ID dell'utente che riceve i punti
  'UUID_ADMIN',                -- ID dell'admin che assegna
  50,                          -- Punti da assegnare
  'MVP della gara'             -- Motivo del bonus
);

-- Aggiorna i punti dell'utente
UPDATE users
SET punti_personali = punti_personali + 50
WHERE id = 'UUID_UTENTE_DESTINATARIO';

-- Crea notifica per l'utente
INSERT INTO notifiche (
  user_id,
  titolo,
  messaggio,
  tipo
) VALUES (
  'UUID_UTENTE_DESTINATARIO',
  'Bonus Punti! 🎁',
  'Hai ricevuto 50 punti bonus: MVP della gara',
  'bonus'
);

-- 2. AGGIUDICARE CLASSIFICA GARE
-- ============================================
-- Gli admin possono aggiudicare la classifica delle gare usando la funzione:
-- assegna_classifica_gara(p_gara_id, p_classifiche)

-- Esempio: Aggiudicare classifica per una gara
-- p_classifiche è un array JSONB con squadra_id e posizione
SELECT assegna_classifica_gara(
  'UUID_GARA',  -- ID della gara
  '[
    {"squadra_id": "UUID_SQUADRA_1", "posizione": 1},
    {"squadra_id": "UUID_SQUADRA_2", "posizione": 2},
    {"squadra_id": "UUID_SQUADRA_3", "posizione": 3}
  ]'::jsonb
);

-- Verifica la classifica assegnata
SELECT * FROM get_classifica_gara('UUID_GARA');

-- 3. INVIARE NOTIFICHE PERSONALIZZATE
-- ============================================
-- Gli admin possono inviare notifiche personalizzate a utenti specifici

-- Notifica a un singolo utente
INSERT INTO notifiche (
  user_id,
  titolo,
  messaggio,
  tipo
) VALUES (
  'UUID_UTENTE',
  'Titolo Notifica',
  'Messaggio personalizzato per l''utente',
  'sistema'  -- Tipo: 'quest', 'gara', 'bonus', 'sistema'
);

-- Notifica a tutti gli utenti (tranne admin)
INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
SELECT 
  id,
  'Annuncio Importante',
  'Messaggio per tutti gli utenti',
  'sistema'
FROM users
WHERE is_admin = false;

-- Notifica a una squadra specifica
INSERT INTO notifiche (user_id, titolo, messaggio, tipo)
SELECT 
  u.id,
  'Notifica Squadra',
  'Messaggio per la tua squadra',
  'sistema'
FROM users u
WHERE u.squadra_id = 'UUID_SQUADRA'
  AND u.is_admin = false;

-- ============================================
-- UTILITY: TROVARE UTENTI E SQUADRE
-- ============================================

-- Trova utente per nickname
SELECT id, nickname, is_admin, punti_personali, squadra_id
FROM users
WHERE nickname ILIKE '%NICKNAME%';

-- Trova tutte le squadre
SELECT id, nome, emoji, punti_squadra, colore
FROM squadre
ORDER BY punti_squadra DESC;

-- Trova tutte le gare
SELECT id, nome, stato, giorno, punti_in_palio
FROM gare
ORDER BY giorno, created_at DESC;

-- ============================================
-- ESEMPIO COMPLETO: WORKFLOW ADMIN
-- ============================================

-- 1. Trova l'utente da rendere admin
SELECT id, nickname FROM users WHERE nickname = 'Mario';

-- 2. Rendi admin (sostituisci con l'ID reale)
-- UPDATE users SET is_admin = true WHERE id = 'UUID_MARIO';

-- 3. Verifica
-- SELECT nickname, is_admin FROM users WHERE id = 'UUID_MARIO';

-- 4. Ora l'utente può:
--    - Accedere alla pagina /admin nell'app
--    - Dare punti bonus tramite l'interfaccia
--    - Aggiudicare classifiche gare
--    - Inviare notifiche push personalizzate

-- ============================================
-- NOTE IMPORTANTI
-- ============================================
-- ✅ Gli admin possono accedere alla pagina /admin nell'app
-- ✅ L'interfaccia admin è già implementata in AdminPage.tsx
-- ✅ Le funzioni SQL sono già create e funzionanti
-- ✅ Gli admin possono:
--    - Dare punti extra (tab bonus)
--    - Aggiudicare classifiche gare (tab gare)
--    - Inviare notifiche push (pulsante in alto)
--    - Vedere tutte le squadre e utenti (tab squadre)

-- ⚠️ SICUREZZA:
-- - Verifica sempre che is_admin = true prima di eseguire operazioni admin
-- - Gli admin sono esclusi dal conteggio degli "utenti attivi" per la validazione
-- - Le funzioni SQL usano SECURITY DEFINER per sicurezza

-- ============================================
-- VERIFICA FINALE
-- ============================================
-- Mostra tutti gli admin e le loro informazioni
SELECT 
  u.id,
  u.nickname,
  u.email,
  u.is_admin,
  s.nome as squadra,
  COUNT(bp.id) as bonus_assegnati,
  u.created_at
FROM users u
LEFT JOIN squadre s ON u.squadra_id = s.id
LEFT JOIN bonus_punti bp ON bp.admin_id = u.id
WHERE u.is_admin = true
GROUP BY u.id, u.nickname, u.email, u.is_admin, s.nome, u.created_at
ORDER BY u.created_at;

-- ✅ Script completato!
-- Ora hai tutte le informazioni per creare e gestire utenti admin

