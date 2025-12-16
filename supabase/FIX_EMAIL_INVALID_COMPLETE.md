# 🔧 Fix Completo: "Email address is invalid"

## Problema
Anche dopo aver disabilitato la verifica email, ottieni ancora:
```
Error: Email address "test@gmail.com" is invalid
```

## Soluzione Completa - Passo per Passo

### 1. Verifica Email Provider è Abilitato

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr)
2. **Authentication** → **Providers**
3. Clicca su **Email**
4. Verifica che:
   - ✅ **Enable Email provider**: **ON** (deve essere verde/attivo)
   - ❌ **Confirm email**: **OFF** (deve essere disabilitato)
   - ❌ **Secure email change**: **OFF** (deve essere disabilitato)
5. **Clicca "Save"** e aspetta che salvi

### 2. Verifica URL Configuration

1. **Authentication** → **URL Configuration**
2. **Site URL**: Deve essere `https://localhost:5173`
3. **Redirect URLs**: Deve includere:
   - `https://localhost:5173`
   - `https://localhost:5173/**`
   - `https://localhost:5173/*`
4. **Clicca "Save"**

### 3. Verifica Rate Limits

1. **Authentication** → **Settings**
2. Cerca sezione **Rate Limits** o **Email Rate Limits**
3. Se ci sono limiti troppo bassi, aumentali o disabilitali temporaneamente
4. **Clicca "Save"**

### 4. Verifica Email Restrictions

1. **Authentication** → **Settings**
2. Cerca sezione **Email** o **Email Restrictions**
3. Verifica che non ci siano:
   - **Blocked email domains**: Dovrebbe essere vuoto o non includere `gmail.com`
   - **Allowed email domains**: Dovrebbe essere vuoto (permette tutti) o includere `gmail.com`
   - **Email validation**: Dovrebbe essere disabilitato o permissivo

### 5. Verifica Auth Settings Generali

1. **Authentication** → **Settings**
2. Cerca:
   - **Enable sign ups**: Deve essere **ON**
   - **Enable email signups**: Deve essere **ON**
   - **Disable signups**: Deve essere **OFF**

### 6. Verifica Email Templates (Potrebbe Bloccare)

1. **Authentication** → **Email Templates**
2. Verifica che i template non abbiano errori
3. Se necessario, resetta ai template di default

### 7. Verifica Logs per Dettagli

1. **Logs** → **API Logs**
2. Cerca le richieste a `/auth/v1/signup`
3. Controlla i messaggi di errore dettagliati
4. Cerca pattern come:
   - "email domain not allowed"
   - "rate limit exceeded"
   - "email validation failed"

## Test Alternativi

### Prova con Email Diversa

Se `test@gmail.com` non funziona, prova:
- `test@example.com`
- `test@test.com`
- `user@localhost.local`

### Verifica Configurazione con SQL

Esegui questo nel SQL Editor per verificare la configurazione Auth:

```sql
-- Verifica configurazione Auth (se accessibile)
SELECT * FROM auth.config 
WHERE key LIKE '%email%' OR key LIKE '%signup%';
```

## Se Nulla Funziona

### Opzione 1: Reset Completo Auth Settings

1. Vai su **Authentication** → **Settings**
2. Cerca "Reset to defaults" o "Restore defaults"
3. Poi riconfigura solo:
   - Email provider ON
   - Confirm email OFF

### Opzione 2: Verifica Project Settings

1. Vai su **Settings** → **General**
2. Verifica che il progetto non sia in modalità "restricted" o "maintenance"

### Opzione 3: Contatta Support o Verifica Status

1. Verifica lo status di Supabase: https://status.supabase.com
2. Controlla se ci sono problemi noti con Auth

## Checklist Finale

Prima di testare, verifica:

- [ ] Email provider è ON
- [ ] Confirm email è OFF
- [ ] Site URL è configurato correttamente
- [ ] Redirect URLs includono localhost:5173
- [ ] Non ci sono restrizioni su domini email
- [ ] Rate limits non sono troppo bassi
- [ ] Sign ups sono abilitati
- [ ] Hai salvato tutte le modifiche

## Dopo la Configurazione

1. **Ricarica completamente** la pagina (hard refresh: Cmd+Shift+R)
2. **Cancella cache del browser** se necessario
3. **Riavvia il dev server**
4. Prova di nuovo la registrazione

## Debug Aggiuntivo

Aggiungi questo nel codice per vedere più dettagli:

```typescript
console.log('Email normalizzata:', normalizedEmail);
console.log('Password length:', registrationData.password.length);
```

Se l'errore persiste, il problema è nella configurazione del dashboard Supabase, non nel codice.

