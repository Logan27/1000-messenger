/**
 * Database Migration Runner
 * 
 * This script runs SQL migrations from the migrations directory.
 * It's a simple migration runner that executes SQL files in order.
 * 
 * Usage:
 *   npm run migrate
 *   or: node -r ts-node/register src/database/migrate.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MigrationFile {
  filename: string;
  sql: string;
}

// List of migration files in order
const MIGRATIONS: MigrationFile[] = [
  {
    filename: '001_initial_schema.sql',
    sql: readFileSync(
      join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf-8'
    ),
  },
];

async function runMigrations() {
  const databaseUrl = process.env['DATABASE_URL'];

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Starting database migration...');
  console.log('📍 Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Migrations tracking table ready');

    // Check which migrations have been run
    const { rows: executedMigrations } = await client.query(
      'SELECT filename FROM migrations ORDER BY id'
    );
    const executedFilenames = new Set(
      executedMigrations.map((row) => row.filename)
    );

    console.log(
      `📊 Found ${executedMigrations.length} previously executed migrations`
    );

    // Run pending migrations
    let migrationsRun = 0;
    for (const migration of MIGRATIONS) {
      if (executedFilenames.has(migration.filename)) {
        console.log(`⏭️  Skipping ${migration.filename} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${migration.filename}`);

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Execute migration SQL
        await client.query(migration.sql);

        // Record migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [migration.filename]
        );

        // Commit transaction
        await client.query('COMMIT');

        console.log(`✅ Migration ${migration.filename} completed successfully`);
        migrationsRun++;
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        throw new Error(
          `Failed to run migration ${migration.filename}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    client.release();

    if (migrationsRun === 0) {
      console.log('✨ All migrations are up to date');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`);
    }

    await pool.end();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { runMigrations };
