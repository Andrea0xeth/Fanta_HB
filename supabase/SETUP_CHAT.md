# Setup Chat Squadra - Guida Supabase

Questa guida ti spiega come configurare la chat di squadra su Supabase.

## 📋 Passaggi da seguire

### 1. Esegui la migrazione principale

Esegui il file SQL `supabase/migrations/00022_squadra_chat.sql` nel SQL Editor di Supabase:

1. Vai su **Supabase Dashboard** → Il tuo progetto → **SQL Editor**
2. Clicca su **New Query**
3. Copia e incolla il contenuto di `supabase/migrations/00022_squadra_chat.sql`
4. Clicca su **Run** (o premi `Cmd/Ctrl + Enter`)

Questo creerà:
- ✅ Tabella `messaggi_chat`
- ✅ Indici per le performance
- ✅ Policy RLS (Row Level Security)
- ✅ Trigger per aggiornare `updated_at`

### 2. Se la tabella esiste già (aggiornamento)

Se hai già eseguito la migrazione ma senza supporto foto, esegui anche:

`supabase/UPDATE_CHAT_WITH_PHOTOS.sql`

Questo aggiungerà:
- ✅ Colonna `foto_url`
- ✅ Modifica `messaggio` per essere nullable
- ✅ Constraint per garantire che ci sia almeno testo o foto

### 3. Verifica le Storage Policies

Le foto della chat vengono caricate nel bucket `prove-quest` nella cartella `chat/{squadraId}/{userId}/`.

Verifica che le policy storage permettano l'upload in questa cartella. Se hai già configurato le policy per le prove quest, dovrebbero funzionare anche per la chat.

**Se non funziona l'upload foto**, esegui questo SQL per aggiungere una policy specifica:

```sql
-- Policy per upload foto chat
CREATE POLICY "Permetti upload foto chat"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'prove-quest' AND
  name LIKE 'chat/%'
);
```

### 4. Abilita Realtime (se non già attivo)

La chat usa Supabase Realtime per aggiornamenti in tempo reale. Verifica che sia abilitato:

1. Vai su **Database** → **Replication**
2. Cerca la tabella `messaggi_chat`
3. Assicurati che sia abilitata la replica (toggle ON)

Oppure esegui questo SQL:

```sql
-- Abilita Realtime per messaggi_chat
ALTER PUBLICATION supabase_realtime ADD TABLE messaggi_chat;
```

### 5. Verifica finale

Dopo aver eseguito i passaggi, verifica che tutto funzioni:

1. **Tabella creata**: Vai su **Table Editor** → dovresti vedere `messaggi_chat`
2. **RLS attivo**: Vai su **Authentication** → **Policies** → verifica le policy per `messaggi_chat`
3. **Realtime attivo**: Vai su **Database** → **Replication** → verifica che `messaggi_chat` sia nella lista

## 🔍 Troubleshooting

### Errore: "permission denied" o "row-level security policy"
- Verifica che le RLS policies siano state create correttamente
- Controlla che `ALTER TABLE messaggi_chat ENABLE ROW LEVEL SECURITY;` sia stato eseguito

### Le foto non si caricano
- Verifica che il bucket `prove-quest` esista
- Controlla le storage policies per la cartella `chat/`
- Verifica che il bucket sia pubblico o che ci siano policy per la lettura

### I messaggi non arrivano in tempo reale
- Verifica che Realtime sia abilitato per `messaggi_chat`
- Controlla la console del browser per errori di connessione WebSocket

## 📝 Note importanti

- Le policy RLS sono **permissive** (usano `USING (true)`) perché l'app usa WebAuthn invece di Supabase Auth
- La verifica dei permessi viene fatta a livello applicativo
- Le foto vengono caricate nel bucket esistente `prove-quest` (stesso delle prove quest)

## ✅ Checklist finale

- [ ] Migrazione `00022_squadra_chat.sql` eseguita
- [ ] (Se necessario) `UPDATE_CHAT_WITH_PHOTOS.sql` eseguito
- [ ] Storage policies configurate per `chat/`
- [ ] Realtime abilitato per `messaggi_chat`
- [ ] Tabella visibile nel Table Editor
- [ ] Test invio messaggio
- [ ] Test upload foto
- [ ] Test cancellazione messaggio
