/**
 * Migration to add 'admin' user type to the users table
 */
export async function applyAdminMigration(connection) {
  try {
    console.log('Applying migration for admin user type...');

    // Check current enum values
    const [enumValues] = await connection.execute(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'user_type'`
    );

    if (enumValues.length > 0) {
      const columnType = enumValues[0].COLUMN_TYPE;
      
      // Check if 'admin' is already in the enum
      if (columnType.includes("'admin'")) {
        console.log('ℹ️  Admin user type already exists.');
        return;
      }

      // Modify the enum to include 'admin'
      // MySQL doesn't support direct enum modification, so we need to alter the column
      await connection.execute(
        `ALTER TABLE users 
         MODIFY COLUMN user_type ENUM('customer', 'salon_owner', 'admin') NOT NULL`
      );
      console.log('✅ Added admin user type to users table');
    } else {
      console.log('ℹ️  user_type column not found, skipping migration.');
    }

    console.log('Migration for admin user type completed.');
  } catch (error) {
    console.error('Error applying admin migration:', error);
    throw error;
  }
}

