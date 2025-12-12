# 🔐 Come Configurare i Secrets VAPID nell'Edge Function

## Problema
Non vedi la sezione "Secrets" nel dashboard Supabase per configurare le chiavi VAPID.

## ✅ Soluzione: Via CLI (Consigliato)

### 1. Assicurati di essere loggato e linkato

```bash
# Login (se non l'hai già fatto)
npx supabase login

# Link al progetto
npx supabase link --project-ref smqoyszeqikjrhwgclrr
```

### 2. Imposta i Secrets

```bash
# Imposta VAPID_PUBLIC_KEY
npx supabase secrets set VAPID_PUBLIC_KEY="la-tua-public-key-qui"

# Imposta VAPID_PRIVATE_KEY
npx supabase secrets set VAPID_PRIVATE_KEY="la-tua-private-key-qui"
```

**Nota**: Sostituisci `"la-tua-public-key-qui"` e `"la-tua-private-key-qui"` con le chiavi reali generate.

### 3. Verifica i Secrets

```bash
# Lista tutti i secrets (non mostra i valori per sicurezza)
npx supabase secrets list
```

Dovresti vedere:
```
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
```

## 📝 Genera le Chiavi (se non le hai)

```bash
# Installa web-push
npm install -g web-push

# Genera le chiavi
web-push generate-vapid-keys
```

Copia:
- **Public Key** → Usala per `VAPID_PUBLIC_KEY` (CLI) e `VITE_VAPID_PUBLIC_KEY` (`.env`)
- **Private Key** → Usala SOLO per `VAPID_PRIVATE_KEY` (CLI), MAI nel frontend!

## 🎯 Riepilogo

1. **Nel file `.env` del frontend** (`apps/web/.env` o `.env.local`):
   ```env
   VITE_VAPID_PUBLIC_KEY=la-tua-public-key
   ```

2. **Nell'Edge Function (via CLI)**:
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY="la-tua-public-key"
   npx supabase secrets set VAPID_PRIVATE_KEY="la-tua-private-key"
   ```

## ⚠️ Importante

- **Public Key**: Va sia nel frontend che nell'Edge Function
- **Private Key**: SOLO nell'Edge Function, MAI nel frontend o nel repository!

## 🔍 Verifica che Funzioni

Dopo aver configurato i secrets, testa la funzione:

```bash
# Test della funzione (dovrebbe restituire errore se le chiavi non sono configurate)
curl -X POST https://smqoyszeqikjrhwgclrr.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "payload": {"title": "Test"}}'
```

Se vedi "VAPID keys not configured", i secrets non sono stati impostati correttamente.

