const db = require('./db');

async function setupSampleComplaints() {
  try {
    console.log('Setting up sample complaints...');

    // Check if complaint_updates table exists, create if not
    try {
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
      console.log('✓ complaint_updates table ready');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // Get first user (or create a test user)
    let [users] = await db.execute('SELECT id FROM users LIMIT 1');
    let userId;
    
    if (users.length === 0) {
      // Create a test user
      const [result] = await db.execute(
        'INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)',
        ['Test User', 'test@example.com', '$2b$10$dummy', 'citizen']
      );
      userId = result.insertId;
      console.log('✓ Created test user');
    } else {
      userId = users[0].id;
    }

    // Get first agency
    let [agencies] = await db.execute('SELECT id FROM agencies LIMIT 1');
    let agencyId = agencies.length > 0 ? agencies[0].id : null;

    // Check if we already have complaints
    const [existingComplaints] = await db.execute('SELECT COUNT(*) as count FROM complaints');
    const complaintCount = existingComplaints[0].count;

    if (complaintCount >= 3) {
      console.log(`✓ Already have ${complaintCount} complaints, skipping sample data creation`);
    } else {
      // Create sample complaints (up to 3)
      const sampleComplaints = [
        {
          title: 'Pothole on Main Street',
          description: 'There is a large pothole on Main Street near the intersection with Oak Avenue. It has been getting worse over the past few weeks and poses a safety hazard to vehicles. The pothole is approximately 2 feet wide and 6 inches deep.',
          status: 'in_review',
          assigned_agency_id: agencyId
        },
        {
          title: 'Broken Street Light',
          description: 'Street light #45 on Elm Street has been out for over a week. This creates a safety concern, especially for pedestrians walking at night. The area is quite dark and visibility is poor.',
          status: 'pending',
          assigned_agency_id: null
        },
        {
          title: 'Water Leak in Park',
          description: 'There is a significant water leak from a broken pipe in Central Park near the playground. Water has been pooling for several days and the area is becoming muddy and unsafe. The leak appears to be coming from a main water line.',
          status: 'resolved',
          assigned_agency_id: agencyId
        }
      ];

      const complaintsToCreate = 3 - complaintCount;
      const createdComplaintIds = [];

      for (let i = 0; i < complaintsToCreate && i < sampleComplaints.length; i++) {
        const complaint = sampleComplaints[i];
        const [result] = await db.execute(
          'INSERT INTO complaints (user_id, title, description, status, assigned_agency_id) VALUES (?, ?, ?, ?, ?)',
          [userId, complaint.title, complaint.description, complaint.status, complaint.assigned_agency_id]
        );
        createdComplaintIds.push(result.insertId);
        console.log(`✓ Created complaint: ${complaint.title}`);
      }

      // Create sample updates for the complaints
      if (createdComplaintIds.length > 0) {
        const updates = [
          {
            complaint_id: createdComplaintIds[0],
            update_type: 'status_change',
            old_value: 'pending',
            new_value: 'in_review',
            message: 'Complaint has been assigned to Road Maintenance Department and is now under review.'
          },
          {
            complaint_id: createdComplaintIds[0],
            update_type: 'assignment',
            old_value: null,
            new_value: agencyId ? 'Agency Assigned' : null,
            message: agencyId ? 'Complaint has been assigned to an agency for investigation.' : 'Complaint is being reviewed.'
          },
          {
            complaint_id: createdComplaintIds[2],
            update_type: 'status_change',
            old_value: 'in_review',
            new_value: 'resolved',
            message: 'Issue has been resolved. Water leak has been fixed and the area has been cleaned up.'
          }
        ];

        for (const update of updates) {
          if (update.complaint_id && createdComplaintIds.includes(update.complaint_id)) {
            await db.execute(
              'INSERT INTO complaint_updates (complaint_id, user_id, update_type, old_value, new_value, message) VALUES (?, ?, ?, ?, ?, ?)',
              [update.complaint_id, null, update.update_type, update.old_value, update.new_value, update.message]
            );
          }
        }
        console.log('✓ Created sample complaint updates');
      }
    }

    console.log('✓ Sample complaints setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up sample complaints:', error);
    process.exit(1);
  }
}

setupSampleComplaints();

