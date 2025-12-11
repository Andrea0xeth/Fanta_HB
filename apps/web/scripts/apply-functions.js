#!/usr/bin/env node

/**
 * Script per applicare le funzioni RPC necessarie al database Supabase
 * Se la connessione diretta non funziona, mostra il SQL da eseguire manualmente
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

console.log('🔧 Applicazione funzioni RPC al database Supabase...\n');

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
  if (passwordMatch) dbPassword = passwordMatch[1].trim().replace(/^=+/, ''); // Rimuovi = iniziali
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
  
  // Costruisci connection string
  if (!connectionString) {
    if (!dbPassword) {
      console.error('❌ VITE_SUPABASE_DB_PASSWORD o VITE_SUPABASE_DB_CONNECTION_STRING richiesti');
      console.error('\n📝 Aggiungi nel file .env.local:');
      console.error('   VITE_SUPABASE_DB_PASSWORD=la-tua-password-database');
      console.error('\n   Oppure:');
      console.error('   VITE_SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres');
      console.error('\n   La password la trovi su: Dashboard > Settings > Database > Database password\n');
      process.exit(1);
    }
    
    // Prova prima la connection string diretta (porta 5432), poi pooler come fallback
    // Formato diretto (più affidabile per connessioni dirette)
    connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  }
  
  console.log('✅ Configurazione trovata');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Project: ${projectRef}\n`);
  
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  process.exit(1);
}

// Usa il file combinato che contiene entrambe le funzioni
const functionsFile = '00007_apply_all_functions.sql';

async function applyFunctions() {
  const migrationsDir = join(rootDir, 'supabase', 'migrations');
  const filePath = join(migrationsDir, functionsFile);
  
  if (!existsSync(filePath)) {
    console.error(`❌ File ${functionsFile} non trovato`);
    console.error(`   Assicurati che il file esista in supabase/migrations/`);
    process.exit(1);
  }

  const sql = readFileSync(filePath, 'utf-8');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connessione al database...');
    await client.connect();
    console.log('✅ Connesso al database\n');
    
    console.log(`📝 Applicando funzioni RPC (login e registrazione)...`);
    await client.query(sql);
    console.log(`✅ Funzioni RPC applicate con successo!\n`);
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione:', error.message);
    
    if (error.message.includes('Tenant or user not found') || error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n⚠️  La connessione diretta non funziona.');
      console.error('   Esegui manualmente il SQL nella Supabase SQL Editor:\n');
      console.error('─'.repeat(60));
      console.error(sql);
      console.error('─'.repeat(60));
      console.error('\n📝 Istruzioni:');
      console.error('   1. Vai su: https://supabase.com/dashboard/project/[PROJECT-REF]/sql');
      console.error('   2. Incolla il SQL sopra');
      console.error('   3. Clicca "Run"\n');
    } else if (error.message.includes('already exists')) {
      console.log('\nℹ️  Funzioni già esistenti, aggiornate con successo!\n');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

applyFunctions().catch(error => {
  console.error('\n❌ Errore fatale:', error.message);
  process.exit(1);
});
