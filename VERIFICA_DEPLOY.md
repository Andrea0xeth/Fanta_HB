# ✅ Verifica Deploy Vercel - Push Notifications

## 🎉 Deploy Completato!

Il deploy su Vercel è andato a buon fine (9 minuti fa).

## 🔍 Verifica che Tutto Funzioni

### 1. Verifica Endpoint API

Vai su **Vercel Dashboard** → **Deployments** → Clicca sull'ultimo deploy → **Functions**

Dovresti vedere:
- ✅ `/api/cron/push-notifications` nella lista delle functions

### 2. Verifica Cron Job

Vai su **Vercel Dashboard** → **Settings** → **Cron Jobs**

Dovresti vedere:
- ✅ `push-notifications` configurato
- ✅ Schedule: `*/5 * * * *` (ogni 5 minuti)
- ✅ Path: `/api/cron/push-notifications`

### 3. Verifica Variabili d'Ambiente

Vai su **Vercel Dashboard** → **Settings** → **Environment Variables**

Verifica che ci siano (senza `VITE_`):
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `VAPID_PUBLIC_KEY`
- ✅ `VAPID_PRIVATE_KEY`

### 4. Test Manuale dell'Endpoint

Puoi testare manualmente l'endpoint:

```bash
curl https://dc30.vercel.app/api/cron/push-notifications
```

Dovresti ricevere:
```json
{
  "success": true,
  "message": "Queue processed successfully",
  "timestamp": "..."
}
```

### 5. Verifica Log

Vai su **Vercel Dashboard** → **Deployments** → Clicca sull'ultimo deploy → **Logs**

Dovresti vedere i log quando il cron job esegue (ogni 5 minuti).

## 📊 Monitoraggio

### Verifica che il Worker Processi le Notifiche

1. **Invia una notifica** dal pannello admin
2. **Controlla il database**:
   - Tabella `push_notifications_queue` → Dovresti vedere la notifica con status `pending`
3. **Attendi max 5 minuti** (prossima esecuzione del cron)
4. **Controlla di nuovo**:
   - Status dovrebbe essere `sent` (se inviata) o `failed` (se errore)
   - Campo `sent_at` dovrebbe essere popolato

### Query SQL per Verificare

```sql
-- Vedi le notifiche nella coda
SELECT * FROM push_notifications_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Vedi le subscription attive
SELECT user_id, COUNT(*) as subscriptions 
FROM push_subscriptions 
WHERE enabled = true 
GROUP BY user_id;
```

## 🐛 Se Non Funziona

### Cron Job Non Esegue
- Verifica che `vercel.json` sia nella **root** del progetto
- Verifica che il path sia corretto: `/api/cron/push-notifications`
- Controlla i log su Vercel per errori

### Worker Fallisce
- Verifica le variabili d'ambiente su Vercel
- Controlla i log su Vercel Dashboard
- Verifica che la tabella `push_notifications_queue` esista

### Notifiche Non Arrivano
- Verifica che l'utente abbia abilitato le notifiche push
- Controlla che ci siano subscription attive nel database
- Verifica i log del worker per errori specifici

## ✅ Checklist Completa

- [ ] Deploy completato su Vercel
- [ ] Endpoint `/api/cron/push-notifications` visibile in Functions
- [ ] Cron job configurato in Settings → Cron Jobs
- [ ] Variabili d'ambiente configurate (senza `VITE_`)
- [ ] Tabella `push_notifications_queue` creata nel database
- [ ] Test manuale endpoint restituisce success
- [ ] Notifica inviata dal pannello admin → Appare nella coda
- [ ] Dopo 5 minuti → Status diventa `sent`

## 🎯 Prossimi Passi

1. **Applica la migration** (se non l'hai già fatto):
   - Supabase Dashboard → SQL Editor
   - Incolla `supabase/migrations/00016_push_notifications_queue.sql`

2. **Testa il sistema**:
   - Invia una notifica dal pannello admin
   - Attendi max 5 minuti
   - Verifica che arrivi la notifica push

3. **Monitora**:
   - Controlla i log su Vercel
   - Controlla la tabella `push_notifications_queue`

Tutto dovrebbe funzionare! 🚀

