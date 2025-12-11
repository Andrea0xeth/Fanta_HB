# 🎉 30diCiaccioGame

Una Progressive Web App (PWA) per il 30° compleanno di Di Ciaccio! Un gioco a squadre con quest giornaliere, verifiche peer-to-peer e premi epici.

## 📦 Struttura Monorepo

```
30diCiaccioGame/
├── apps/
│   └── web/                 # Frontend React + Vite + PWA
│       ├── src/
│       │   ├── components/  # UI Components
│       │   ├── context/     # GameContext (state management)
│       │   ├── pages/       # Route pages
│       │   ├── lib/         # Supabase client
│       │   └── types/       # TypeScript types
│       └── public/          # Static assets + PWA manifest
├── packages/
│   └── shared/              # Tipi condivisi e utilities
│       └── src/
│           ├── types/       # Interfacce TS condivise
│           └── database.types.ts
├── supabase/
│   ├── config.toml          # Supabase CLI config
│   └── migrations/          # Schema SQL
├── package.json             # Root package (pnpm workspaces)
└── pnpm-workspace.yaml      # Workspace configuration
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+
- pnpm 9+

### Installazione

```bash
# Clona il repository
git clone <repo-url>
cd 30diCiaccioGame

# Installa dipendenze
pnpm install

# Avvia in development (usa mock data)
pnpm dev
```

### Build per Produzione

```bash
pnpm build
pnpm preview
```

## 🗄️ Setup Backend (Supabase)

### 1. Crea progetto Supabase
1. Vai su [supabase.com](https://supabase.com) e crea un nuovo progetto
2. Copia **Project URL** e **Anon Key** dal dashboard

### 2. Configura le variabili d'ambiente
Crea `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Applica lo schema database

**Opzione A - Da Dashboard:**
1. Vai su Supabase Dashboard > SQL Editor
2. Copia il contenuto di `supabase/migrations/00001_initial_schema.sql`
3. Esegui

**Opzione B - Con Supabase CLI:**
```bash
# Installa CLI
npm install -g supabase

# Collega al progetto
supabase link --project-ref <your-project-id>

# Applica migrazioni
pnpm db:migrate
```

### 4. Crea Storage Bucket
1. Vai su Supabase Dashboard > Storage
2. Crea bucket `prove-quest`
3. Imposta come **Public**
4. File size limit: 50MB
5. MIME types: `image/*`, `video/*`

## ✨ Funzionalità

### Per i Giocatori
- 🔐 **Autenticazione Passkey** - Login veloce con Face ID / Impronta
- 🎲 **Squadre Casuali** - Assegnazione automatica alla squadra con meno membri
- 🎯 **Quest Giornaliere** - 3 sfide casuali ogni giorno
- 📸 **Upload Prove** - Foto, video o testo
- ✅ **Verifica Peer** - Valida le prove degli altri (soglia 66%)
- 📊 **Leaderboard Live** - Classifica squadre e singoli
- 🎁 **Premi** - Visualizza i premi sbloccabili

### Per l'Admin
- 👑 **Gestione Gare** - Assegna vincitori alle sfide
- 💰 **Bonus Punti** - Premia giocatori "stile Borgese"
- 🔀 **Gestione Squadre** - Rimescola se necessario

## 📱 Formula Punteggio

```
Punti Totali = (Punti Personali × 0.7) + (Punti Squadra × 0.3)
```

- **Quest completata**: +20-60 pts (base difficoltà)
- **Gara vinta**: +50-100 pts alla squadra
- **Bonus admin**: +10-25 pts individuali

## 🎨 Design System

### Colori
| Nome | HEX | Uso |
|------|-----|-----|
| Coral | `#FF6B6B` | Primary, CTA |
| Turquoise | `#4ECDC4` | Secondary, successo |
| Party Yellow | `#FFE66D` | Accent, premi |
| Dark | `#1A1A1A` | Background |

### Componenti CSS
```css
.card           /* Card con blur e bordi */
.btn-primary    /* Bottone gradient coral */
.btn-secondary  /* Bottone gradient turquoise */
.badge-coral    /* Badge colorati */
.glass          /* Effetto vetro */
```

## 🔧 Script NPM

| Comando | Descrizione |
|---------|-------------|
| `pnpm dev` | Avvia dev server |
| `pnpm build` | Build produzione |
| `pnpm preview` | Preview build |
| `pnpm lint` | Linting |
| `pnpm db:migrate` | Push schema a Supabase |
| `pnpm db:reset` | Reset database |
| `pnpm db:types` | Genera tipi da DB |

## 🛡️ Accesso Admin

Registrati con nickname **"admin"** (case insensitive) per vedere la tab 👑 Admin.

## 📋 Tecnologie

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **Animazioni**: Framer Motion
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa
- **Backend**: Supabase (PostgreSQL + Real-time + Storage)
- **Monorepo**: pnpm workspaces

## 🤝 Contributing

1. Fork del repository
2. Crea branch feature (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Apri Pull Request

## 📄 License

MIT - Buon 30° compleanno Di Ciaccio! 🎂

---

Made with ❤️ per il 30diCiaccioGame


