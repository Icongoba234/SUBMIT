const db = require('./db');

async function migrateAddProfilePicture() {
  try {
    console.log('🔄 Adding profile_picture column to users table...');

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'citizenvoice' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'profile_picture'
    `);

    if (columns.length > 0) {
      console.log('✅ profile_picture column already exists');
    } else {
      // Add profile_picture column
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN profile_picture VARCHAR(255) NULL AFTER agency_id
      `);

      console.log('✅ profile_picture column added successfully');
    }

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists, skipping...');
    } else {
      throw error;
    }
  } finally {
    process.exit();
  }
}

migrateAddProfilePicture();

