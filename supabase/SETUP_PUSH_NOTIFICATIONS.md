# 📱 Setup Notifiche Push su Supabase

## 🎯 Passi da seguire

### 1. Esegui la Migration del Database

Vai su **Supabase Dashboard** → **SQL Editor** e esegui il file:

```
supabase/migrations/00015_push_notifications.sql
```

Questo creerà:
- ✅ Tabella `push_subscriptions` per salvare le subscription degli utenti
- ✅ Trigger automatici per inviare notifiche su:
  - Nuove quest assegnate
  - Nuove prove da verificare
  - Nuove gare create
  - Gare che iniziano (stato = 'live')
- ✅ Funzione `send_push_notification()` (helper per future implementazioni)

### 2. Verifica che la Migration sia stata applicata

Esegui questa query per verificare:

```sql
-- Verifica che la tabella esista
SELECT * FROM information_schema.tables 
WHERE table_name = 'push_subscriptions';

-- Verifica i trigger
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%' OR trigger_name LIKE '%push%';
```

### 3. Crea e Deploy Edge Function per inviare notifiche push

✅ **Edge Function già creata!** 

La funzione è in `supabase/functions/send-push-notification/index.ts` e include:
- ✅ Invio effettivo di notifiche push usando web-push
- ✅ Gestione errori e subscription invalide
- ✅ Disabilitazione automatica di subscription scadute
- ✅ Supporto CORS completo

**Deploy Rapido:**

```bash
# 1. Installa Supabase CLI (se non l'hai già)
npm install -g supabase

# 2. Login e linka progetto
supabase login
cd /Users/andrearitondale/PROJECTS/30diCiaccioGame
supabase link --project-ref smqoyszeqikjrhwgclrr

# 3. Deploy della funzione
supabase functions deploy send-push-notification
```

**Vedi `supabase/functions/QUICK_START.md` per una guida passo-passo completa.**

**Dopo il deploy**, configura le variabili d'ambiente nella dashboard Supabase:
1. Dashboard → Edge Functions → send-push-notification → Settings → Secrets
2. Aggiungi `VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` (vedi sezione 4 per generarle)

**Alternativa: Server Node.js separato** (se preferisci non usare Edge Functions)

Se preferisci un server separato invece dell'Edge Function, vedi l'esempio completo in `supabase/functions/send-push-notification/README.md` nella sezione "Alternative Implementation".

### 4. Genera e Configura le Chiavi VAPID

**Genera le chiavi VAPID:**

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Questo genererà due chiavi:
- **Public Key**: Aggiungila in due posti:
  1. Edge Function: Dashboard → Edge Functions → send-push-notification → Settings → Secrets → `VAPID_PUBLIC_KEY`
  2. Frontend: File `.env` o `.env.local` → `VITE_VAPID_PUBLIC_KEY=la-tua-public-key`

- **Private Key**: Aggiungila SOLO nella Edge Function:
  - Edge Function: Dashboard → Edge Functions → send-push-notification → Settings → Secrets → `VAPID_PRIVATE_KEY`
  - ⚠️ **MAI nel frontend!** È segreta!

**Nota**: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` sono già disponibili automaticamente nelle Edge Functions.

### 5. Test delle Notifiche

Dopo aver configurato tutto:

1. **Frontend**: Gli utenti possono abilitare le notifiche dal profilo
2. **Database**: I trigger invieranno automaticamente notifiche quando:
   - Viene assegnata una nuova quest
   - Viene caricata una nuova prova
   - Viene creata una nuova gara
   - Una gara inizia
3. **Admin**: Può inviare notifiche custom dalla pagina Admin

## ⚠️ Note Importanti

- Le notifiche push funzionano solo su **HTTPS** (o localhost)
- Ogni browser gestisce le notifiche in modo diverso
- Le subscription possono scadere e devono essere rinnovate
- Il sistema supporta più dispositivi per utente

## 🔍 Verifica Setup

Esegui questa query per verificare che tutto sia configurato:

```sql
-- Verifica tabella
SELECT COUNT(*) as subscription_count 
FROM push_subscriptions 
WHERE enabled = true;

-- Verifica trigger
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%'
ORDER BY event_object_table;
```

## 📝 Prossimi Passi

1. ✅ Esegui la migration `00015_push_notifications.sql` (già fatto!)
2. 🚀 Deploy Edge Function: `supabase functions deploy send-push-notification`
3. ⚙️ Genera e configura le chiavi VAPID (vedi sezione 4 sopra)
4. 🧪 Testa le notifiche push dal frontend

## 📚 Documentazione Aggiuntiva

- `supabase/functions/DEPLOY.md` - Guida completa al deploy
- `supabase/functions/send-push-notification/README.md` - Documentazione della funzione
- `supabase/PUSH_NOTIFICATIONS_SETUP.md` - Setup completo del sistema

