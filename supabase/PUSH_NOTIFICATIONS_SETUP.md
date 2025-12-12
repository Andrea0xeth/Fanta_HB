# 📱 Setup Notifiche Push

Questo documento descrive come configurare e utilizzare il sistema di notifiche push per 30diCiaccioGame.

## 🎯 Funzionalità Implementate

Il sistema supporta notifiche push per:
- ✅ Nuove quest personali assegnate
- ✅ Nuove quest da verificare
- ✅ Nuove sfide di squadra
- ✅ Notifiche custom da parte dell'admin

## 📋 Prerequisiti

1. **Chiavi VAPID**: Devi generare una coppia di chiavi VAPID (Voluntary Application Server Identification) per autenticare le richieste push.

### Generare Chiavi VAPID

```bash
# Installa web-push globalmente
npm install -g web-push

# Genera le chiavi
web-push generate-vapid-keys
```

Questo genererà:
- **Public Key**: Aggiungila come variabile d'ambiente `VITE_VAPID_PUBLIC_KEY`
- **Private Key**: Usala nel server/Edge Function per inviare notifiche

## 🔧 Configurazione

### 1. Variabili d'Ambiente

Aggiungi nel file `.env`:

```env
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
```

### 2. Database Migration

Esegui la migration per creare la tabella `push_subscriptions`:

```sql
-- Esegui il file:
supabase/migrations/00015_push_notifications.sql
```

Questo creerà:
- Tabella `push_subscriptions` per salvare le subscription degli utenti
- Trigger automatici per inviare notifiche su eventi (nuove quest, gare, etc.)
- Funzioni helper per gestire le notifiche

### 3. Edge Function (Opzionale ma Consigliato)

Per inviare notifiche push, hai bisogno di un server che usa la libreria `web-push`. 

**Opzione A: Supabase Edge Function**

Crea una Edge Function in `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as webPush from "https://deno.land/x/web_push@v1.0.0/mod.ts"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''

serve(async (req) => {
  const { user_id, payload } = await req.json()

  // Recupera le subscription dell'utente
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .eq('enabled', true)

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ error: 'No subscriptions found' }), {
      status: 404,
    })
  }

  // Invia notifiche a tutte le subscription dell'utente
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      return await webPush.sendNotification(
        subscription,
        JSON.stringify(payload),
        {
          vapidDetails: {
            subject: 'mailto:admin@30diciaccio.it',
            publicKey: VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
          },
        }
      )
    })
  )

  const successCount = results.filter(r => r.status === 'fulfilled').length

  return new Response(
    JSON.stringify({ success: true, sent: successCount }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Opzione B: Server Node.js**

Crea un server Express o simile che usa `web-push`:

```typescript
import webpush from 'web-push';
import { supabase } from './supabase-client';

webpush.setVapidDetails(
  'mailto:admin@30diciaccio.it',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Endpoint per inviare notifiche
app.post('/api/send-push', async (req, res) => {
  const { user_id, payload } = req.body;
  
  // Recupera subscription dal database
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .eq('enabled', true);

  // Invia notifiche
  const promises = subscriptions.map(sub => 
    webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      },
      JSON.stringify(payload)
    )
  );

  await Promise.allSettled(promises);
  res.json({ success: true });
});
```

## 🚀 Utilizzo

### Per gli Utenti

1. Apri il profilo (clicca sull'avatar)
2. Nella sezione "Notifiche Push", clicca "Abilita"
3. Accetta il permesso del browser
4. Le notifiche verranno ricevute automaticamente per:
   - Nuove quest assegnate
   - Nuove quest da verificare
   - Nuove gare di squadra
   - Notifiche dall'admin

### Per gli Admin

1. Vai alla pagina Admin
2. Clicca "Invia Notifica Push" nell'header
3. Seleziona destinatario (Tutti / Squadra / Utente)
4. Inserisci titolo e messaggio
5. Clicca "Invia"

## 🔔 Notifiche Automatiche

Le seguenti notifiche vengono inviate automaticamente tramite trigger del database:

1. **Nuova Quest Assegnata**: Quando un utente riceve una nuova quest giornaliera
2. **Nuova Prova da Verificare**: Quando un utente carica una prova per una quest
3. **Nuova Gara Creata**: Quando viene creata una nuova gara (notifica ai membri delle squadre partecipanti)
4. **Gara Iniziata**: Quando una gara passa allo stato "live"

## 🐛 Troubleshooting

### Le notifiche non arrivano

1. **Verifica permessi**: L'utente deve aver concesso il permesso notifiche
2. **Verifica subscription**: Controlla che la subscription sia salvata nel database
3. **Verifica VAPID keys**: Assicurati che le chiavi siano configurate correttamente
4. **Verifica service worker**: Il service worker deve essere registrato e attivo
5. **Verifica HTTPS**: Le notifiche push funzionano solo su HTTPS (o localhost)

### Errore "VAPID public key non configurata"

Aggiungi `VITE_VAPID_PUBLIC_KEY` nel file `.env` con la tua chiave pubblica VAPID.

### Service Worker non si registra

1. Verifica che il file `sw.js` sia presente in `public/`
2. Verifica la configurazione di VitePWA in `vite.config.ts`
3. Controlla la console del browser per errori

## 📝 Note Importanti

- Le notifiche push funzionano solo su **HTTPS** (o localhost per sviluppo)
- Ogni browser gestisce le notifiche in modo diverso
- Le subscription possono scadere e devono essere rinnovate
- Il sistema supporta più dispositivi per utente (ogni dispositivo ha la sua subscription)

## 🔐 Sicurezza

- Le chiavi VAPID private devono essere mantenute segrete
- Non committare mai le chiavi private nel repository
- Usa variabili d'ambiente per tutte le chiavi sensibili
- Implementa rate limiting per prevenire spam di notifiche

