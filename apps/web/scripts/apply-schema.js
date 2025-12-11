#!/usr/bin/env node

/**
 * Script per applicare lo schema SQL direttamente al database PostgreSQL
 * Esegui: node scripts/apply-schema.js
 * 
 * Requisiti nel .env.local:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_DB_PASSWORD (password del database)
 * - Oppure: VITE_SUPABASE_DB_CONNECTION_STRING (connection string completa)
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('📊 Applicazione schema database Supabase...\n');

// Leggi variabili d'ambiente
let supabaseUrl = '';
let dbPassword = '';
let connectionString = '';

try {
  const envPath = join(rootDir, 'apps', 'web', '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const passwordMatch = envContent.match(/VITE_SUPABASE_DB_PASSWORD=(.+)/);
  const connMatch = envContent.match(/VITE_SUPABASE_DB_CONNECTION_STRING=(.+)/);
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (passwordMatch) dbPassword = passwordMatch[1].trim();
  if (connMatch) connectionString = connMatch[1].trim();
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL non trovato in .env.local');
    process.exit(1);
  }
  
  // Estrai project ref dall'URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Impossibile estrarre project ref dall\'URL');
    process.exit(1);
  }
  
  // Costruisci connection string se non fornita
  if (!connectionString) {
    if (!dbPassword) {
      console.error('❌ VITE_SUPABASE_DB_PASSWORD o VITE_SUPABASE_DB_CONNECTION_STRING richiesti');
      console.error('\n📝 Aggiungi nel file .env.local:');
      console.error('   VITE_SUPABASE_DB_PASSWORD=la-tua-password-database');
      console.error('\n   Oppure:');
      console.error('   VITE_SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
      console.error('\n   La password la trovi su: Dashboard > Settings > Database > Database password');
      console.error('   La connection string su: Dashboard > Settings > Database > Connection string > URI\n');
      process.exit(1);
    }
    
    // Costruisci connection string
    connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
  }
  
  console.log('✅ Credenziali lette correttamente');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Project: ${projectRef}\n`);
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

// Connetti e esegui
async function applySchema() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🔌 Connessione al database...');
    await client.connect();
    console.log('✅ Connesso al database\n');
    
    console.log('📝 Esecuzione schema SQL...');
    console.log('   (Questo potrebbe richiedere alcuni secondi...)\n');
    
    // Esegui lo schema (Supabase supporta multi-statement)
    await client.query(sqlSchema);
    
    console.log('✅ Schema applicato con successo!\n');
    
    // Verifica che le tabelle siano state create
    console.log('🔍 Verifica tabelle create...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`✅ Trovate ${result.rows.length} tabelle:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log();
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione dello schema:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Alcune tabelle/funzioni potrebbero già esistere.');
      console.log('   Questo è normale se hai già eseguito lo schema.\n');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Connessione chiusa\n');
  }
}

applySchema().catch(error => {
  console.error('\n❌ Errore fatale:', error.message);
  console.error('\n💡 Se l\'errore persiste:');
  console.error('   1. Verifica la password del database');
  console.error('   2. Verifica la connection string');
  console.error('   3. Prova ad applicare lo schema manualmente dalla dashboard\n');
  process.exit(1);
});


