const db = require('./db');

async function migrateAddAgencyId() {
  try {
    console.log('🔄 Adding agency_id column to users table...');

    // Check if column already exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'citizenvoice' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'agency_id'
    `);

    if (columns.length > 0) {
      console.log('✅ agency_id column already exists');
    } else {
      // Add agency_id column
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN agency_id INT NULL AFTER role,
        ADD INDEX idx_agency_id (agency_id)
      `);

      // Add foreign key constraint
      await db.execute(`
        ALTER TABLE users 
        ADD FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL
      `);

      console.log('✅ agency_id column added successfully');
    }

    // Link existing agency users to agencies by email match
    console.log('🔗 Linking existing agency users to agencies...');
    
    const [linked] = await db.execute(`
      UPDATE users u
      INNER JOIN agencies a ON u.email = a.email
      SET u.agency_id = a.id
      WHERE u.role = 'agency' AND u.agency_id IS NULL
    `);

    console.log(`✅ Linked ${linked.affectedRows || 0} agency users to agencies`);

    // Show current agency users and their links
    const [agencyUsers] = await db.execute(`
      SELECT u.id, u.fullname, u.email, u.role, u.agency_id, a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE u.role = 'agency'
    `);

    console.log('\n📊 Current agency users:');
    agencyUsers.forEach(user => {
      if (user.agency_name) {
        console.log(`  ✅ ${user.email} → ${user.agency_name} (ID: ${user.agency_id})`);
      } else {
        console.log(`  ⚠️  ${user.email} → Not linked to any agency`);
      }
    });

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

migrateAddAgencyId();

