# 🚀 Quick Start: Deploy Edge Function Notifiche Push

## Passi Rapidi

### 1. Installa Supabase CLI (se non l'hai già)

```bash
npm install -g supabase
```

### 2. Login e Linka Progetto

```bash
supabase login
cd /Users/andrearitondale/PROJECTS/30diCiaccioGame
supabase link --project-ref smqoyszeqikjrhwgclrr
```

### 3. Genera Chiavi VAPID

```bash
npm install -g web-push
web-push generate-vapid-keys
```

**Salva le chiavi generate!**

### 4. Deploy Edge Function

```bash
supabase functions deploy send-push-notification
```

### 5. Configura Variabili d'Ambiente

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il progetto
3. Vai su **Edge Functions** → **send-push-notification**
4. Clicca **Settings** → **Secrets**
5. Aggiungi:
   - `VAPID_PUBLIC_KEY` = (la public key generata)
   - `VAPID_PRIVATE_KEY` = (la private key generata)

### 6. Configura Frontend

Aggiungi nel file `apps/web/.env.local`:

```env
VITE_VAPID_PUBLIC_KEY=la-tua-public-key-qui
```

### 7. Test!

1. Avvia l'app: `cd apps/web && npm run dev`
2. Accedi come utente
3. Vai nel profilo e abilita le notifiche push
4. Come admin, prova a inviare una notifica dalla pagina Admin

## ✅ Verifica

Dopo il deploy, verifica che la funzione sia attiva:

```bash
curl -X POST https://smqoyszeqikjrhwgclrr.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","payload":{"title":"Test","body":"Messaggio"}}'
```

## 🐛 Troubleshooting

**Errore "VAPID keys not configured"**
→ Aggiungi le chiavi nelle variabili d'ambiente della Edge Function

**Errore "No subscriptions found"**
→ L'utente deve prima abilitare le notifiche dal frontend

**Errore import web-push**
→ La libreria potrebbe non essere disponibile. Vedi `README.md` per alternative.

