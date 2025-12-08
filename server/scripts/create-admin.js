/**
 * Script to create an admin user
 * Usage: node server/scripts/create-admin.js <email> <password> [firstName] [lastName]
 */

import bcrypt from 'bcryptjs';
import pool from '../database/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: node create-admin.js <email> <password> [firstName] [lastName]');
    console.error('Example: node create-admin.js admin@lume.com admin123 Admin User');
    process.exit(1);
  }

  const [email, password, firstName = 'Admin', lastName = 'User'] = args;

  let connection;
  
  try {
    connection = await pool.getConnection();
    
    // Check if admin already exists
    const [existing] = await connection.execute(
      'SELECT id, email, user_type FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log(`⚠️  User with email ${email} already exists!`);
      
      // Check if they're already an admin
      if (existing[0].user_type === 'admin') {
        console.log('✅ User is already an admin.');
        connection.release();
        process.exit(0);
      } else {
        // Update to admin
        await connection.execute(
          'UPDATE users SET user_type = ? WHERE id = ?',
          ['admin', existing[0].id]
        );
        console.log(`✅ Updated user ${email} to admin role.`);
        connection.release();
        process.exit(0);
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const [result] = await connection.execute(
      `INSERT INTO users (email, password_hash, user_type, first_name, last_name)
       VALUES (?, ?, 'admin', ?, ?)`,
      [email, passwordHash, firstName, lastName]
    );

    console.log('\n✅ Admin user created successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`User ID: ${result.insertId}`);
    console.log('═══════════════════════════════════════\n');
    console.log('You can now log in with these credentials at /#/admin');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();

