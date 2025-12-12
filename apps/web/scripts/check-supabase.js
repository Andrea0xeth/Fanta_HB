#!/usr/bin/env node

/**
 * Script per verificare la configurazione Supabase
 * Esegui: node scripts/check-supabase.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 Verifica configurazione Supabase...\n');

// Verifica file .env.local
const envPath = join(rootDir, '.env.local');
let envExists = false;
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envExists = true;
  
  // Estrai variabili
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseKey = keyMatch[1].trim();
  
  console.log('✅ File .env.local trovato');
} catch (error) {
  console.log('❌ File .env.local NON trovato');
  console.log('   Crea il file in apps/web/.env.local con:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key\n');
  process.exit(1);
}

// Verifica valori
console.log('\n📋 Valori configurati:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '❌ MANCANTE'}`);
console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : '❌ MANCANTE'}`);

if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co' || supabaseUrl.trim() === '') {
  console.log('\n❌ VITE_SUPABASE_URL non configurato correttamente');
  process.exit(1);
}

if (!supabaseKey || supabaseKey.trim() === '') {
  console.log('\n❌ VITE_SUPABASE_ANON_KEY non configurato correttamente');
  process.exit(1);
}

// Verifica formato URL
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.log('\n⚠️  L\'URL sembra non essere valido');
  console.log('   Dovrebbe essere: https://xxxxx.supabase.co');
}

// Verifica formato key
if (!supabaseKey.startsWith('eyJ')) {
  console.log('\n⚠️  La chiave sembra non essere valida');
  console.log('   Dovrebbe iniziare con: eyJ...');
}

console.log('\n✅ Configurazione base corretta!');
console.log('\n📝 Prossimi passi:');
console.log('   1. Applica lo schema: vedi SETUP_SUPABASE.md');
console.log('   2. Crea il bucket "prove-quest" in Storage');
console.log('   3. Riavvia il dev server: pnpm dev\n');



