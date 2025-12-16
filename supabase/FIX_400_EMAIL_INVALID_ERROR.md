# 🔧 Fix Errore 400 "Email address is invalid"

## Problema
Quando provi a registrarti con email/password, ottieni:
```
Error: Email address "test@gmail.com" is invalid
```

Questo errore viene da **Supabase Auth**, non dal nostro codice.

## Soluzione: Configura Auth nel Dashboard

### Passo 1: Abilita Email Provider

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr)
2. Vai su **Authentication** → **Providers** nel menu laterale
3. Trova **Email** nella lista dei provider
4. Assicurati che sia **abilitato** (toggle ON)
5. Clicca su **Email** per aprire le impostazioni

### Passo 2: Configura Impostazioni Email

Nelle impostazioni Email, verifica:

- ✅ **Enable Email provider**: Deve essere **ON**
- ✅ **Confirm email**: Può essere **OFF** per sviluppo (o ON per produzione)
- ✅ **Secure email change**: Può essere **OFF** per sviluppo

### Passo 3: Configura URL

1. Vai su **Authentication** → **URL Configuration**
2. Verifica **Site URL**:
   - Per sviluppo: `https://localhost:5173`
   - Per produzione: il tuo dominio reale
3. Verifica **Redirect URLs**:
   - Aggiungi: `https://localhost:5173/**`
   - Aggiungi: `https://localhost:5173/*`

### Passo 4: Verifica Restrizioni Email

1. Vai su **Authentication** → **Settings**
2. Controlla se ci sono **restrizioni sui domini email**:
   - Se c'è una lista di domini permessi, assicurati che `gmail.com` sia incluso
   - Oppure rimuovi le restrizioni per sviluppo

### Passo 5: Verifica Rate Limiting

1. Vai su **Authentication** → **Settings**
2. Controlla **Rate Limits**:
   - Se ci sono limiti troppo restrittivi, potrebbero bloccare le registrazioni
   - Per sviluppo, puoi aumentare i limiti o disabilitarli temporaneamente

## Test Dopo Configurazione

Dopo aver configurato tutto:

1. **Ricarica la pagina** dell'app
2. Prova di nuovo la registrazione con email/password
3. L'errore 400 dovrebbe essere risolto

## Se il Problema Persiste

### Verifica Logs

1. Vai su **Logs** → **API Logs** nel dashboard
2. Cerca le richieste a `/auth/v1/signup`
3. Controlla i messaggi di errore dettagliati

### Verifica Configurazione Auth

Esegui questa query nel SQL Editor per verificare la configurazione:

```sql
-- Verifica se Auth è configurato correttamente
SELECT 
  name,
  value
FROM auth.config
WHERE name LIKE '%email%' OR name LIKE '%signup%';
```

### Alternative

Se il problema persiste, prova:

1. **Usa un'email diversa**: Prova con `test@example.com` invece di `test@gmail.com`
2. **Disabilita temporaneamente la conferma email**: Settings → Email → Confirm email = OFF
3. **Verifica che non ci siano policy RLS** che bloccano la creazione di utenti in `auth.users`

## Note Importanti

- L'errore 400 viene da **Supabase Auth**, non dal nostro codice
- Il nostro codice ora usa la funzione RPC `check_email_exists` per evitare errori 406
- Se la funzione RPC non esiste, il codice continua comunque (non blocca la registrazione)
- Supabase Auth controllerà comunque i duplicati email

