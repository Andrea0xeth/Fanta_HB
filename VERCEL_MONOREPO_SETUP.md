# 🔧 Configurazione Vercel per Monorepo

## ⚠️ Problema Attuale

Vercel non trova la directory `dist` dopo il build perché:
- Il build viene eseguito in `apps/web` e crea `apps/web/dist`
- Vercel cerca `dist` nella root del progetto

## ✅ Soluzione: Configura Root Directory nelle Impostazioni Vercel

**NON tramite `vercel.json`** (non supportato), ma direttamente nelle **impostazioni del progetto**:

### Passi:

1. Vai su **Vercel Dashboard** → **Il tuo progetto** → **Settings**
2. Vai su **General** → **Root Directory**
3. Seleziona **"Set a root directory"**
4. Inserisci: `apps/web`
5. Salva

### Alternativa: Usa un Comando di Build che Copia i File

Se non puoi configurare la root directory, possiamo modificare il `buildCommand` per copiare i file nella root dopo il build:

```json
{
  "buildCommand": "pnpm --filter @30diciaccio/web build && cp -r apps/web/dist ./dist",
  "outputDirectory": "dist"
}
```

Ma la soluzione migliore è configurare la **Root Directory** nelle impostazioni di Vercel.

