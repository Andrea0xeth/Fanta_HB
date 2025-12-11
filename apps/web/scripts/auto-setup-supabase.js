#!/usr/bin/env node

/**
 * Script completo per automatizzare il setup di Supabase
 * Esegui: node scripts/auto-setup-supabase.js
 * 
 * Requisiti nel .env.local:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_SERVICE_ROLE_KEY (chiave service_role, non anon!)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('🚀 Setup automatico completo Supabase per 30diCiaccioGame\n');

// Leggi variabili d'ambiente
let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envPath = join(rootDir, 'apps', 'web', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  // Prova vari nomi per la service role key
  let keyMatch = envContent.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (!keyMatch) {
    keyMatch = envContent.match(/SERVICE_ROLE_KEY=(.+)/);
  }
  if (!keyMatch) {
    keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  }
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) serviceRoleKey = keyMatch[1].trim();
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL non trovato in .env.local');
    process.exit(1);
  }
  
  if (!serviceRoleKey) {
    console.error('❌ Service Role Key non trovata in .env.local');
    console.error('\n📝 Aggiungi nel file .env.local:');
    console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY=la-tua-service-role-key');
    console.error('\n   La trovi su: Dashboard > Settings > API > service_role key');
    console.error('   (È diversa dall\'anon key!)\n');
    process.exit(1);
  }
  
  console.log('✅ Credenziali lette correttamente');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Key: ${serviceRoleKey.substring(0, 20)}...\n`);
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  process.exit(1);
}

// Leggi lo schema SQL
let sqlSchema = '';
try {
  const schemaPath = join(rootDir, 'supabase', 'migrations', '00001_initial_schema.sql');
  sqlSchema = readFileSync(schemaPath, 'utf-8');
  console.log('✅ Schema SQL letto correttamente\n');
} catch (error) {
  console.error('❌ Errore lettura schema SQL:', error.message);
  process.exit(1);
}

// Funzione per eseguire SQL usando l'API Management
// Nota: Supabase non espone direttamente un endpoint REST per SQL arbitrario
// Useremo l'approccio di eseguire le query DDL via API Management
async function executeSQLViaRPC(query) {
  // Dividi lo schema in singole query (semplificato)
  // In realtà, per DDL complessi serve l'accesso diretto al database
  console.log('⚠️  Esecuzione SQL via API REST non supportata per DDL complessi');
  console.log('   Useremo l\'approccio alternativo...\n');
  return false;
}

// Funzione per creare bucket storage
async function createStorageBucket(bucketName, isPublic = true) {
  try {
    console.log(`📦 Creazione bucket "${bucketName}"...`);
    
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
    
    if (response.status === 409) {
      console.log(`✅ Bucket "${bucketName}" esiste già`);
      return true;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Bucket "${bucketName}" creato con successo!`);
    console.log('   Configurazione:');
    console.log('   - Pubblico: Sì');
    console.log('   - Limite file: 50MB');
    console.log('   - MIME types: image/*, video/*\n');
    return true;
  } catch (error) {
    console.error(`❌ Errore creazione bucket: ${error.message}\n`);
    return false;
  }
}

// Funzione per verificare se le tabelle esistono
async function checkTablesExist() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/squadre?select=id&limit=1`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    
    if (response.status === 200) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Funzione principale
async function setup() {
  console.log('🔍 Verifica stato attuale...\n');
  
  // Verifica se le tabelle esistono già
  const tablesExist = await checkTablesExist();
  
  if (tablesExist) {
    console.log('✅ Tabelle database già esistenti\n');
  } else {
    console.log('⚠️  Schema database non ancora applicato');
    console.log('\n📋 Per applicare lo schema SQL:');
    console.log('   1. Vai su https://app.supabase.com');
    console.log('   2. Seleziona il tuo progetto');
    console.log('   3. Vai su SQL Editor > New query');
    console.log('   4. Esegui: pnpm show:sql per vedere lo schema');
    console.log('   5. Oppure copia da: supabase/migrations/00001_initial_schema.sql');
    console.log('   6. Incolla ed esegui nella dashboard\n');
  }
  
  // Crea il bucket
  const bucketCreated = await createStorageBucket('prove-quest', true);
  
  // Riepilogo
  console.log('='.repeat(60));
  console.log('📊 Riepilogo Setup\n');
  
  if (tablesExist) {
    console.log('✅ Schema database: Applicato');
  } else {
    console.log('⚠️  Schema database: Da applicare manualmente');
  }
  
  if (bucketCreated) {
    console.log('✅ Bucket storage: Creato');
  } else {
    console.log('⚠️  Bucket storage: Da creare manualmente');
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (!tablesExist || !bucketCreated) {
    console.log('\n💡 Per completare il setup manualmente:');
    console.log('   - Schema SQL: pnpm show:sql');
    console.log('   - Guida completa: vedi SETUP_SUPABASE.md\n');
  } else {
    console.log('\n🎉 Setup completato! Riavvia il dev server: pnpm dev\n');
  }
}

setup().catch(error => {
  console.error('\n❌ Errore durante il setup:', error.message);
  process.exit(1);
});


