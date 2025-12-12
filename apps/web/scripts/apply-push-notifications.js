#!/usr/bin/env node

/**
 * Script per applicare la migration delle notifiche push direttamente al database PostgreSQL
 * Esegui: npm run apply:push-notifications
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

console.log('📱 Applicazione migration notifiche push su Supabase...\n');

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
  if (passwordMatch) dbPassword = passwordMatch[1].trim().replace(/^=/, ''); // Rimuovi = iniziale se presente
  if (connMatch) {
    let connStr = connMatch[1].trim();
    // Sostituisci [PASSWORD] con la password reale se presente
    if (connStr.includes('[PASSWORD]') && dbPassword) {
      connStr = connStr.replace('[PASSWORD]', dbPassword);
    }
    connectionString = connStr;
  }
  
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
    
    // Costruisci connection string - prova diverse regioni
    // La regione dipende dal tuo progetto, prova quella di default
    connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
    
    // Se la regione è diversa, l'utente può fornire la connection string completa
    console.log('💡 Se la connessione fallisce, usa VITE_SUPABASE_DB_CONNECTION_STRING con la connection string completa');
    console.log('   La trovi su: Dashboard > Settings > Database > Connection string > URI\n');
  }
  
  console.log('✅ Credenziali lette correttamente');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`   Project: ${projectRef}\n`);
} catch (error) {
  console.error('❌ Errore lettura .env.local:', error.message);
  console.error('\n💡 Crea il file .env.local nella cartella apps/web/ con:');
  console.error('   VITE_SUPABASE_URL=https://tuo-progetto.supabase.co');
  console.error('   VITE_SUPABASE_DB_PASSWORD=la-tua-password\n');
  process.exit(1);
}

// Leggi la migration SQL
let sqlMigration = '';
try {
  const migrationPath = join(rootDir, 'supabase', 'migrations', '00015_push_notifications.sql');
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
    
    console.log('📝 Esecuzione migration notifiche push...');
    console.log('   (Questo potrebbe richiedere alcuni secondi...)\n');
    
    // Esegui la migration (Supabase supporta multi-statement)
    await client.query(sqlMigration);
    
    console.log('✅ Migration applicata con successo!\n');
    
    // Verifica che la tabella sia stata creata
    console.log('🔍 Verifica tabella push_subscriptions...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'push_subscriptions';
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Tabella push_subscriptions creata correttamente!');
    } else {
      console.log('⚠️  Tabella push_subscriptions non trovata (potrebbe essere un errore)');
    }
    
    // Verifica i trigger
    console.log('\n🔍 Verifica trigger creati...');
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%notify%' 
      ORDER BY event_object_table;
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log(`✅ Trovati ${triggerCheck.rows.length} trigger:`);
      triggerCheck.rows.forEach(row => {
        console.log(`   - ${row.trigger_name} (tabella: ${row.event_object_table})`);
      });
    } else {
      console.log('⚠️  Nessun trigger trovato (potrebbero essere già stati creati)');
    }
    
    // Verifica le funzioni
    console.log('\n🔍 Verifica funzioni create...');
    const functionCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%push%' OR routine_name LIKE '%notify%'
      ORDER BY routine_name;
    `);
    
    if (functionCheck.rows.length > 0) {
      console.log(`✅ Trovate ${functionCheck.rows.length} funzioni:`);
      functionCheck.rows.forEach(row => {
        console.log(`   - ${row.routine_name}`);
      });
    }
    
    console.log('\n✨ Migration completata con successo!');
    console.log('\n📚 Prossimi passi:');
    console.log('   1. Configura le chiavi VAPID (vedi supabase/PUSH_NOTIFICATIONS_SETUP.md)');
    console.log('   2. Testa le notifiche push dal frontend');
    console.log('   3. (Opzionale) Crea Edge Function per inviare notifiche push\n');
    
  } catch (error) {
    console.error('❌ Errore durante l\'esecuzione della migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Alcune entità potrebbero già esistere.');
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

applyMigration().catch(error => {
  console.error('\n❌ Errore fatale:', error.message);
  process.exit(1);
});
