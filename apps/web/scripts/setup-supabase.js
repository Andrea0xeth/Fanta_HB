#!/usr/bin/env node

/**
 * Script per automatizzare il setup di Supabase
 * Esegui: node scripts/setup-supabase.js
 * 
 * Requisiti:
 * - VITE_SUPABASE_URL nel .env.local
 * - VITE_SUPABASE_SERVICE_ROLE_KEY nel .env.local (chiave service_role, non anon!)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('🚀 Setup automatico Supabase per 30diCiaccioGame\n');

// Leggi variabili d'ambiente
let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envPath = join(rootDir, 'apps', 'web', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) serviceRoleKey = keyMatch[1].trim();
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL non trovato in .env.local');
    process.exit(1);
  }
  
  if (!serviceRoleKey) {
    console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY non trovato in .env.local');
    console.error('   Aggiungi la chiave service_role da Supabase Dashboard > Settings > API');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  process.exit(1);
}

// Leggi lo schema SQL
let sqlSchema = '';
try {
  const schemaPath = join(rootDir, 'supabase', 'migrations', '00001_initial_schema.sql');
  sqlSchema = readFileSync(schemaPath, 'utf-8');
  console.log('✅ Schema SQL letto correttamente');
} catch (error) {
  console.error('❌ Errore lettura schema SQL:', error.message);
  process.exit(1);
}

// Funzione per eseguire query SQL via API
async function executeSQL(query) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL Error: ${error}`);
  }
  
  return response.json();
}

// Funzione per creare bucket storage
async function createStorageBucket(bucketName, isPublic = true) {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      name: bucketName,
      public: isPublic,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: ['image/*', 'video/*'],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    // Se il bucket esiste già, non è un errore
    if (response.status === 409) {
      console.log(`   ℹ️  Bucket "${bucketName}" esiste già`);
      return true;
    }
    throw new Error(`Storage Error: ${error}`);
  }
  
  return response.json();
}

// Esegui setup
async function setup() {
  try {
    console.log('\n📊 Step 1: Applicazione schema database...');
    
    // Nota: L'API REST di Supabase non supporta direttamente l'esecuzione di SQL arbitrario
    // Dobbiamo usare l'API PostgREST o il metodo migrazione
    // Per ora, mostriamo le istruzioni manuali
    
    console.log('⚠️  L\'esecuzione automatica di SQL richiede Supabase CLI o accesso diretto al database.');
    console.log('   Esegui manualmente lo schema SQL dalla dashboard:\n');
    console.log('   1. Vai su https://app.supabase.com');
    console.log('   2. Seleziona il tuo progetto');
    console.log('   3. Vai su SQL Editor > New query');
    console.log('   4. Copia il contenuto di: supabase/migrations/00001_initial_schema.sql');
    console.log('   5. Incolla ed esegui\n');
    
    console.log('📦 Step 2: Creazione bucket storage...');
    try {
      await createStorageBucket('prove-quest', true);
      console.log('✅ Bucket "prove-quest" creato con successo!');
    } catch (error) {
      console.error('❌ Errore creazione bucket:', error.message);
      console.log('\n   Crea manualmente dalla dashboard:');
      console.log('   1. Vai su Storage > New bucket');
      console.log('   2. Nome: prove-quest');
      console.log('   3. Public: ON');
      console.log('   4. File size limit: 50MB');
      console.log('   5. MIME types: image/*, video/*\n');
    }
    
    console.log('\n✅ Setup completato!');
    console.log('\n📝 Prossimi passi:');
    console.log('   1. Applica lo schema SQL manualmente (vedi sopra)');
    console.log('   2. Verifica che il bucket sia stato creato');
    console.log('   3. Riavvia il dev server: pnpm dev\n');
    
  } catch (error) {
    console.error('\n❌ Errore durante il setup:', error.message);
    process.exit(1);
  }
}

setup();



