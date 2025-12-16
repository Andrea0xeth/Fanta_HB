# Edge Function: create-user-admin

Questa Edge Function crea utenti usando l'Admin API di Supabase, bypassando completamente la validazione email che può bloccare alcune email.

## Deploy

```bash
cd supabase/functions
supabase functions deploy create-user-admin
```

## Variabili d'ambiente

La funzione usa automaticamente le variabili d'ambiente di Supabase:
- `SUPABASE_URL`: URL del progetto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (configurata automaticamente)

## Uso

### Request

```typescript
POST /functions/v1/create-user-admin
Content-Type: application/json
Authorization: Bearer <anon_key>

{
  "email": "user@example.com",
  "password": "securepassword",
  "user_metadata": {
    "nome": "Mario",
    "cognome": "Rossi",
    "data_nascita": "1990-01-01",
    "telefono": "+39123456789"
  }
}
```

### Response

```typescript
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z",
    "user_metadata": { ... }
  }
}
```

## Note

- L'utente viene creato con `email_confirm: true`, quindi l'email è già confermata
- Dopo la creazione, il client deve chiamare `signInWithPassword` per ottenere la sessione
- Questa funzione bypassa tutte le validazioni email di Supabase Auth

