# 📞 Contatta Support Supabase

## Problema
Errore `email_address_invalid` per email valide come `test@test.com` e `test@gmail.com`.

## Informazioni per il Ticket

### Titolo
```
Email address invalid error on signup - email_address_invalid
```

### Descrizione
```
Ciao,

Sto riscontrando un problema con la registrazione utenti tramite email/password nel progetto Supabase.

**Errore:**
- Codice: `email_address_invalid`
- Messaggio: "Email address "test@test.com" is invalid"
- Status: 400 Bad Request

**Email testate (tutte rifiutate):**
- test@test.com
- test@gmail.com
- user@example.com

**Configurazione Dashboard:**
- Email provider: ENABLED (ON)
- Confirm email: DISABLED (OFF)
- Secure email change: DISABLED (OFF)
- Enable sign ups: ON
- Site URL: https://localhost:5173
- Redirect URLs: https://localhost:5173/**

**Progetto:**
- Project ID: smqoyszeqikjrhwgclrr
- URL: https://smqoyszeqikjrhwgclrr.supabase.co

**Cosa ho provato:**
1. ✅ Verificato che Email provider sia ON
2. ✅ Verificato che Confirm email sia OFF
3. ✅ Reset completo Email provider (disabilitato e riabilitato)
4. ✅ Verificato che non ci siano restrizioni su domini email
5. ✅ Verificato che Enable sign ups sia ON
6. ✅ Provato con diverse email (test@test.com, test@gmail.com, user@example.com)
7. ✅ Verificato che non ci siano trigger o hook che validano email

**Risultato:**
Tutte le email valide vengono rifiutate con lo stesso errore `email_address_invalid`.

Potreste aiutarmi a capire perché Supabase sta rifiutando email valide?

Grazie!
```

### Screenshot da Includere

1. **Authentication → Providers → Email**:
   - Mostra che Email provider è ON
   - Mostra che Confirm email è OFF

2. **Authentication → Settings**:
   - Mostra che Enable sign ups è ON
   - Mostra Site URL e Redirect URLs

3. **Logs → API Logs**:
   - Screenshot della richiesta `/auth/v1/signup` fallita
   - Mostra il body della richiesta e la risposta

## Link Utili

- **Support Supabase**: https://supabase.com/support
- **Documentazione Auth**: https://supabase.com/docs/guides/auth
- **Status Supabase**: https://status.supabase.com

## Nel Frattempo

L'app funziona già con **WebAuthn/Passkey**. Gli utenti possono registrarsi usando Face ID/Touch ID senza problemi.

