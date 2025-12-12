# 🚀 Setup OneSignal - Guida Completa

## ✅ Cosa è già stato fatto

1. ✅ Script OneSignal aggiunto in `index.html`
2. ✅ Service Worker OneSignal in `apps/web/public/OneSignalSDKWorker.js`
3. ✅ Hook `useOneSignal` creato
4. ✅ Componente `PushNotificationSettings` aggiornato
5. ✅ Endpoint API `/api/onesignal/send` creato
6. ✅ Componente `SendPushNotificationModal` aggiornato

## 📋 Configurazione Necessaria

### 1. Configura REST API Key su Vercel

**IMPORTANTE:** Devi configurare la REST API Key di OneSignal come variabile d'ambiente su Vercel.

#### Come ottenere la REST API Key:

1. Vai su **OneSignal Dashboard** → **Settings** → **Keys & IDs**
2. Copia la **REST API Key** (non la App ID, quella è già nel codice)

#### Come configurarla su Vercel:

1. Vai su **Vercel Dashboard** → **Il tuo progetto** → **Settings**
2. Vai su **Environment Variables**
3. Aggiungi una nuova variabile:
   - **Name**: `ONESIGNAL_REST_API_KEY`
   - **Value**: (incolla la tua REST API Key)
   - **Environment**: Seleziona tutte (Production, Preview, Development)
4. Clicca **Save**

### 2. Verifica che il Service Worker sia accessibile

Dopo il deploy, verifica che il service worker sia accessibile:
- `https://dc30.vercel.app/OneSignalSDKWorker.js`

Dovrebbe restituire il contenuto del service worker (non un 404).

## 🎯 Come Funziona

### Iscrizione Utente

Quando un utente clicca "Abilita" nelle impostazioni:
1. OneSignal SDK richiede il permesso notifiche
2. Se concesso, l'utente viene iscritto
3. I tag `user_id` e `squadra_id` vengono salvati in OneSignal
4. L'utente riceverà notifiche push

### Invio Notifiche

Quando l'admin invia una notifica:
1. Il frontend chiama `/api/onesignal/send`
2. L'endpoint API usa la REST API Key per chiamare OneSignal API
3. OneSignal invia la notifica a tutti gli utenti iscritti (o filtrati per tag)

### Tag per Segmentazione

- **`user_id`**: Tag con l'ID utente (per inviare a un utente specifico)
- **`squadra_id`**: Tag con l'ID squadra (per inviare a una squadra)

## 🔍 Verifica

### Test Locale

1. Avvia il dev server: `pnpm dev`
2. Apri l'app in un browser che supporta notifiche (Chrome, Edge)
3. Vai su Profilo → Abilita Notifiche
4. Dovresti vedere il prompt del browser per le notifiche

### Test Produzione

1. Dopo il deploy, apri l'app su `https://dc30.vercel.app`
2. Installa la PWA (se possibile)
3. Abilita le notifiche
4. Vai su Admin → Invia Notifica Push
5. Invia una notifica di test

## ⚠️ Note Importanti

- **Piano Gratuito Vercel**: Le serverless functions sono gratuite fino a 100GB-hours/mese (più che sufficiente)
- **Piano Gratuito OneSignal**: Fino a 10.000 utenti iscritti (più che sufficiente per questo progetto)
- **PWA Android/iOS**: Funziona con la piattaforma "Web" attiva (non serve configurare iOS APNs o Android FCM)

## 🐛 Troubleshooting

### Notifiche non arrivano

1. Verifica che `ONESIGNAL_REST_API_KEY` sia configurata su Vercel
2. Verifica che il service worker sia accessibile: `https://dc30.vercel.app/OneSignalSDKWorker.js`
3. Controlla la console del browser per errori
4. Verifica che l'utente abbia abilitato le notifiche nel browser

### Errore CORS

L'endpoint `/api/onesignal/send` ha già i CORS headers configurati. Se vedi errori CORS:
1. Verifica che l'endpoint sia deployato correttamente
2. Controlla i log su Vercel per errori

### Service Worker non trovato

Se vedi errori sul service worker:
1. Verifica che `OneSignalSDKWorker.js` sia in `apps/web/public/`
2. Verifica che sia accessibile dopo il deploy
3. Controlla la console del browser per errori di registrazione

## 📚 Risorse

- [OneSignal Web SDK Documentation](https://documentation.onesignal.com/docs/web-sdk-setup)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)

