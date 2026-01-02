# 🔧 Applica Policy RLS per Gestione Squadre (CRUD)

Questo documento spiega come applicare le policy RLS necessarie per permettere agli admin di creare, modificare ed eliminare squadre.

## 📋 Cosa fa questo script

Aggiunge le policy RLS mancanti per la tabella `squadre`:
- ✅ **INSERT**: Permette di creare nuove squadre
- ✅ **DELETE**: Permette di eliminare squadre
- ✅ **UPDATE**: Già presente (non serve modificare)
- ✅ **SELECT**: Già presente (non serve modificare)

## 🚀 Come applicare

### Opzione 1: Usando la Migration (Consigliato)

Se stai usando `supabase db push` o le migration automatiche:

```bash
# La migration 00018_squadre_crud_policies.sql verrà applicata automaticamente
supabase db push
```

### Opzione 2: Manualmente su Supabase Dashboard

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** (icona `</>` nella sidebar)
4. Clicca su **New Query**
5. Copia e incolla il contenuto di `FIX_SQUADRE_RLS_POLICIES.sql`
6. Clicca su **Run** (o premi `Cmd/Ctrl + Enter`)

## ✅ Verifica

Dopo aver eseguito lo script, verifica che le policy siano state create correttamente:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'squadre'
ORDER BY policyname;
```

Dovresti vedere:
- `Lettura pubblica squadre` (SELECT)
- `Insert squadre anon` (INSERT) ✅ **NUOVO**
- `Update squadre` (UPDATE)
- `Admin può eliminare squadre` (DELETE) ✅ **NUOVO**

## 🔒 Note sulla Sicurezza

⚠️ **Attenzione**: Le policy create sono **permissive** (permettono a tutti di fare INSERT/DELETE). Questo è necessario perché:

1. Il sistema usa WebAuthn che potrebbe non funzionare correttamente con `auth.uid()`
2. La validazione che l'utente sia admin viene fatta nel codice frontend (in `GameContext.tsx`)

**Per produzione**, considera di:
- Aggiungere una funzione che verifica `is_admin` nella tabella `users`
- Modificare le policy per usare questa funzione invece di `WITH CHECK (true)`

Esempio di policy più sicura (da implementare in futuro):
```sql
CREATE POLICY "Admin può creare squadre" 
ON squadre FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);
```

## 📝 File correlati

- `supabase/migrations/00018_squadre_crud_policies.sql` - Migration automatica
- `supabase/FIX_SQUADRE_RLS_POLICIES.sql` - Script manuale
- `apps/web/src/context/GameContext.tsx` - Funzioni CRUD squadre
- `apps/web/src/pages/AdminPage.tsx` - UI per gestione squadre

