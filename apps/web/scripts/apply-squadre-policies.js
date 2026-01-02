#!/usr/bin/env node

/**
 * Script per applicare la migration delle policy RLS per le squadre direttamente al database PostgreSQL
 * Esegui: node apps/web/scripts/apply-squadre-policies.js
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

console.log('🔧 Applicazione policy RLS per gestione squadre su Supabase...\n');

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
  if (passwordMatch) dbPassword = passwordMatch[1].trim().replace(/^=/, '');
  if (connMatch) {
    let connStr = connMatch[1].trim();
    if (connStr.includes('[PASSWORD]') && dbPassword) {
      connStr = connStr.replace('[PASSWORD]', dbPassword);
    }
    connectionString = connStr;
  }
  
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL non trovato in .env.local');
    process.exit(1);
  }
  
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Impossibile estrarre project ref dall\'URL');
    process.exit(1);
  }
  
  if (!connectionString) {
    if (!dbPassword) {
      console.error('❌ VITE_SUPABASE_DB_PASSWORD o VITE_SUPABASE_DB_CONNECTION_STRING richiesti');
      console.error('\n📝 Aggiungi nel file .env.local:');
      console.error('   VITE_SUPABASE_DB_PASSWORD=la-tua-password-database');
      console.error('\n   Oppure:');
      console.error('   VITE_SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
      process.exit(1);
    }
    
    connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
  }
  
  console.log('✅ Credenziali lette correttamente');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Project: ${projectRef}\n`);
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

// Connetti e esegui
async function applyMigration() {
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
    
    console.log('📝 Esecuzione policy RLS per squadre...\n');
    
    // Esegui la migration
    await client.query(sqlMigration);
    
    console.log('✅ Policy RLS applicate con successo!\n');
    
    // Verifica che le policy siano state create
    console.log('🔍 Verifica policy create...');
    const policyCheck = await client.query(`
      SELECT 
        policyname,
        cmd
      FROM pg_policies
      WHERE tablename = 'squadre'
      ORDER BY policyname;
    `);
    
    if (policyCheck.rows.length > 0) {
      console.log(`✅ Trovate ${policyCheck.rows.length} policy per la tabella squadre:`);
      policyCheck.rows.forEach(row => {
        console.log(`   - ${row.policyname} (${row.cmd})`);
      });
    }
    
    console.log('\n✨ Migration completata con successo!');
    console.log('\n📚 Ora gli admin possono:');
    console.log('   ✅ Creare nuove squadre');
    console.log('   ✅ Modificare squadre esistenti');
    console.log('   ✅ Eliminare squadre\n');
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione della migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Alcune policy potrebbero già esistere.');
      console.log('   Questo è normale se hai già eseguito la migration.\n');
    } else {
      console.error('\n💡 Se l\'errore persiste:');
      console.error('   1. Verifica la password del database');
      console.error('   2. Verifica la connection string');
      console.error('   3. Prova ad applicare la migration manualmente dalla dashboard\n');
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Connessione chiusa\n');
  }
}

applyMigration().catch(console.error);

