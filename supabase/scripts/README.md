# 📜 Script SQL Supabase

Questa cartella contiene tutti gli script SQL standalone da eseguire manualmente nella Supabase SQL Editor.

## 🚀 Script Principali

### **OPTIMIZE_SISTEMA_VOTAZIONE.sql** ⭐
**Script principale da eseguire per ottimizzare il sistema**

Ottimizza:
- ✅ Indici per performance (8+ indici)
- ✅ Funzione di validazione ottimizzata
- ✅ Fix assegnazione quest diverse per utente
- ✅ RLS policies complete
- ✅ Trigger automatico

**Quando eseguirlo**: Dopo aver applicato tutte le migration base.

---

### **APPLY_ALL_SYSTEMS.sql**
Applica tutti i sistemi in una volta:
- Sistema di quest personali (100 quest + assegnazione automatica)
- Sistema di gare multi-squadra con classifiche
- Template dei 20 giochi da spiaggia

**Quando eseguirlo**: Setup iniziale completo del database.

---

### **APPLY_COMPLETE_SYSTEM.sql**
Versione completa che include:
- 100 quest diverse
- Sistema di assegnazione automatica (3 quest al giorno per utente)
- Sistema di classifiche per gare multi-squadra
- Template dei 20 giochi da spiaggia

**Quando eseguirlo**: Setup iniziale completo (alternativa a APPLY_ALL_SYSTEMS.sql).

---

### **APPLY_QUEST_SYSTEM.sql**
Solo sistema di quest:
- 100 quest diverse
- Tabella user_quest_assignments
- Funzioni assign_daily_quests e get_user_quests

**Quando eseguirlo**: Se vuoi solo il sistema quest senza gare.

---

### **APPLY_GARE_SYSTEM.sql**
Solo sistema di gare:
- Tabella classifiche_gare
- Funzioni assegna_classifica_gara e get_classifica_gara

**Quando eseguirlo**: Se vuoi solo il sistema gare senza quest.

---

## 🔧 Script di Fix e Ottimizzazione

### **FIX_QUEST_DIVERSE_PER_USER.sql**
Risolve il problema per cui tutti gli utenti ricevevano le stesse quest.

**Cosa fa**: Aggiorna la funzione `assign_daily_quests()` per usare un hash deterministico basato sull'ID utente e sul giorno.

**Quando eseguirlo**: Se noti che gli utenti ricevono le stesse quest.

---

### **APPLY_AVATAR_UPDATE.sql**
Aggiorna la funzione `insert_user_with_passkey` per supportare l'upload di avatar.

**Quando eseguirlo**: Se la funzione di registrazione non supporta ancora gli avatar.

---

## 📦 Script Storage

### **SETUP_STORAGE_POLICIES.sql**
Setup base per storage policies:
- Upload avatar (anon/authenticated)
- Lettura pubblica

**Quando eseguirlo**: Setup iniziale storage.

---

### **SETUP_STORAGE_POLICIES_COMPLETE.sql** ⭐
Setup completo per storage policies:
- Upload avatar (anon/authenticated)
- Upload prove quest (authenticated)
- Lettura pubblica
- Update/Delete propri file

**Quando eseguirlo**: Setup completo storage (raccomandato).

---

## 📋 Ordine di Esecuzione Consigliato

### **Setup Iniziale Completo**
1. Esegui tutte le migration in `supabase/migrations/` (in ordine numerico)
2. `SETUP_STORAGE_POLICIES_COMPLETE.sql` - Setup storage
3. `APPLY_ALL_SYSTEMS.sql` - Applica tutti i sistemi
4. `OPTIMIZE_SISTEMA_VOTAZIONE.sql` - Ottimizza performance

### **Fix Dopo Setup**
1. `FIX_QUEST_DIVERSE_PER_USER.sql` - Se le quest sono identiche per tutti
2. `OPTIMIZE_SISTEMA_VOTAZIONE.sql` - Per migliorare performance

---

## ⚠️ Note Importanti

- Tutti gli script sono **idempotenti** (possono essere eseguiti più volte)
- Gli script usano `CREATE OR REPLACE` e `IF NOT EXISTS` per evitare errori
- Verifica sempre i messaggi di successo nella console Supabase
- Dopo ogni script, verifica che le funzioni/tabelle siano state create correttamente

---

## 🔍 Verifica Dopo Esecuzione

Dopo aver eseguito uno script, verifica:

```sql
-- Verifica funzioni
SELECT proname FROM pg_proc WHERE proname LIKE '%quest%' OR proname LIKE '%gara%';

-- Verifica tabelle
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%quest%' OR tablename LIKE '%gara%';

-- Verifica indici
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

---

## 📚 Documentazione

Per maggiori dettagli, consulta:
- `../ISTRUZIONI_SUPABASE.md` - Istruzioni dettagliate
- `../ANALISI_STRUTTURA_DATABASE.md` - Analisi struttura database
- `../VERIFICA_SISTEMA_VOTO.md` - Verifica sistema votazione

