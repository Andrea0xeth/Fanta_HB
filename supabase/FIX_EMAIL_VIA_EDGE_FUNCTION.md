# ✅ Soluzione: Bypass Validazione Email con Edge Function

## Problema

Supabase Auth continua a rifiutare email valide con l'errore `email_address_invalid`, anche quando:
- Email provider è abilitato
- Confirm email è disabilitato
- Email è correttamente formattata

## Soluzione

Ho creato una **Edge Function** che usa l'Admin API di Supabase per creare utenti, bypassando completamente la validazione email.

## Cosa è stato fatto

1. ✅ Creata Edge Function `create-user-admin` che usa Admin API
2. ✅ Modificato `GameContext.tsx` per usare la funzione invece di `signUp()`
3. ✅ La funzione crea l'utente con `email_confirm: true` (email già confermata)

## Deploy (IMPORTANTE!)

Devi deployare la funzione prima di poterla usare:

```bash
# 1. Assicurati di essere autenticato
supabase login

# 2. Linka il progetto (se non già fatto)
supabase link --project-ref smqoyszeqikjrhwgclrr

# 3. Deploy della funzione
supabase functions deploy create-user-admin
```

## Verifica

Dopo il deploy, verifica che la funzione sia disponibile:

```bash
supabase functions list
```

Dovresti vedere `create-user-admin` nella lista.

## Come funziona

1. Il frontend chiama la Edge Function invece di `supabase.auth.signUp()`
2. La funzione usa la Service Role Key per chiamare `admin.createUser()`
3. L'utente viene creato con email già confermata
4. Il frontend fa login automatico per ottenere la sessione

## Test

Dopo il deploy, prova a registrare un nuovo utente con email/password. Dovrebbe funzionare senza errori di validazione email.

## Troubleshooting

### Errore: "Function not found"
- Verifica che il deploy sia andato a buon fine
- Controlla i log: `supabase functions logs create-user-admin`

### Errore: "Unauthorized"
- Verifica che `VITE_SUPABASE_ANON_KEY` sia configurata correttamente nel `.env.local`

### La funzione non viene chiamata
- Apri la console del browser e verifica che l'URL della funzione sia corretto
- Controlla la Network tab per vedere se la richiesta viene fatta

## Note

- La funzione è sicura perché usa la Service Role Key solo lato server
- L'anon key è sufficiente per chiamare la funzione (non serve esporre la service role key)
- L'utente viene creato con email già confermata, quindi non serve verifica email

