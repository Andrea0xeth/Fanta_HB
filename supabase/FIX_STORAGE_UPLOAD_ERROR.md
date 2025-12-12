# 🔧 Fix: Errore Upload File - "new row violates row-level security policy"

## Problema
Quando si tenta di caricare una foto o un video per una quest, si verifica l'errore:
```
StorageApiError: new row violates row-level security policy
```

## Causa
Le policy RLS (Row Level Security) per il bucket `prove-quest` non sono configurate correttamente per permettere agli utenti autenticati di caricare file.

## Soluzione

### Opzione 1: Eseguire lo script SQL (Consigliato)

1. Vai alla dashboard Supabase del tuo progetto
2. Apri il SQL Editor: https://supabase.com/dashboard/project/[PROJECT-REF]/sql/new
3. Copia e incolla il contenuto del file `FIX_STORAGE_POLICIES.sql`
4. Clicca "Run" per eseguire lo script

Lo script creerà le policy necessarie per:
- ✅ Permettere agli utenti autenticati di caricare prove (foto/video)
- ✅ Permettere la lettura pubblica dei file

### Opzione 2: Configurare manualmente dalla Dashboard

1. Vai su: **Storage** > **Policies** nel dashboard Supabase
2. Seleziona il bucket `prove-quest`
3. Clicca **New Policy**
4. Configura la policy per l'upload:
   - **Policy name**: `Permetti upload prove`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     bucket_id = 'prove-quest' AND
     (storage.foldername(name))[1] != 'avatars'
     ```
5. Clicca **Save**

### Verifica

Dopo aver applicato le policy, prova a caricare nuovamente una foto o un video. L'upload dovrebbe funzionare correttamente.

## File correlati

- `supabase/FIX_STORAGE_POLICIES.sql` - Script SQL per risolvere il problema
- `supabase/scripts/SETUP_STORAGE_POLICIES_COMPLETE.sql` - Script completo per tutte le policy

