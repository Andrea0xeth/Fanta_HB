/**
 * Script per applicare la migration della coda push notifications
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richiesti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('📦 Applicazione migration push_notifications_queue...');
    
    const migrationPath = path.join(__dirname, '../../supabase/migrations/00016_push_notifications_queue.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Esegui la migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Se exec_sql non esiste, prova a eseguire direttamente
      console.log('⚠️  exec_sql non disponibile, provo metodo alternativo...');
      
      // Esegui ogni statement separatamente
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          // Usa una query diretta (potrebbe non funzionare per CREATE TABLE)
          // In questo caso, meglio applicare manualmente dal dashboard
          console.log('⚠️  Esecuzione diretta non supportata per CREATE TABLE');
          console.log('📝 Applica manualmente dal dashboard Supabase:');
          console.log('   1. Vai su SQL Editor');
          console.log('   2. Incolla il contenuto di:');
          console.log(`      ${migrationPath}`);
          console.log('   3. Esegui la query');
          return;
        } catch (err) {
          console.error('Errore:', err.message);
        }
      }
    } else {
      console.log('✅ Migration applicata con successo!');
    }
  } catch (error) {
    console.error('❌ Errore durante l\'applicazione della migration:', error);
    console.log('\n📝 Applica manualmente dal dashboard Supabase:');
    console.log('   1. Vai su SQL Editor');
    console.log('   2. Incolla il contenuto di:');
    console.log('      supabase/migrations/00016_push_notifications_queue.sql');
    console.log('   3. Esegui la query');
    process.exit(1);
  }
}

applyMigration();

