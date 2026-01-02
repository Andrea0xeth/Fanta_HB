# 📱 Edge Function: Send Push Notification

Edge Function per inviare notifiche push agli utenti.

## 🚀 Deploy

```bash
# Assicurati di essere nella root del progetto
cd /Users/andrearitondale/PROJECTS/DC-30

# Se non hai ancora linkato il progetto
supabase link --project-ref smqoyszeqikjrhwgclrr

# Deploy della funzione
supabase functions deploy send-push-notification
```

## ⚙️ Configurazione Variabili d'Ambiente

Dopo il deploy, configura le variabili d'ambiente nella dashboard Supabase:

1. Vai su **Dashboard** → **Edge Functions** → **send-push-notification**
2. Clicca su **Settings** → **Secrets**
3. Aggiungi:
   - `VAPID_PUBLIC_KEY`: La tua chiave pubblica VAPID
   - `VAPID_PRIVATE_KEY`: La tua chiave privata VAPID

**Nota**: Le variabili `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono già disponibili automaticamente.

## 📝 Generare Chiavi VAPID

```bash
# Installa web-push globalmente
npm install -g web-push

# Genera le chiavi
web-push generate-vapid-keys
```

Questo genererà:
- **Public Key**: Aggiungila come `VAPID_PUBLIC_KEY` nella Edge Function
- **Private Key**: Aggiungila come `VAPID_PRIVATE_KEY` nella Edge Function (SEGRETA!)

Aggiungi anche la **Public Key** nel file `.env` del frontend come `VITE_VAPID_PUBLIC_KEY`.

## 🔧 Utilizzo

La funzione viene chiamata automaticamente dal frontend tramite:

```typescript
import { sendPushNotification } from '../lib/pushNotifications';

await sendPushNotification(userId, {
  title: 'Titolo',
  body: 'Messaggio',
  icon: '/pwa-192x192.png',
  url: '/home',
});
```

## 📊 Response

La funzione restituisce:

```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "disabled": 0,
  "total": 2,
  "message": "Notifiche inviate: 2/2"
}
```

## 🔍 Troubleshooting

### Errore "VAPID keys not configured"
- Verifica di aver aggiunto le chiavi VAPID nelle variabili d'ambiente della Edge Function

### Errore "No active subscriptions found"
- L'utente non ha abilitato le notifiche push
- Le subscription potrebbero essere scadute

### Subscription disabilitate automaticamente
- Se una subscription è invalida (410 Gone) o malformata (400 Bad Request), viene automaticamente disabilitata
- L'utente dovrà riabilitare le notifiche dal frontend

