# Verifica Sistema Voto Quest

## ✅ Analisi Completa

### 1. **Database Schema** ✅
- ✅ Tabella `prove_quest` esiste con tutti i campi necessari
- ✅ Tabella `voti` esiste con constraint UNIQUE(prova_id, user_id)
- ✅ Trigger `trigger_check_validation` aggiorna automaticamente i voti

### 2. **RLS Policies** ✅
Le policy esistenti in `00001_initial_schema.sql`:
- ✅ `CREATE POLICY "Lettura pubblica prove" ON prove_quest FOR SELECT USING (true);`
- ✅ `CREATE POLICY "Insert prove anon" ON prove_quest FOR INSERT WITH CHECK (true);`
- ✅ `CREATE POLICY "Update prove" ON prove_quest FOR UPDATE USING (true);`
- ✅ `CREATE POLICY "Lettura pubblica voti" ON voti FOR SELECT USING (true);`
- ✅ `CREATE POLICY "Insert voti anon" ON voti FOR INSERT WITH CHECK (true);`

**Tutto OK!** Le policy permettono:
- Lettura di tutte le prove e voti
- Inserimento di prove e voti
- Aggiornamento delle prove (per il trigger)

### 3. **Storage Policies** ⚠️ DA AGGIORNARE
Le policy storage attuali (`SETUP_STORAGE_POLICIES.sql`) permettono solo:
- ✅ Upload avatar
- ✅ Lettura pubblica

**MANCA**: Policy per upload prove (foto/video)

**SOLUZIONE**: Eseguire `SETUP_STORAGE_POLICIES_COMPLETE.sql` che aggiunge:
- Policy per upload prove in `{userId}/{questId}/`
- Policy per update/delete propri file

### 4. **Trigger Automatico** ✅
Il trigger `trigger_check_validation`:
- ✅ Si attiva dopo ogni INSERT in `voti`
- ✅ Aggiorna `voti_totali` e `voti_positivi` in `prove_quest`
- ✅ Valida automaticamente se >= 66% voti positivi e >= 3 voti
- ✅ Assegna punti all'utente quando validata
- ✅ Crea notifica quando validata

### 5. **Frontend** ✅
- ✅ `QuestCard`: Carica file e invia prove
- ✅ `VerificaCard`: Mostra prove reali (immagini/video) e permette voto
- ✅ `GameContext.votaProva`: Gestisce il voto e ricarica i dati
- ✅ `GameContext.submitProva`: Carica file e salva prova

## 📋 Cosa Fare

### **SUPABASE - Esegui questo SQL:**

```sql
-- File: SETUP_STORAGE_POLICIES_COMPLETE.sql
-- Questo aggiunge le policy per upload prove
```

Questo script aggiunge:
1. Policy per upload prove (foto/video) da utenti autenticati
2. Policy per update/delete propri file

### **VERIFICA TRIGGER:**

Il trigger dovrebbe già esistere. Verifica con:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_check_validation';
```

Se non esiste, esegui:

```sql
-- Trigger per validazione automatica
CREATE TRIGGER trigger_check_validation
AFTER INSERT ON voti
FOR EACH ROW
EXECUTE FUNCTION check_proof_validation();
```

## ✅ Conclusione

**Tutto il sistema è già implementato!** 

Solo necessario:
1. ✅ Eseguire `SETUP_STORAGE_POLICIES_COMPLETE.sql` per abilitare upload prove
2. ✅ Verificare che il trigger esista (dovrebbe già esserci)

Il flusso completo funziona:
1. Utente carica prova → `submitProva()` → Upload file → Salva in DB
2. Altri utenti vedono prove → `VerificaCard` mostra immagini/video reali
3. Utenti votano → `votaProva()` → Inserisce voto → Trigger aggiorna automaticamente
4. Se >= 66% → Trigger valida → Assegna punti → Crea notifica


