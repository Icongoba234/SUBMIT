const db = require('./db');

async function setupRealtimeUpdates() {
  try {
    console.log('🔄 Setting up real-time updates table...');

    // Create the complaint_updates table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS complaint_updates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        user_id INT NULL,
        update_type ENUM('status_change', 'assignment', 'comment', 'resolution') DEFAULT 'status_change',
        old_value VARCHAR(255) NULL,
        new_value VARCHAR(255) NULL,
        message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_complaint_id (complaint_id),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Table created successfully');

    // Check if there are any complaints in the database
    let [complaints] = await db.execute('SELECT id FROM complaints ORDER BY id LIMIT 3');
    
    if (complaints.length === 0) {
      console.log('⚠️  No complaints found. Creating test complaints for sample data...');
      
      // Get or create a test user
      let [users] = await db.execute('SELECT id FROM users LIMIT 1');
      let userId;
      
      if (users.length === 0) {
        // Create a test user
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('test123', 10);
        const [userResult] = await db.execute(
          'INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)',
          ['Test User', 'test@example.com', hashedPassword, 'citizen']
        );
        userId = userResult.insertId;
        console.log('✅ Created test user');
      } else {
        userId = users[0].id;
      }
      
      // Create 3 test complaints
      const testComplaints = [
        { title: 'Water Supply Issue', description: 'No water supply in the area for 2 days' },
        { title: 'Street Light Not Working', description: 'Street light at Main Street is not working' },
        { title: 'Garbage Collection Delay', description: 'Garbage has not been collected for a week' }
      ];
      
      for (const complaint of testComplaints) {
        await db.execute(
          'INSERT INTO complaints (user_id, title, description, status) VALUES (?, ?, ?, ?)',
          [userId, complaint.title, complaint.description, 'pending']
        );
      }
      
      // Fetch the created complaints
      [complaints] = await db.execute('SELECT id FROM complaints ORDER BY id DESC LIMIT 3');
      console.log(`✅ Created ${complaints.length} test complaints`);
    }

    // Check if updates already exist
    const [existingUpdates] = await db.execute('SELECT COUNT(*) as count FROM complaint_updates');
    
    if (existingUpdates[0].count > 0) {
      console.log(`ℹ️  ${existingUpdates[0].count} updates already exist. Skipping sample data insertion.`);
      process.exit(0);
    }

    // Insert sample update data (3 records)
    console.log('📝 Inserting sample update data...');

    const sampleUpdates = [
      {
        complaint_id: complaints[0].id,
        user_id: null,
        update_type: 'status_change',
        old_value: 'pending',
        new_value: 'in_review',
        message: 'Complaint has been assigned to Water Department and is now under review.'
      },
      {
        complaint_id: complaints.length > 1 ? complaints[1].id : complaints[0].id,
        user_id: null,
        update_type: 'assignment',
        old_value: null,
        new_value: 'Electricity Department',
        message: 'Complaint has been assigned to Electricity Department for investigation.'
      },
      {
        complaint_id: complaints.length > 2 ? complaints[2].id : complaints[0].id,
        user_id: null,
        update_type: 'status_change',
        old_value: 'in_review',
        new_value: 'resolved',
        message: 'Issue has been resolved. Water supply has been restored to the area.'
      }
    ];

    for (const update of sampleUpdates) {
      await db.execute(
        `INSERT INTO complaint_updates (complaint_id, user_id, update_type, old_value, new_value, message) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [update.complaint_id, update.user_id, update.update_type, update.old_value, update.new_value, update.message]
      );
      console.log(`✅ Inserted update: ${update.update_type} for complaint #${update.complaint_id}`);
    }

    console.log('\n🎉 Real-time updates setup completed successfully!');
    console.log(`📊 Total updates: ${sampleUpdates.length}`);

  } catch (error) {
    console.error('❌ Error setting up real-time updates:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('   Make sure the complaints table exists. Run backend/sql/setup.sql first.');
    }
  } finally {
    process.exit();
  }
}

setupRealtimeUpdates();

