const db = require('./db');

async function linkAgencyUser() {
  try {
    console.log('🔗 Linking agency users to agencies...');

    // Get all agency users without agency_id
    const [agencyUsers] = await db.execute(
      'SELECT id, email, fullname FROM users WHERE role = "agency" AND (agency_id IS NULL OR agency_id = 0)'
    );

    if (agencyUsers.length === 0) {
      console.log('✅ All agency users are already linked');
      process.exit(0);
    }

    console.log(`Found ${agencyUsers.length} agency user(s) to link`);

    // Get all agencies
    const [agencies] = await db.execute('SELECT id, name, email FROM agencies');

    if (agencies.length === 0) {
      console.log('⚠️  No agencies found. Please create agencies first.');
      process.exit(0);
    }

    console.log(`\nAvailable agencies:`);
    agencies.forEach((agency, index) => {
      console.log(`  ${index + 1}. ${agency.name} (${agency.email}) - ID: ${agency.id}`);
    });

    // Try to link by email match first
    for (const user of agencyUsers) {
      const matchingAgency = agencies.find(a => a.email === user.email);
      
      if (matchingAgency) {
        await db.execute(
          'UPDATE users SET agency_id = ? WHERE id = ?',
          [matchingAgency.id, user.id]
        );
        console.log(`✅ Linked ${user.email} to ${matchingAgency.name}`);
      } else {
        // Link to first available agency (or prompt user)
        const firstAgency = agencies[0];
        await db.execute(
          'UPDATE users SET agency_id = ? WHERE id = ?',
          [firstAgency.id, user.id]
        );
        console.log(`✅ Linked ${user.email} to ${firstAgency.name} (first available)`);
      }
    }

    // Show final status
    const [linkedUsers] = await db.execute(`
      SELECT u.id, u.fullname, u.email, u.agency_id, a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE u.role = 'agency'
    `);

    console.log('\n📊 Final agency user status:');
    linkedUsers.forEach(user => {
      if (user.agency_name) {
        console.log(`  ✅ ${user.email} → ${user.agency_name} (ID: ${user.agency_id})`);
      } else {
        console.log(`  ⚠️  ${user.email} → Not linked`);
      }
    });

    console.log('\n🎉 Linking completed!');

  } catch (error) {
    console.error('❌ Error linking agency users:', error);
  } finally {
    process.exit();
  }
}

linkAgencyUser();

