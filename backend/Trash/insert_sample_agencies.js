// Script to insert sample agencies into the database
require('dotenv').config();
const db = require('./db');

async function insertSampleAgencies() {
  try {
    // Check existing agencies
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM agencies');
    console.log('Current agencies in database:', existing[0].count);

    // Insert sample agencies
    const agencies = [
      ['Water Department', 'water@city.gov'],
      ['Electricity Department', 'electricity@city.gov'],
      ['Sanitation Department', 'sanitation@city.gov'],
      ['Road Maintenance', 'roads@city.gov']
    ];

    for (const [name, email] of agencies) {
      try {
        await db.execute(
          'INSERT INTO agencies (name, email) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name',
          [name, email]
        );
        console.log(`✅ Inserted/Updated: ${name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Already exists: ${name}`);
        } else {
          console.error(`❌ Error inserting ${name}:`, error.message);
        }
      }
    }

    // Verify
    const [result] = await db.execute('SELECT * FROM agencies ORDER BY name');
    console.log('\n📊 All agencies in database:');
    result.forEach(agency => {
      console.log(`  - ${agency.name} (${agency.email})`);
    });
    console.log(`\n✅ Total: ${result.length} agencies`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertSampleAgencies();

