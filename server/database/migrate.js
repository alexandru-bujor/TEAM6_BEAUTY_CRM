import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { checkAndUpdateSchema } from './schema_checker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  let connection;
  
  try {
    // Connect to MySQL (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('📦 Checking database connection...');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'lume_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);

    // Use the database
    await connection.query(`USE \`${dbName}\``);

    // Check if users table exists (to determine if initial migration is needed)
    const [tables] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'users'`,
      [dbName]
    );

    const needsInitialMigration = tables[0].count === 0;

    if (needsInitialMigration) {
      console.log('📋 Running initial database schema creation...');
      
      // Read schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Remove the CREATE DATABASE and USE statements from schema
      // since we already handled that
      const cleanedSchema = schema
        .replace(/CREATE DATABASE IF NOT EXISTS.*?;/gi, '')
        .replace(/USE.*?;/gi, '')
        .trim();

      // Execute schema
      await connection.query(cleanedSchema);
      console.log('✅ Initial database schema created successfully');
    }

    // Close the initial connection
    await connection.end();
    
    // Always check and update schema (for existing databases)
    // This uses the connection pool, so it's safe to call after closing the initial connection
    console.log('🔍 Checking for schema updates...');
    await checkAndUpdateSchema();

    console.log('✅ Database migration check completed!');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    // Don't throw - let the server decide what to do
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow running as standalone script
// Check if this file is being run directly (not imported)
const isMainModule = process.argv[1] && 
  (process.argv[1].endsWith('migrate.js') || 
   process.argv[1].endsWith('migrate'));

if (isMainModule) {
  runMigrations()
    .then((success) => {
      if (success) {
        console.log('✅ Migration completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Migration failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Migration error:', error);
      process.exit(1);
    });
}
