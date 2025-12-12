# 🚀 Come Deployare il Worker su Vercel

## ✅ Buone Notizie: È Già Configurato!

Il worker è **già integrato** nel progetto e Vercel lo deployerà automaticamente. Non serve un deploy separato!

## 📁 Struttura

```
apps/web/
├── api/
│   └── cron/
│       └── push-notifications.js  ← Endpoint API Vercel (già creato)
├── workers/
│   └── push-notification-worker.js  ← Logica del worker
└── vercel.json  ← Configurazione cron job (già creato)
```

## 🔄 Come Funziona

1. **Vercel riconosce automaticamente** la cartella `api/` come serverless functions
2. Il file `apps/web/api/cron/push-notifications.js` diventa l'endpoint: `https://dc30.vercel.app/api/cron/push-notifications`
3. Il `vercel.json` configura il cron job per chiamare questo endpoint ogni 5 minuti
4. Quando il cron job chiama l'endpoint, Vercel esegue il codice del worker

## 📋 Passi per il Deploy

### 1. Applica la Migration (una volta)

Vai su **Supabase Dashboard** → **SQL Editor** e incolla:
```sql
-- Vedi: supabase/migrations/00016_push_notifications_queue.sql
```

### 2. Configura Variabili d'Ambiente su Vercel

Vercel Dashboard → **Settings** → **Environment Variables** → Aggiungi:

```
SUPABASE_URL=https://smqoyszeqikjrhwgclrr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
VAPID_PUBLIC_KEY=BAa5lXn2fI9jgYHZJly-VDlxNp8Snmvh1eUmy1Okh2Mdg8ig-FYXeV4_DHPw_WbFPnZj3eeGy8n-3JHQOcm7Nwo
VAPID_PRIVATE_KEY=4k2Xx... (la tua private key)
```

**⚠️ IMPORTANTE:** Senza prefisso `VITE_` perché sono per il backend!

### 3. Deploy Automatico

Quando fai `git push`, Vercel:
1. ✅ Builda il frontend
2. ✅ Deploya l'endpoint API `/api/cron/push-notifications`
3. ✅ Configura il cron job automaticamente

### 4. Verifica il Deploy

Dopo il deploy su Vercel:

1. **Vai su Vercel Dashboard** → **Deployments** → Clicca sull'ultimo deploy
2. **Vai su "Functions"** → Dovresti vedere `/api/cron/push-notifications`
3. **Vai su "Cron Jobs"** → Dovresti vedere `push-notifications` configurato

## 🧪 Test Manuale

Puoi testare l'endpoint manualmente:

```bash
curl https://dc30.vercel.app/api/cron/push-notifications
```

Dovresti ricevere una risposta JSON con `success: true`.

## 📊 Monitoraggio

- **Log Vercel**: Dashboard → Deployments → Logs
- **Cron Jobs**: Dashboard → Cron Jobs → Vedi esecuzioni
- **Database**: Controlla `push_notifications_queue` per vedere le notifiche processate

## 🐛 Se Non Funziona

1. **Verifica che l'endpoint esista**: Vai su Vercel → Functions
2. **Controlla i log**: Vercel → Deployments → Logs
3. **Verifica variabili d'ambiente**: Vercel → Settings → Environment Variables
4. **Testa manualmente**: `curl https://dc30.vercel.app/api/cron/push-notifications`

## ✅ Riepilogo

- ✅ Worker già integrato come endpoint API
- ✅ Cron job già configurato in `vercel.json`
- ✅ Deploy automatico quando fai `git push`
- ⚠️ Devi solo: applicare migration + configurare variabili d'ambiente

**Non serve deploy separato!** È tutto integrato nel progetto. 🎉

