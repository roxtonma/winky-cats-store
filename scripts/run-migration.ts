#!/usr/bin/env ts-node
/**
 * Script to run database migrations
 *
 * Usage:
 *   npx ts-node scripts/run-migration.ts migrations/005_add_qikink_products_table.sql
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(migrationPath: string) {
  console.log('🚀 Running database migration...\n');

  // Read migration file
  const fullPath = path.isAbsolute(migrationPath)
    ? migrationPath
    : path.join(process.cwd(), migrationPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📁 Reading migration from: ${fullPath}`);
  const migrationSQL = fs.readFileSync(fullPath, 'utf-8');

  console.log(`📊 Migration size: ${migrationSQL.length} characters\n`);

  // Execute migration
  try {
    console.log('⏳ Executing migration...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.error('\nTrying alternative method...');

      // Try running it via a custom function or direct execution
      // Split by semicolon and run each statement separately
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`\n📝 Found ${statements.length} SQL statements`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

        try {
          // Use .from() with a raw query
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (stmtError) {
            console.error(`❌ Statement ${i + 1} failed:`, stmtError.message);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} completed`);
          }
        } catch (e) {
          console.error(`❌ Statement ${i + 1} exception:`, e);
        }
      }

      console.log('\n⚠️  Migration completed with errors. Please check the output above.');
      console.log('💡 You may need to run the migration manually in your Supabase SQL editor.');
      console.log(`   URL: ${SUPABASE_URL.replace('//', '//app.')}/project/_/sql/new`);
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!');
    if (data) {
      console.log('📊 Result:', data);
    }

    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('💥 Fatal error:', error);
    console.log('\n💡 Please run the migration manually in your Supabase SQL editor:');
    console.log(`   URL: ${SUPABASE_URL.replace('//', '//app.')}/project/_/sql/new`);
    console.log('\nCopy and paste the contents of:');
    console.log(`   ${fullPath}`);
    process.exit(1);
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2] || 'migrations/005_add_qikink_products_table.sql';

runMigration(migrationFile).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
