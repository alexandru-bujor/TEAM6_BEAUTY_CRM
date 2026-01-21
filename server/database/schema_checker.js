import pool from './connection.js';

// Check and update database schema
export async function checkAndUpdateSchema() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const dbName = process.env.DB_NAME || 'lume_db';
    
    // Ensure we're using the correct database
    await connection.query(`USE \`${dbName}\``);
    
    console.log('🔍 Checking database schema...');
    
    // Check all required tables
    const requiredTables = [
      'users',
      'salons',
      'salon_categories',
      'services',
      'employees',
      'employee_specialties',
      'employee_schedules',
      'appointments',
      'reviews',
      'customer_favorites',
      'verification_codes',
      'password_reset_tokens',
      'user_mfa',
      'security_events'
    ];
    
    const [existingTables] = await connection.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ?`,
      [dbName]
    );
    
    const existingTableNames = existingTables.map(t => t.table_name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('📋 These tables will be created on next full migration');
      // Don't return false here - continue with column checks
    }
    
    let updatesMade = false;
    
    // Check verification_codes table structure (if it exists)
    if (existingTableNames.includes('verification_codes')) {
      const updated = await checkVerificationCodesTable(connection);
      if (updated) updatesMade = true;
    }
    
    // Check users table for admin user type (if it exists)
    if (existingTableNames.includes('users')) {
      const updated = await checkAdminUserType(connection);
      if (updated) updatesMade = true;
    }
    
    // Check other critical columns (if tables exist)
    const columnsUpdated = await checkTableColumns(connection, existingTableNames);
    if (columnsUpdated) updatesMade = true;
    
    connection.release();
    
    if (updatesMade) {
      console.log('✅ Database schema updated successfully');
    } else {
      console.log('✅ Database schema is up to date');
    }
    return true;
  } catch (error) {
    if (connection) connection.release();
    console.error('❌ Schema check error:', error.message);
    // Don't fail completely - schema might be partially updated
    return true;
  }
}

// Check and update verification_codes table
async function checkVerificationCodesTable(connection) {
  let updated = false;
  
  try {
    // Check existing columns
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'verification_codes'`
    );
    
    const columnNames = columns.map(col => col.COLUMN_NAME);
    const user_idCol = columns.find(col => col.COLUMN_NAME === 'user_id');
    
    // Make user_id nullable if it's not
    if (user_idCol && user_idCol.IS_NULLABLE === 'NO') {
      console.log('🔄 Making user_id nullable in verification_codes...');
      await connection.query(
        `ALTER TABLE verification_codes MODIFY COLUMN user_id INT NULL`
      );
      updated = true;
    }
    
    // Add email column if missing
    if (!columnNames.includes('email')) {
      console.log('🔄 Adding email column to verification_codes...');
      await connection.query(
        `ALTER TABLE verification_codes 
         ADD COLUMN email VARCHAR(255) NULL AFTER type`
      );
      updated = true;
    }
    
    // Add phone column if missing
    if (!columnNames.includes('phone')) {
      console.log('🔄 Adding phone column to verification_codes...');
      await connection.query(
        `ALTER TABLE verification_codes 
         ADD COLUMN phone VARCHAR(20) NULL AFTER email`
      );
      updated = true;
    }
    
    // Check indexes
    const [indexes] = await connection.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'verification_codes'`
    );
    
    const indexNames = indexes.map(idx => idx.INDEX_NAME);
    
    if (!indexNames.includes('idx_email') && columnNames.includes('email')) {
      console.log('🔄 Adding idx_email index...');
      await connection.query(
        `ALTER TABLE verification_codes ADD INDEX idx_email (email)`
      );
      updated = true;
    }
    
    if (!indexNames.includes('idx_phone') && columnNames.includes('phone')) {
      console.log('🔄 Adding idx_phone index...');
      await connection.query(
        `ALTER TABLE verification_codes ADD INDEX idx_phone (phone)`
      );
      updated = true;
    }
    
    return updated;
  } catch (error) {
    // Table might not exist yet, that's okay
    if (!error.message.includes("doesn't exist")) {
      console.error('Error checking verification_codes table:', error.message);
    }
    return false;
  }
}

// Check and update users table for admin user type
async function checkAdminUserType(connection) {
  let updated = false;
  
  try {
    // Check current enum values
    const [enumValues] = await connection.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'user_type'`
    );

    if (enumValues.length > 0) {
      const columnType = enumValues[0].COLUMN_TYPE;
      
      // Check if 'admin' is already in the enum
      if (!columnType.includes("'admin'")) {
        console.log('🔄 Adding admin user type to users table...');
        await connection.query(
          `ALTER TABLE users 
           MODIFY COLUMN user_type ENUM('customer', 'salon_owner', 'admin') NOT NULL`
        );
        updated = true;
        console.log('✅ Admin user type added successfully');
      }
    }
  } catch (error) {
    console.error('Error checking admin user type:', error);
    // Don't throw - continue with other checks
  }
  
  return updated;
}

// Check and update other table columns
async function checkTableColumns(connection, existingTableNames) {
  let updated = false;
  
  const checks = [
    {
      table: 'users',
      columns: [
        { name: 'email_verified', type: 'BOOLEAN', default: 'FALSE' },
        { name: 'phone_verified', type: 'BOOLEAN', default: 'FALSE' }
      ]
    },
    {
      table: 'salons',
      columns: [
        { name: 'is_individual_stylist', type: 'BOOLEAN', default: 'FALSE' },
        { name: 'is_partner', type: 'BOOLEAN', default: 'FALSE' }
      ]
    }
  ];
  
  for (const check of checks) {
    // Only check if table exists
    if (!existingTableNames.includes(check.table)) {
      continue;
    }
    
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = ?`,
        [check.table]
      );
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      
      for (const col of check.columns) {
        if (!columnNames.includes(col.name)) {
          console.log(`🔄 Adding ${col.name} column to ${check.table}...`);
          await connection.query(
            `ALTER TABLE ${check.table} 
             ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`
          );
          updated = true;
        }
      }
    } catch (error) {
      // Table might not exist, skip
      if (!error.message.includes("doesn't exist")) {
        console.error(`Error checking ${check.table}:`, error.message);
      }
    }
  }
  
  return updated;
}

