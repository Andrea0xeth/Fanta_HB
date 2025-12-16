# 🔍 Debug: "Email address is invalid"

## Situazione Attuale
- ✅ Email normalizzata correttamente: `test@gmail.com`
- ❌ Supabase rifiuta ancora: `Email address "test@gmail.com" is invalid`
- 🔍 Codice errore: `email_address_invalid`

## Questo Significa
Il problema è **100% nella configurazione del dashboard Supabase**, non nel codice.

## Verifica Immediata nel Dashboard

### 1. Authentication → Providers → Email

Vai su [Dashboard](https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/auth/providers)

**Deve essere esattamente così:**
- ✅ **Enable Email provider**: Toggle **ON** (verde)
- ❌ **Confirm email**: Toggle **OFF** (grigio)
- ❌ **Secure email change**: Toggle **OFF** (grigio)
- **Double confirm changes**: Toggle **OFF** (grigio)

**IMPORTANTE**: Dopo aver cambiato, clicca **"Save"** e aspetta 5-10 secondi.

### 2. Authentication → Settings

Vai su [Settings](https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/auth/url-configuration)

**Verifica:**
- ✅ **Enable sign ups**: Deve essere **ON**
- ✅ **Site URL**: `https://localhost:5173`
- ✅ **Redirect URLs**: Deve includere `https://localhost:5173/**`

### 3. Prova con Email Diversa

Se `test@gmail.com` non funziona, prova:
- `user@example.com`
- `test@test.com`
- `admin@localhost.local`

**Se funziona con altre email**: C'è una restrizione specifica su `gmail.com`

**Se non funziona con nessuna email**: Il problema è nella configurazione generale

### 4. Verifica Logs Supabase

1. Vai su **Logs** → **API Logs**
2. Cerca le richieste a `/auth/v1/signup`
3. Apri la richiesta fallita
4. Controlla:
   - **Request body**: Verifica che l'email sia corretta
   - **Response**: Cerca messaggi di errore dettagliati
   - **Status code**: Dovrebbe essere 400

### 5. Verifica Rate Limits

1. **Authentication** → **Settings**
2. Cerca **Rate Limits** o **Email Rate Limits**
3. Se ci sono limiti, aumentali o disabilitali temporaneamente

### 6. Reset Configurazione Email

Se nulla funziona:

1. **Authentication** → **Providers** → **Email**
2. **Disabilita** Email provider (toggle OFF)
3. **Salva** e aspetta 5 secondi
4. **Riabilita** Email provider (toggle ON)
5. **Disabilita** "Confirm email" (toggle OFF)
6. **Salva** e aspetta 5 secondi
7. Prova di nuovo

## Alternative

### Opzione 1: Usa Email Diversa
Se `gmail.com` è bloccato, usa:
- `test@example.com`
- `user@test.com`

### Opzione 2: Verifica Progetto
1. Vai su **Settings** → **General**
2. Verifica che il progetto non sia in modalità "restricted"
3. Verifica che non ci siano limitazioni sul piano

### Opzione 3: Contatta Support
Se nulla funziona, potrebbe essere un bug di Supabase. Contatta il supporto con:
- Codice errore: `email_address_invalid`
- Email testata: `test@gmail.com`
- Configurazione: Email provider ON, Confirm email OFF

## Checklist Finale

Prima di testare, verifica:

- [ ] Email provider è **ON** (verde)
- [ ] Confirm email è **OFF** (grigio)
- [ ] Hai cliccato **"Save"** dopo ogni modifica
- [ ] Hai aspettato 5-10 secondi dopo il save
- [ ] Site URL è `https://localhost:5173`
- [ ] Redirect URLs include `https://localhost:5173/**`
- [ ] Enable sign ups è **ON**
- [ ] Non ci sono rate limits troppo bassi

## Se Ancora Non Funziona

Prova a:
1. **Cancellare la cache del browser** (hard refresh: Cmd+Shift+R)
2. **Riavviare il dev server**
3. **Provare in una finestra incognito**
4. **Provare con un'email completamente diversa** (es. `user@example.com`)

