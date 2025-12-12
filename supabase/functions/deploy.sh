#!/bin/bash

# Script per deploy automatico dell'Edge Function
# Esegui: bash supabase/functions/deploy.sh
# Oppure: npm run deploy:push-function (dalla root)

set -e

echo "🚀 Deploy Edge Function: send-push-notification"
echo ""

# Usa npx per Supabase CLI (funziona anche se non installato globalmente)
SUPABASE_CMD="npx supabase"

# Verifica che Supabase CLI sia disponibile
if ! $SUPABASE_CMD --version &> /dev/null; then
  echo "❌ Supabase CLI non disponibile"
  echo "   Installa con: npm install -g supabase"
  exit 1
fi

echo "✅ Supabase CLI disponibile"
echo ""

# Verifica login (con gestione errori)
echo "🔐 Verifica login Supabase..."
LOGIN_CHECK=$($SUPABASE_CMD projects list 2>&1) || true

if echo "$LOGIN_CHECK" | grep -q "Access token not provided\|not authenticated\|login"; then
  echo "⚠️  Non sei loggato a Supabase"
  echo ""
  echo "📝 Esegui il login:"
  echo "   $SUPABASE_CMD login"
  echo ""
  echo "   Questo aprirà il browser per autenticarti."
  echo "   Dopo il login, riesegui questo script."
  echo ""
  exit 1
fi

echo "✅ Login verificato"
echo ""

# Link progetto se non già linkato
if [ ! -f ".supabase/config.toml" ] || ! grep -q "project_id" .supabase/config.toml 2>/dev/null; then
  echo "🔗 Link progetto..."
  $SUPABASE_CMD link --project-ref smqoyszeqikjrhwgclrr || {
    echo "❌ Errore durante il link del progetto"
    echo "   Verifica di essere loggato e di avere i permessi"
    exit 1
  }
  echo "✅ Progetto linkato"
  echo ""
else
  echo "✅ Progetto già linkato"
  echo ""
fi

# Deploy funzione
echo "📦 Deploy Edge Function..."
$SUPABASE_CMD functions deploy send-push-notification || {
  echo ""
  echo "❌ Errore durante il deploy"
  echo "   Verifica:"
  echo "   1. Di essere loggato: $SUPABASE_CMD login"
  echo "   2. Di avere i permessi sul progetto"
  echo "   3. Che la funzione esista in supabase/functions/send-push-notification/"
  exit 1
}

echo ""
echo "✅ Deploy completato!"
echo ""
echo "📝 Prossimi passi:"
echo "   1. Vai su https://supabase.com/dashboard/project/smqoyszeqikjrhwgclrr/functions"
echo "   2. Clicca su 'send-push-notification'"
echo "   3. Vai su 'Settings' → 'Secrets'"
echo "   4. Aggiungi:"
echo "      - VAPID_PUBLIC_KEY (genera con: web-push generate-vapid-keys)"
echo "      - VAPID_PRIVATE_KEY (genera con: web-push generate-vapid-keys)"
echo ""
echo "   5. Aggiungi anche nel frontend (.env.local):"
echo "      VITE_VAPID_PUBLIC_KEY=la-tua-public-key"
echo ""

