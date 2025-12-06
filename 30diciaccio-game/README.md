# 🎉 30diCiaccioGame

Una Progressive Web App (PWA) per il 30° compleanno di Di Ciaccio! Un gioco a squadre con quest giornaliere, verifiche peer-to-peer e premi epici.

## ✨ Funzionalità

### 🏠 Per i Giocatori
- **Autenticazione Passkey** - Login veloce con Face ID / Impronta digitale
- **Squadre Casuali** - Assegnazione automatica a una delle 6 squadre
- **Quest Giornaliere** - 3 sfide casuali ogni giorno con prove foto/video/testo
- **Verifica Peer-to-Peer** - Valida le prove degli altri giocatori (soglia 66%)
- **Leaderboard Live** - Classifica squadre e singoli in tempo reale
- **Pagina Premi** - Visualizza i premi sbloccabili

### 👑 Per l'Admin
- **Gestione Gare** - Assegna vincitori alle sfide squadra vs squadra
- **Bonus Punti** - Premia giocatori con punti extra "stile Borgese"
- **Gestione Squadre** - Rimescola squadre se necessario

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- npm o yarn

### Installazione

```bash
# Clona il repository
git clone <repo-url>
cd 30diciaccio-game

# Installa dipendenze
npm install

# Copia il file di configurazione
cp .env.example .env

# Avvia in development
npm run dev
```

### Build per Produzione

```bash
npm run build
npm run preview
```

## 🗄️ Setup Backend (Supabase)

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Copia URL e Anon Key nel file `.env`
3. Esegui lo schema SQL dalla sezione commento in `src/lib/supabase.ts`

### Schema Database Principale

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  nickname TEXT,
  squadra_id UUID,
  punti_personali INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Squadre
CREATE TABLE squadre (
  id UUID PRIMARY KEY,
  nome TEXT,
  emoji TEXT,
  punti_squadra INTEGER DEFAULT 0
);

-- Quest e Prove
CREATE TABLE quest (id, giorno, titolo, punti, difficolta, ...);
CREATE TABLE prove_quest (id, quest_id, user_id, tipo, stato, voti...);

-- Gare
CREATE TABLE gare (id, nome, squadra_a_id, squadra_b_id, vincitore_id, punti_in_palio);
```

## 📱 Struttura PWA

```
src/
├── components/       # Componenti UI riutilizzabili
│   ├── BottomNav.tsx      # Navigazione bottom tabs
│   ├── QuestCard.tsx      # Card quest espandibile
│   ├── VerificaCard.tsx   # Card verifica peer
│   ├── GaraCard.tsx       # Card gara squadra
│   └── Countdown.tsx      # Timer countdown
├── pages/            # Pagine dell'app
│   ├── SplashPage.tsx     # Login + countdown
│   ├── HomePage.tsx       # Dashboard principale
│   ├── SquadraPage.tsx    # Dettagli squadra
│   ├── LeaderboardPage.tsx # Classifica
│   ├── PremiPage.tsx      # Lista premi
│   └── AdminPage.tsx      # Pannello admin
├── context/          # State management
│   └── GameContext.tsx    # Contesto globale gioco
├── types/            # TypeScript types
└── lib/              # Utilities e configurazioni
    └── supabase.ts        # Client Supabase + schema
```

## 🎨 Design System

### Colori
- **Coral** `#FF6B6B` - Primary (CTA, highlights)
- **Turquoise** `#4ECDC4` - Secondary (successo, punti)
- **Party Yellow** `#FFE66D` - Accent (premi, MVP)
- **Dark** `#1A1A1A` - Background

### Componenti UI
- `.card` - Card con blur e bordi
- `.btn-primary` - Bottone gradient coral
- `.btn-secondary` - Bottone gradient turquoise
- `.badge-coral/turquoise/party` - Badge colorati

## 🔧 Tecnologie

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3.4
- **Animazioni**: Framer Motion
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa
- **Backend**: Supabase (PostgreSQL + Real-time)

## 📋 Formula Punteggio

```
Punti Totali = (Punti Personali × 0.7) + (Punti Squadra × 0.3)
```

- **Quest completata**: +25-50 pts (base difficoltà)
- **Gara vinta**: +50-100 pts alla squadra
- **Bonus admin**: +10-25 pts individuali

## 🛡️ Accesso Admin

Per accedere come admin, registrati con nickname **"admin"** (case insensitive). Vedrai la tab 👑 Admin nella bottom nav.

## 📄 License

MIT - Buon 30° compleanno Di Ciaccio! 🎂

---

Made with ❤️ per il 30diCiaccioGame
