#!/usr/bin/env node

/**
 * Script per creare il bucket di storage via API
 * Esegui: node scripts/create-bucket.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('📦 Creazione bucket storage "prove-quest"...\n');

// Leggi variabili d'ambiente
let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envPath = join(rootDir, 'apps', 'web', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  // Prova prima con VITE_SUPABASE_SERVICE_ROLE_KEY, poi con pass (per retrocompatibilità)
  let keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (!keyMatch) {
    keyMatch = envContent.match(/pass=(.+)/);
  }
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) serviceRoleKey = keyMatch[1].trim();
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL non trovato in .env.local');
    process.exit(1);
  }
  
  if (!serviceRoleKey) {
    console.error('❌ Service Role Key non trovata');
    console.error('   Aggiungi VITE_SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('   La trovi su: Dashboard > Settings > API > service_role key');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  process.exit(1);
}

// Funzione per creare bucket
async function createBucket() {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        name: 'prove-quest',
        public: true,
        file_size_limit: 52428800, // 50MB in bytes
        allowed_mime_types: ['image/*', 'video/*'],
      }),
    });
    
    if (response.status === 409) {
      console.log('✅ Bucket "prove-quest" esiste già!');
      return true;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Bucket "prove-quest" creato con successo!');
    console.log('   Configurazione:');
    console.log('   - Pubblico: Sì');
    console.log('   - Limite file: 50MB');
    console.log('   - MIME types: image/*, video/*');
    return true;
  } catch (error) {
    console.error('❌ Errore creazione bucket:', error.message);
    console.log('\n💡 Crea manualmente dalla dashboard:');
    console.log('   1. Vai su https://app.supabase.com > Storage');
    console.log('   2. Clicca "New bucket"');
    console.log('   3. Nome: prove-quest');
    console.log('   4. Public: ON');
    console.log('   5. File size limit: 50MB');
    console.log('   6. MIME types: image/*, video/*\n');
    return false;
  }
}

createBucket();


