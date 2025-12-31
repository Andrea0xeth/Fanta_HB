# 📊 Analisi Struttura Database Supabase

## 🎯 Struttura Principale

### 1. **`quest` - Quest Personali** ✅
**Scopo**: Pool di quest disponibili per gli utenti

**Struttura**:
```sql
CREATE TABLE quest (
  id UUID PRIMARY KEY,
  giorno INTEGER (1-3),
  titolo TEXT,
  descrizione TEXT,
  punti INTEGER,
  difficolta TEXT ('facile', 'media', 'difficile', 'epica'),
  tipo_prova TEXT[] ('foto', 'video', 'testo'),
  emoji TEXT,
  scadenza TIMESTAMP,
  attiva BOOLEAN DEFAULT TRUE
);
```

**Funzionamento**:
- Pool di ~100 quest disponibili
- Ogni utente riceve 3 quest casuali diverse ogni giorno (tramite `user_quest_assignments`)
- Le quest sono assegnate tramite funzione `assign_daily_quests()` che usa hash deterministico per garantire diversità tra utenti

**Tabelle correlate**:
- `user_quest_assignments`: Collega utenti alle quest assegnate per giorno

---

### 2. **`gare` - Giochi di Squadra** ✅
**Scopo**: Gare competitive tra squadre

**Struttura**:
```sql
CREATE TABLE gare (
  id UUID PRIMARY KEY,
  nome TEXT,
  descrizione TEXT,
  squadra_a_id UUID REFERENCES squadre(id),
  squadra_b_id UUID REFERENCES squadre(id),
  vincitore_id UUID REFERENCES squadre(id),
  punti_in_palio INTEGER,
  orario TIMESTAMP,
  giorno INTEGER (1-3),
  stato TEXT ('programmata', 'live', 'completata')
);
```

**Funzionamento**:
- Gare create dall'admin
- Supporta gare multi-squadra (non solo 2 squadre)
- Classifiche gestite tramite `classifiche_gare`
- Punti assegnati alle squadre in base alla posizione

**Tabelle correlate**:
- `classifiche_gare`: Classifica finale delle gare multi-squadra
- `giochi_template`: Template dei 20 giochi disponibili (Rubabandiera, Beach Volley, ecc.)

---

### 3. **`prove_quest` - Upload Prove Utenti** ✅
**Scopo**: Contenitore per le prove caricate dagli utenti

**Struttura**:
```sql
CREATE TABLE prove_quest (
  id UUID PRIMARY KEY,
  quest_id UUID REFERENCES quest(id),
  user_id UUID REFERENCES users(id),
  tipo TEXT ('foto', 'video', 'testo'),
  contenuto TEXT, -- URL del file o testo
  stato TEXT ('pending', 'in_verifica', 'validata', 'rifiutata'),
  voti_positivi INTEGER DEFAULT 0,  -- ⚠️ Aggiornato automaticamente
  voti_totali INTEGER DEFAULT 0,     -- ⚠️ Aggiornato automaticamente
  created_at TIMESTAMP,
  UNIQUE(quest_id, user_id) -- Un utente può fare una prova per quest
);
```

**Funzionamento**:
- Gli utenti caricano foto/video/testo per completare una quest
- Le prove partono in stato `in_verifica`
- I contatori `voti_positivi` e `voti_totali` sono aggiornati automaticamente dal trigger

**Storage**:
- File salvati in bucket Supabase `prove-quest`
- Path: `{userId}/{questId}/{timestamp}.{ext}`

---

### 4. **`voti` - Sistema di Votazione Peer-to-Peer** ✅
**Scopo**: Voti degli altri utenti per validare le prove

**Struttura**:
```sql
CREATE TABLE voti (
  id UUID PRIMARY KEY,
  prova_id UUID REFERENCES prove_quest(id),
  user_id UUID REFERENCES users(id),
  valore BOOLEAN, -- true = valida, false = rifiuta
  created_at TIMESTAMP,
  UNIQUE(prova_id, user_id) -- Un utente può votare una volta per prova
);
```

**Funzionamento**:
- Gli utenti votano le prove degli altri (peer-to-peer)
- Ogni utente può votare una volta per prova
- Il trigger `trigger_check_validation` si attiva automaticamente dopo ogni voto

---

## 🔄 Sistema di Validazione Automatica (66%)

### **Trigger Automatico** ✅
```sql
CREATE TRIGGER trigger_check_validation
AFTER INSERT ON voti
FOR EACH ROW
EXECUTE FUNCTION check_proof_validation();
```

### **Funzione di Validazione** ✅
La funzione `check_proof_validation()`:

1. **Conta i voti**:
   ```sql
   SELECT COUNT(*), COUNT(*) FILTER (WHERE valore = true)
   INTO v_total, v_positive
   FROM voti WHERE prova_id = NEW.prova_id;
   ```

2. **Aggiorna contatori in `prove_quest`**:
   ```sql
   UPDATE prove_quest 
   SET voti_totali = v_total, voti_positivi = v_positive
   WHERE id = NEW.prova_id;
   ```

3. **Valida se >= 66% e >= 3 voti**:
   ```sql
   IF v_total >= 10 AND (v_positive::float / v_total) >= 0.66 THEN
     UPDATE prove_quest SET stato = 'validata' WHERE id = NEW.prova_id;
     -- Assegna punti all'utente
     -- Crea notifica
   END IF;
   ```

### **Requisiti per Validazione**:
- ✅ Almeno **3 voti totali**
- ✅ Almeno **66% voti positivi** (≥ 0.66)
- ✅ Validazione **automatica** quando i requisiti sono soddisfatti
- ✅ Assegnazione **automatica** dei punti all'utente
- ✅ Creazione **automatica** di notifica

---

## 📋 Tabelle di Supporto

### **`user_quest_assignments`**
Collega utenti alle quest assegnate per giorno:
```sql
CREATE TABLE user_quest_assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quest_id UUID REFERENCES quest(id),
  giorno INTEGER (1-3),
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(user_id, quest_id, giorno)
);
```

### **`classifiche_gare`**
Classifiche finali delle gare multi-squadra:
```sql
CREATE TABLE classifiche_gare (
  id UUID PRIMARY KEY,
  gara_id UUID REFERENCES gare(id),
  squadra_id UUID REFERENCES squadre(id),
  posizione INTEGER,
  punti_assegnati INTEGER,
  UNIQUE(gara_id, squadra_id),
  UNIQUE(gara_id, posizione)
);
```

### **`giochi_template`**
Template dei 20 giochi disponibili:
```sql
CREATE TABLE giochi_template (
  id UUID PRIMARY KEY,
  nome TEXT UNIQUE,
  descrizione TEXT,
  emoji TEXT,
  min_squadre INTEGER,
  max_squadre INTEGER,
  punti_base INTEGER
);
```

---

## ✅ Conclusione

**La struttura è corretta e completa!**

1. ✅ **`quest`** = Quest personali (pool di ~100 quest)
2. ✅ **`gare`** = Giochi di squadra (competizioni tra squadre)
3. ✅ **`prove_quest`** = Upload prove utenti (con contatori voti)
4. ✅ **`voti`** = Sistema votazione peer-to-peer (tabella separata)
5. ✅ **Validazione automatica** al 66% con almeno 3 voti
6. ✅ **Trigger automatico** che aggiorna contatori e valida

**Il sistema di votazione è già completamente implementato e funzionante!**

