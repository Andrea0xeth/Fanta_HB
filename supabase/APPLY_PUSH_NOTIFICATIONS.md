# 🚀 Applica Migration Notifiche Push

## Metodo 1: Script Automatico (Consigliato)

Se hai configurato le credenziali del database nel file `.env.local`:

```bash
cd apps/web
npm run apply:push-notifications
```

**Requisiti nel file `apps/web/.env.local`:**
```env
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_DB_PASSWORD=la-tua-password-database
```

Oppure usa la connection string completa:
```env
VITE_SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Dove trovare le credenziali:**
- Dashboard Supabase → Settings → Database
- **Database password**: Settings → Database → Database password
- **Connection string**: Settings → Database → Connection string → URI

## Metodo 2: SQL Editor (Più Semplice)

Se lo script non funziona o preferisci farlo manualmente:

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** nel menu laterale
4. Clicca **"New query"**
5. Apri il file `supabase/migrations/00015_push_notifications.sql`
6. Copia tutto il contenuto
7. Incolla nel SQL Editor
8. Clicca **"Run"** o premi `Cmd/Ctrl + Enter`

## Verifica

Dopo aver applicato la migration, verifica che tutto sia stato creato:

```sql
-- Verifica tabella
SELECT * FROM push_subscriptions LIMIT 1;

-- Verifica trigger
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%';

-- Verifica funzioni
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%push%' OR routine_name LIKE '%notify%';
```

## ✅ Cosa viene creato

- ✅ Tabella `push_subscriptions` per salvare le subscription push
- ✅ Trigger `trigger_notify_new_quest_assigned` - Notifica nuove quest
- ✅ Trigger `trigger_notify_new_proof_to_verify` - Notifica nuove prove
- ✅ Trigger `trigger_notify_new_gara` - Notifica nuove gare
- ✅ Trigger `trigger_notify_gara_started` - Notifica gare iniziate
- ✅ Funzione `send_push_notification()` - Helper per notifiche

## 🎯 Prossimi Passi

Dopo aver applicato la migration:

1. ✅ Configura le chiavi VAPID (vedi `PUSH_NOTIFICATIONS_SETUP.md`)
2. ✅ Testa le notifiche push dal frontend
3. ⚙️ (Opzionale) Crea Edge Function per inviare notifiche push

