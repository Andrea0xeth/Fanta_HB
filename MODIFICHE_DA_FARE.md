# 📝 Lista Modifiche da Implementare

Basato sulle note scritte a mano, ecco le modifiche da implementare nel sistema.

## ✅ COMPLETATE

### **Gestione CRUD Squadre (Admin)**
- [x] **Creare nuove squadre** - Implementato in `AdminPage.tsx` con modal
- [x] **Modificare nomi/emoji/colore squadre** - Implementato con modifica inline
- [x] **Eliminare squadre** - Implementato con validazione (squadra vuota e nessuna gara associata)
- [x] **Policy RLS Supabase** - Migration `00018_squadre_crud_policies.sql` applicata
  - Policy INSERT per creare squadre
  - Policy DELETE per eliminare squadre
  - Policy UPDATE già esistente

## 🎯 DA DECIDERE / IMPLEMENTARE

### 1. **Sistema Squadre**
- [ ] **Limitare a 9 giocatori per squadra** (attualmente non c'è limite)
  - Aggiungere constraint nel database: `CHECK (COUNT(*) <= 9)` nella tabella `users` per `squadra_id`
  - Aggiungere validazione nell'UI quando si assegna un utente a una squadra
  - Mostrare contatore "X/9 giocatori" nella pagina squadra

- [ ] **Sistema LOTO** (lotteria per assegnazione squadre o premi?)
  - Creare tabella `loto` o `lotteria` per tracciare estrazioni
  - Implementare funzione di estrazione casuale
  - UI per admin per gestire lotterie
  - UI per utenti per vedere risultati lotteria

- [ ] **Admin panel migliorato per gestire squadre** (già esiste tab "Squadre" in `AdminPage.tsx`)
  - Aggiungere vista dettagliata per ogni squadra con:
    - Lista completa membri (con contatore X/9)
    - Statistiche squadra (punti, gare vinte, quest completate)
    - Storico attività
  - Sistema per permettere alle squadre di decidere il proprio percorso/strategia
    - Aggiungere campo `percorso_scelto` o tabella `squadra_percorsi`
    - UI per squadre per selezionare percorso
    - Dashboard admin per monitorare scelte delle squadre

### 2. **Sfide Squadra (Team Challenges)**
Aggiungere le seguenti sfide squadra al sistema `giochi_template`:

**Già presenti:**
- ✅ **Rubabandiera** (già presente come "Rubabandiera")
- ✅ **Tiro alla Fune** (già presente come "Tiro alla Fune")

**Da aggiungere:**
- [ ] **SFIDA DI CANTO** (Rappresentanti) - Canto con rappresentanti per squadra
  - `min_squadre: 2, max_squadre: 4, punti_base: 60`
- [ ] **SFIDA DI TUFFI** (2x Squadre) - Gara di tuffi tra 2 squadre
  - `min_squadre: 2, max_squadre: 2, punti_base: 70`
- [ ] **CORSA CON CARRIOLA** (Tutti vs Tutti) - Wheelbarrow race, tutti contro tutti
  - `min_squadre: 2, max_squadre: 4, punti_base: 50`
- [ ] **PIADINE IN FACCIA** (sq. vs sq.) - Sfida con piadine in faccia
  - `min_squadre: 2, max_squadre: 4, punti_base: 60`
- [ ] **1,2,3 STELLA** (Tutti vs tutti) - Red Light Green Light, tutti contro tutti
  - `min_squadre: 2, max_squadre: 4, punti_base: 50`
- [ ] **CAMPO MINATO** (bendare persone & le guide) - Minefield con bendati e guide
  - `min_squadre: 2, max_squadre: 4, punti_base: 70`
- [ ] **CORSA CON SACCHI** (Tutti vs Tutti) - Sack race, tutti contro tutti
  - `min_squadre: 2, max_squadre: 4, punti_base: 50`
- [ ] **DODGE BALL** (squadre vs squadre) - Dodgeball tra squadre
  - Nota: Esiste già "Palla Prigioniera" ma Dodgeball è leggermente diverso
  - `min_squadre: 2, max_squadre: 4, punti_base: 60`

### 3. **Sfide Personali "HARD"**
Aggiungere queste sfide personali difficili al pool di quest:

- [ ] **GAVETONE NOTTURNO** - Water balloon fight notturno
- [ ] **TAGLIA CAPELLI QUALCUNO** - Tagliare i capelli a qualcuno
- [ ] **PISCIA SU UN AUTO** - Pee on a car (sfida estrema)
- [ ] **CREA UNA MAOTON** - Creare una mascot/motivo (interpretare)
- [ ] **SALTO DELLA QUAGLIA** - Quail jump (specifico gioco/sfida)
- [ ] **BOTTONE DI K & GUIDARE A CASA PRIMA CHE SALGA IL K-HOLE** - Sfida specifica (da valutare se implementare)
- [ ] **TUTTO A FARE** - Complete everything challenge
- [ ] **TUFFO CAPRIOLA IN PISCINA** - Somersault dive in pool
- [ ] **CHIAVATA ACCERTATA** - Confirmed "chiavata" (da interpretare/valutare)
- [ ] **WRISTEL CON CORDA** - Wrist wrestling with rope (braccio di ferro con corda)
- [ ] **FARE LA VERTICALE** - Do a handstand

### 4. **Sistema Premi**
Implementare sistema premi con coppe (attualmente esiste solo mock in `PremiPage.tsx`):

**Database:**
- [ ] Creare tabella `premi` nel database con:
  - `id`, `titolo`, `descrizione`, `immagine` (emoji o URL)
  - `tipo` ('squadra', 'singolo', 'giornaliero', 'speciale', 'coppa_vincitori', 'coppa_outfit', 'coppa_autente', 'coppa_gadget')
  - `punti_richiesti`, `giorno` (opzionale, per premi giornalieri)
  - `assegnato_a` (user_id o squadra_id, nullable)
  - `created_at`, `assegnato_at`

**Coppe da aggiungere:**
- [ ] **Coppe Vincitori** - Premi per squadre vincitrici (tipo: 'coppa_vincitori')
- [ ] **Coppe Miglior Outfit** - Premi per miglior outfit (tipo: 'coppa_outfit')
- [ ] **Coppe Miglior Autente** - Premi per miglior partecipante/audience (tipo: 'coppa_autente')
- [ ] **Coppe Miglior Gadget** - Premi per miglior gadget/accessorio (tipo: 'coppa_gadget')

**UI:**
- [ ] Collegare `PremiPage.tsx` al database invece di usare mock
- [ ] Aggiungere sezione "Coppe" nella pagina premi
- [ ] Sistema di assegnazione coppe da parte dell'admin

### 5. **Miglioramenti Generali**
- [ ] **Migliorare le sfide esistenti** (ottimizzazione e miglioramento UX)
- [ ] **Sistema per tracciare percorso squadre** - Permettere alle squadre di vedere e decidere il proprio percorso
- [ ] **Dashboard admin per monitorare squadre** - Vista dettagliata per ogni squadra

## 📋 Priorità di Implementazione

### Priorità ALTA
1. Limitare a 9 giocatori per squadra
2. Aggiungere le sfide squadra mancanti
3. Sistema premi base

### Priorità MEDIA
4. Aggiungere sfide personali "HARD"
5. Sistema LOTO
6. Dashboard admin migliorata per squadre

### Priorità BASSA
7. Sistema percorso squadre
8. Miglioramenti UX sfide esistenti

## 🔍 Note Tecniche

### Database
- **Sfide squadra**: Aggiungere alla tabella `giochi_template` (migration: `00013_create_20_giochi_spiaggia.sql`)
- **Sfide personali**: Aggiungere alla tabella `quest` con `difficolta = 'epica'` o creare nuova categoria "hard"
- **Sistema premi**: Creare nuova tabella `premi` con migration SQL
- **Limite 9 giocatori**: Aggiungere constraint/trigger nel database + validazione UI
- **Sistema LOTO**: Creare nuova tabella `lotteria` o `loto` con migration SQL
- **Percorso squadre**: Aggiungere campo `percorso_scelto` a `squadre` o nuova tabella `squadra_percorsi`

### Frontend
- **AdminPage.tsx**: Migliorare tab "Squadre" con vista dettagliata
- **PremiPage.tsx**: Collegare al database invece di mock
- **SquadraPage.tsx**: Aggiungere contatore "X/9 giocatori" e sistema selezione percorso
- **GameContext.tsx**: Aggiungere funzioni per:
  - Verificare limite 9 giocatori
  - Gestire lotteria
  - Gestire percorso squadre
  - Gestire premi/coppe

### File da modificare/creare
1. **Migration SQL**: Nuova migration per sfide squadra, premi, lotteria, percorso squadre
2. **apps/web/src/pages/AdminPage.tsx**: Migliorare gestione squadre
3. **apps/web/src/pages/PremiPage.tsx**: Collegare al database
4. **apps/web/src/pages/SquadraPage.tsx**: Aggiungere contatore e percorso
5. **apps/web/src/context/GameContext.tsx**: Aggiungere nuove funzioni
6. **apps/web/src/types/index.ts**: Aggiungere tipi per premi, lotteria, percorso

