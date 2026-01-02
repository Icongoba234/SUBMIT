const db = require('./db');
const fs = require('fs');
const path = require('path');

async function migrateComplaintDetails() {
  try {
    console.log('🔄 Running complaint details migration...');

    // Read and execute SQL file
    const sqlFile = path.join(__dirname, 'sql', 'add_complaint_details.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await db.execute(statement);
          console.log('✓ Executed statement');
        } catch (error) {
          // Ignore "column already exists" errors
          if (!error.message.includes('Duplicate column name') && 
              !error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message);
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateComplaintDetails();

