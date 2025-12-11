#!/usr/bin/env node

/**
 * Script per aprire lo schema SQL nel terminale per copiarlo facilmente
 * Esegui: node scripts/open-sql-schema.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..', '..');

const schemaPath = join(rootDir, 'supabase', 'migrations', '00001_initial_schema.sql');

console.log('📋 Schema SQL per Supabase\n');
console.log('='.repeat(80));
console.log('Copia tutto il contenuto qui sotto e incollalo in Supabase SQL Editor\n');
console.log('='.repeat(80));
console.log('\n');

try {
  const sql = readFileSync(schemaPath, 'utf-8');
  console.log(sql);
  console.log('\n');
  console.log('='.repeat(80));
  console.log('\n✅ Schema pronto da copiare!');
  console.log('\n📝 Prossimi passi:');
  console.log('   1. Copia tutto il testo sopra');
  console.log('   2. Vai su https://app.supabase.com > SQL Editor');
  console.log('   3. Clicca "New query"');
  console.log('   4. Incolla e clicca "Run"\n');
} catch (error) {
  console.error('❌ Errore lettura schema:', error.message);
  process.exit(1);
}


