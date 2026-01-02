const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setupSatisfactionRatings() {
  console.log('🔄 Setting up satisfaction ratings table...');
  try {
    const sqlFilePath = path.join(__dirname, 'sql', 'create_satisfaction_ratings.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements and execute
    const statements = sql.split(';').filter(s => s.trim() !== '' && !s.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing statement:', statement.trim().substring(0, 100) + '...');
        await db.execute(statement);
        console.log('✓ Executed statement');
      }
    }

    console.log('✅ Satisfaction ratings setup complete!');
  } catch (error) {
    console.error('❌ Error during satisfaction ratings setup:', error);
  } finally {
    if (db.end) {
      db.end();
    }
  }
}

setupSatisfactionRatings();

