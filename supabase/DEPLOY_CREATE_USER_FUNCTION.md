# Deploy Edge Function: create-user-admin

Questa guida spiega come deployare la Edge Function che crea utenti usando l'Admin API, bypassando la validazione email.

## Perché questa funzione?

Se Supabase Auth continua a rifiutare email valide con l'errore `email_address_invalid`, questa funzione usa l'Admin API per creare l'utente direttamente, bypassando tutte le validazioni.

## Deploy

### 1. Assicurati di essere autenticato con Supabase CLI

```bash
supabase login
```

### 2. Linka il progetto (se non già fatto)

```bash
supabase link --project-ref <your-project-ref>
```

### 3. Deploy della funzione

```bash
cd supabase/functions
supabase functions deploy create-user-admin
```

Oppure dalla root del progetto:

```bash
supabase functions deploy create-user-admin --project-ref <your-project-ref>
```

## Verifica

Dopo il deploy, verifica che la funzione sia disponibile:

```bash
supabase functions list
```

Dovresti vedere `create-user-admin` nella lista.

## Test

Puoi testare la funzione con curl:

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/create-user-admin' \
  -H 'Authorization: Bearer <anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

## Variabili d'ambiente

La funzione usa automaticamente:
- `SUPABASE_URL`: Configurata automaticamente da Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Configurata automaticamente da Supabase

Non devi configurare nulla manualmente.

## Troubleshooting

### Errore: "Function not found"
- Verifica che il deploy sia andato a buon fine
- Controlla che il nome della funzione sia corretto: `create-user-admin`

### Errore: "Unauthorized"
- Verifica che stai usando l'anon key corretta nel frontend
- Controlla che la funzione sia deployata correttamente

### Errore: "Service role key not found"
- La service role key è configurata automaticamente da Supabase
- Se vedi questo errore, potrebbe essere un problema di configurazione del progetto

