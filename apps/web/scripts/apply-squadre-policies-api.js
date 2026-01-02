#!/usr/bin/env node

/**
 * Script per applicare la migration delle policy RLS per le squadre usando l'API REST di Supabase
 * Esegui: node apps/web/scripts/apply-squadre-policies-api.js
 * 
 * Requisiti nel .env.local:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_SERVICE_ROLE_KEY (service role key)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('🔧 Applicazione policy RLS per gestione squadre via API Supabase...\n');

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
    console.error('\n📝 Aggiungi nel file .env.local:');
    console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY=la-tua-service-role-key');
    console.error('\n   La trovi su: Dashboard > Settings > API > service_role key\n');
    process.exit(1);
  }
  
  console.log('✅ Credenziali lette correttamente');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...\n`);
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  process.exit(1);
}

// Leggi la migration SQL
let sqlMigration = '';
try {
  const migrationPath = join(rootDir, 'supabase', 'migrations', '00018_squadre_crud_policies.sql');
  sqlMigration = readFileSync(migrationPath, 'utf-8');
  console.log('✅ Migration SQL letta correttamente\n');
} catch (error) {
  console.error('❌ Errore lettura migration SQL:', error.message);
  process.exit(1);
}

// Applica la migration via API REST
async function applyMigration() {
  try {
    console.log('📝 Invio migration al database...\n');
    
    // Usa l'endpoint REST per eseguire SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sqlMigration }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Errore API:', errorText);
      
      // Se exec_sql non esiste, suggerisci di applicare manualmente
      if (response.status === 404) {
        console.log('\n💡 La funzione exec_sql non è disponibile.');
        console.log('   Applica la migration manualmente dalla dashboard:\n');
        console.log('   1. Vai su Supabase Dashboard > SQL Editor');
        console.log('   2. Copia il contenuto di: supabase/migrations/00018_squadre_crud_policies.sql');
        console.log('   3. Incolla e clicca Run\n');
      }
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Migration applicata con successo!\n');
    console.log('📚 Ora gli admin possono:');
    console.log('   ✅ Creare nuove squadre');
    console.log('   ✅ Modificare squadre esistenti');
    console.log('   ✅ Eliminare squadre\n');
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione della migration:', error.message);
    console.log('\n💡 Applica la migration manualmente dalla dashboard:');
    console.log('   1. Vai su Supabase Dashboard > SQL Editor');
    console.log('   2. Copia il contenuto di: supabase/migrations/00018_squadre_crud_policies.sql');
    console.log('   3. Incolla e clicca Run\n');
    process.exit(1);
  }
}

applyMigration().catch(console.error);

