# 🔍 Come Controllare i Logs di Supabase

## Per Capire Perché l'Email Viene Rifiutata

### Passo 1: Vai ai Logs

1. Vai su: https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/logs/explorer
2. Seleziona **"API Logs"** dal menu a tendina in alto
3. Cerca le richieste a `/auth/v1/signup`

### Passo 2: Analizza la Richiesta Fallita

1. Clicca sulla richiesta che ha dato errore 400
2. Controlla:
   - **Request**: Verifica che l'email sia corretta nel body
   - **Response**: Cerca il messaggio di errore completo
   - **Status**: Dovrebbe essere 400

### Passo 3: Cerca Pattern

Nei logs, cerca:
- Messaggi che contengono "email"
- Messaggi che contengono "invalid"
- Messaggi che contengono "validation"
- Messaggi che contengono "restrict"

## Cosa Cercare

Il log dovrebbe mostrare:
- Il body della richiesta (con email e password)
- La risposta del server (con il messaggio di errore)
- Eventuali validazioni che sono state eseguite

## Se Non Vedi Logs

1. Verifica che i logs siano abilitati: **Settings** → **Logs**
2. Prova a fare una nuova registrazione mentre hai i logs aperti
3. I logs potrebbero richiedere qualche secondo per apparire

