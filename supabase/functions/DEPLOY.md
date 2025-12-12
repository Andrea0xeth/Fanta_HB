# 🚀 Deploy Edge Functions

## Prerequisiti

1. **Installa Supabase CLI**:
```bash
npm install -g supabase
```

2. **Login a Supabase**:
```bash
supabase login
```

3. **Linka il progetto** (se non già fatto):
```bash
cd /Users/andrearitondale/PROJECTS/30diCiaccioGame
supabase link --project-ref smqoyszeqikjrhwgclrr
```

## Deploy Edge Function

### 1. Deploy send-push-notification

```bash
supabase functions deploy send-push-notification
```

### 2. Configura Variabili d'Ambiente

Dopo il deploy, vai su **Supabase Dashboard** → **Edge Functions** → **send-push-notification** → **Settings** → **Secrets**

Aggiungi:
- `VAPID_PUBLIC_KEY`: La tua chiave pubblica VAPID
- `VAPID_PRIVATE_KEY`: La tua chiave privata VAPID (SEGRETA!)

### 3. Genera Chiavi VAPID

Se non le hai ancora:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copia:
- **Public Key** → Variabile d'ambiente `VAPID_PUBLIC_KEY` nella Edge Function
- **Public Key** → Variabile d'ambiente `VITE_VAPID_PUBLIC_KEY` nel file `.env` del frontend
- **Private Key** → Variabile d'ambiente `VAPID_PRIVATE_KEY` nella Edge Function (SOLO QUI, MAI NEL FRONTEND!)

## Test

Dopo il deploy, puoi testare la funzione:

```bash
curl -X POST https://smqoyszeqikjrhwgclrr.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "payload": {
      "title": "Test",
      "body": "Messaggio di test"
    }
  }'
```

## Verifica

1. Vai su **Dashboard** → **Edge Functions**
2. Dovresti vedere `send-push-notification` nella lista
3. Clicca per vedere i log e le metriche

