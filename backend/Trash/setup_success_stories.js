const db = require('./db');

async function setupSuccessStories() {
  console.log('🔄 Setting up success stories table...');
  try {
    // Create table
    console.log('Creating success_stories table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS success_stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        author_name VARCHAR(100) NOT NULL,
        author_role VARCHAR(100) NULL,
        author_avatar VARCHAR(255) NULL,
        testimonial TEXT NOT NULL,
        complaint_id INT NULL,
        resolution_days INT NULL,
        before_image VARCHAR(255) NULL,
        after_image VARCHAR(255) NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL,
        INDEX idx_is_featured (is_featured),
        INDEX idx_display_order (display_order),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ success_stories table created');

    // Insert sample data
    console.log('Inserting sample success stories...');
    const [existingStories] = await db.execute('SELECT COUNT(*) as count FROM success_stories');
    if (existingStories[0].count === 0) {
      // Get first citizen user to link to a success story
      const [users] = await db.execute("SELECT id, fullname, email FROM users WHERE role = 'citizen' LIMIT 1");
      let userId = null;
      let userFullname = 'Sarah Kamara';
      
      if (users.length > 0) {
        userId = users[0].id;
        userFullname = users[0].fullname || 'Sarah Kamara';
        console.log(`✓ Linking first success story to real user: ${userFullname} (ID: ${userId})`);
      } else {
        console.log('⚠ No citizen users found, creating success story without user link');
      }

      // First story - linked to real user if available
      await db.execute(`
        INSERT INTO success_stories (user_id, author_name, author_role, testimonial, resolution_days, is_featured, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        userFullname,
        'Downtown Resident',
        'I reported a broken water main that was flooding our street. Within 48 hours, the city responded and had it fixed. CitizenVoice made it so easy to get help!',
        2,
        true,
        1
      ]);

      // Second story - no user link (sample data)
      await db.execute(`
        INSERT INTO success_stories (author_name, author_role, testimonial, resolution_days, is_featured, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'Michael Kargbo',
        'Community Advocate',
        'The transparency features helped our neighborhood organize around a park renovation. We could see other similar requests and work together for a better outcome.',
        14,
        true,
        2
      ]);

      // Third story - no user link (sample data)
      await db.execute(`
        INSERT INTO success_stories (author_name, author_role, testimonial, resolution_days, is_featured, display_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'Aminata Sesay',
        'Local Business Owner',
        'The streetlight outage near my shop was fixed within a week after I reported it. The tracking feature kept me informed every step of the way!',
        7,
        false,
        3
      ]);

      console.log('✓ Sample success stories inserted');
      if (userId) {
        console.log(`✓ First story linked to real user: ${userFullname}`);
      }
    } else {
      console.log(`✓ Already have ${existingStories[0].count} success stories, skipping sample data creation.`);
      
      // Check if any story is linked to a user, if not, link the first one
      const [storiesWithoutUser] = await db.execute('SELECT id FROM success_stories WHERE user_id IS NULL LIMIT 1');
      if (storiesWithoutUser.length > 0) {
        const [users] = await db.execute("SELECT id, fullname FROM users WHERE role = 'citizen' LIMIT 1");
        if (users.length > 0) {
          await db.execute('UPDATE success_stories SET user_id = ?, author_name = ? WHERE id = ?', [
            users[0].id,
            users[0].fullname || 'Citizen',
            storiesWithoutUser[0].id
          ]);
          console.log(`✓ Linked success story ${storiesWithoutUser[0].id} to real user: ${users[0].fullname}`);
        }
      }
    }

    console.log('✅ Success stories setup complete!');
  } catch (error) {
    console.error('❌ Error during success stories setup:', error);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
  } finally {
    if (db.end) {
      db.end();
    }
  }
}

setupSuccessStories();

