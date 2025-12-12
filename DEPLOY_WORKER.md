# 🚀 Deploy Push Notification Worker

## ✅ Cosa ho fatto

1. ✅ **Tabella coda creata** (`push_notifications_queue`)
2. ✅ **Worker Node.js creato** (`apps/web/workers/push-notification-worker.js`)
3. ✅ **Endpoint API Vercel creato** (`apps/web/api/cron/push-notifications.js`)
4. ✅ **Configurazione Vercel** (`vercel.json`)

## 📋 Prossimi Passi

### 1. Applica la Migration

**Opzione A: Via Dashboard (Consigliato)**
1. Vai su **Supabase Dashboard** → **SQL Editor**
2. Apri il file `supabase/migrations/00016_push_notifications_queue.sql`
3. Copia tutto il contenuto
4. Incolla nell'SQL Editor
5. Clicca **"Run"**

**Opzione B: Via Script**
```bash
cd apps/web
npm run apply:push-queue
```

### 2. Configura Variabili d'Ambiente su Vercel

Vai su **Vercel Dashboard** → **Settings** → **Environment Variables** e aggiungi:

```
SUPABASE_URL=https://smqoyszeqikjrhwgclrr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
CRON_SECRET=your-random-secret (opzionale, per sicurezza)
```

### 3. Deploy su Vercel

```bash
git add .
git commit -m "Add push notification worker"
git push
```

Vercel farà il deploy automatico e configurerà il cron job.

### 4. Verifica il Cron Job

Dopo il deploy:
1. Vai su **Vercel Dashboard** → **Cron Jobs**
2. Dovresti vedere `push-notifications` configurato per eseguire ogni 5 minuti
3. Controlla i log per verificare che funzioni

## 🔍 Test

1. Invia una notifica dal pannello admin
2. Controlla la tabella `push_notifications_queue` nel database
3. Attendi max 5 minuti
4. Verifica che lo status diventi `sent`

## 📊 Monitoraggio

- **Log Vercel**: Dashboard → Deployments → Logs
- **Database**: Controlla `push_notifications_queue` per vedere lo stato
- **Errori**: Se una notifica fallisce 3 volte, viene marcata come `failed`

## 🐛 Troubleshooting

**Cron job non esegue:**
- Verifica che `vercel.json` sia nella root del progetto
- Controlla che il path `/api/cron/push-notifications` sia corretto

**Worker fallisce:**
- Verifica le variabili d'ambiente su Vercel
- Controlla i log su Vercel Dashboard
- Verifica che le chiavi VAPID siano corrette

**Notifiche non arrivano:**
- Verifica che l'utente abbia abilitato le notifiche push
- Controlla che le subscription siano attive nel database
- Verifica i log del worker per errori specifici

