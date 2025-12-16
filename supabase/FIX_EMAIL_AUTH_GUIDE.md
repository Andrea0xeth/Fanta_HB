# 🔧 Fix Autenticazione Email/Password

## Problema
- Errore 406 (Not Acceptable) quando si verifica se l'email esiste
- Errore 400 "Email address is invalid" durante la registrazione

## Soluzione

### Passo 1: Esegui lo Script SQL

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto: `smqoyszeqikjrhwgclrr`
3. Vai su **SQL Editor** nel menu laterale
4. Clicca **"New query"**
5. Apri il file `supabase/FIX_EMAIL_PASSWORD_AUTH.sql`
6. Copia tutto il contenuto
7. Incolla nel SQL Editor
8. Clicca **"Run"** o premi `Cmd/Ctrl + Enter`

### Passo 2: Verifica Configurazione Auth nel Dashboard

1. Vai su **Authentication** → **Providers** nel menu laterale
2. Assicurati che **Email** sia abilitato:
   - ✅ **Enable Email provider** deve essere attivo
   - ✅ **Confirm email** può essere disabilitato per sviluppo (o abilitato per produzione)
   - ✅ **Secure email change** può essere disabilitato per sviluppo

3. Vai su **Authentication** → **URL Configuration**:
   - **Site URL**: `https://localhost:5173` (per sviluppo)
   - **Redirect URLs**: Aggiungi `https://localhost:5173/**` se non c'è già

### Passo 3: Verifica che lo Script sia Stato Eseguito

Esegui questa query nel SQL Editor per verificare:

```sql
-- Verifica policy
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users';

-- Verifica funzione
SELECT proname 
FROM pg_proc 
WHERE proname = 'insert_user_with_passkey';

-- Verifica colonna email
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';
```

Dovresti vedere:
- ✅ Policy "Lettura pubblica users" con `cmd = SELECT` e `roles = {anon,authenticated}`
- ✅ Funzione `insert_user_with_passkey` presente
- ✅ Colonna `email` di tipo `text`

### Passo 4: Test

Dopo aver eseguito lo script, prova di nuovo a registrarti con email/password. Gli errori dovrebbero essere risolti.

## Se il Problema Persiste

### Errore 406 ancora presente:
- Verifica che la policy "Lettura pubblica users" esista e sia attiva
- Controlla che RLS sia abilitato: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`

### Errore 400 "Email address is invalid":
- Verifica nel Dashboard → Authentication → Providers → Email che il provider sia abilitato
- Controlla che non ci siano restrizioni su domini email (Settings → Auth → Email)
- Prova con un'email diversa (es. `test@example.com` invece di `test@gmail.com`)

### Altri Errori:
- Controlla la console del browser per messaggi di errore più dettagliati
- Verifica i log di Supabase: Dashboard → Logs → API Logs

