# 🚀 Deploy Edge Function - Guida Completa

## Perché non vedi la funzione?

La funzione `send-push-notification` non appare perché **non è ancora stata deployata**. Devo prima fare il deploy, poi apparirà nella lista.

## 📋 Passi per Deploy

### Opzione 1: Via Dashboard (Più Semplice)

1. **Vai su Edge Functions** nel dashboard Supabase
2. **Clicca "Open Editor"** o **"Deploy a new function"**
3. **Crea una nuova funzione:**
   - Nome: `send-push-notification`
   - Template: "Simple Hello World" (lo modificheremo dopo)
4. **Sostituisci tutto il codice** con il contenuto del file:
   ```
   supabase/functions/send-push-notification/index.ts
   ```
5. **Clicca "Deploy"**

### Opzione 2: Via CLI (Consigliato)

**1. Login (una volta sola):**
```bash
npx supabase login
```
Questo aprirà il browser per autenticarti.

**2. Link progetto:**
```bash
cd /Users/andrearitondale/PROJECTS/30diCiaccioGame
npx supabase link --project-ref smqoyszeqikjrhwgclrr
```

**3. Deploy:**
```bash
npx supabase functions deploy send-push-notification
```

## ⚙️ Dopo il Deploy: Configura Secrets

Una volta deployata, la funzione apparirà nella lista. Poi:

1. **Clicca su `send-push-notification`**
2. **Vai su "Settings"** (o "Configuration")
3. **Clicca su "Secrets"** (o "Environment Variables")
4. **Aggiungi:**
   - `VAPID_PUBLIC_KEY` = (la tua public key)
   - `VAPID_PRIVATE_KEY` = (la tua private key)

## 🔑 Genera Chiavi VAPID (se non l'hai già fatto)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copia le chiavi generate.

## ✅ Verifica Deploy

Dopo il deploy, dovresti vedere:
- La funzione `send-push-notification` nella lista
- Un URL tipo: `https://smqoyszeqikjrhwgclrr.supabase.co/functions/v1/send-push-notification`

## 🐛 Se il Deploy Fallisce

**Errore "function not found":**
- Assicurati di essere nella directory corretta
- Verifica che il file `supabase/functions/send-push-notification/index.ts` esista

**Errore "authentication required":**
- Esegui `npx supabase login` di nuovo

**Errore "project not linked":**
- Esegui `npx supabase link --project-ref smqoyszeqikjrhwgclrr`

