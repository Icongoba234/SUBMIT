const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setupForumTables() {
  console.log('🔄 Setting up forum tables...');
  try {
    // Create tables directly
    console.log('Creating forum_discussions table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forum_discussions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category ENUM('infrastructure', 'safety', 'environment', 'community', 'general') DEFAULT 'general',
        is_featured BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        votes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_category (category),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id),
        INDEX idx_is_featured (is_featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ forum_discussions table created');

    console.log('Creating forum_comments table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discussion_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        parent_comment_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (discussion_id) REFERENCES forum_discussions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
        INDEX idx_discussion_id (discussion_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ forum_comments table created');

    console.log('Creating forum_votes table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS forum_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discussion_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_vote (discussion_id, user_id),
        FOREIGN KEY (discussion_id) REFERENCES forum_discussions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_discussion_id (discussion_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ forum_votes table created');

    // Insert sample data
    console.log('Inserting sample discussions...');
    const [existingDiscussions] = await db.execute('SELECT COUNT(*) as count FROM forum_discussions');
    if (existingDiscussions[0].count === 0) {
      // Get first citizen user
      const [users] = await db.execute("SELECT id FROM users WHERE role = 'citizen' LIMIT 1");
      if (users.length > 0) {
        const userId = users[0].id;
        
        await db.execute(`
          INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          'Community Solution for Main Street Pothole Crisis',
          'After multiple reports about the dangerous potholes on Main Street, let\'s collaborate on a comprehensive solution. I\'ve researched similar issues in other cities and found some innovative approaches we could propose to the city council.',
          'infrastructure',
          true,
          156,
          47
        ]);

        await db.execute(`
          INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          'Organizing Neighborhood Watch for Oak Avenue',
          'With the recent streetlight outages on Oak Avenue, several neighbors have expressed interest in starting a neighborhood watch program. Let\'s discuss how we can coordinate with local police and create a safer environment for everyone.',
          'safety',
          false,
          89,
          32
        ]);

        await db.execute(`
          INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          'Central Park Renovation: Community Input Needed',
          'The city has approved budget for Central Park renovation! They\'re asking for community input on what improvements we\'d like to see. Let\'s compile our suggestions and present them as a unified community voice.',
          'environment',
          false,
          203,
          64
        ]);

        // Insert sample comments
        const [discussions] = await db.execute('SELECT id FROM forum_discussions ORDER BY id');
        if (discussions.length > 0) {
          await db.execute(`
            INSERT INTO forum_comments (discussion_id, user_id, content)
            VALUES (?, ?, ?)
          `, [
            discussions[0].id,
            userId,
            'Great initiative! I\'ve been dealing with these potholes for months. Count me in for any community action.'
          ]);

          if (discussions.length > 1) {
            await db.execute(`
              INSERT INTO forum_comments (discussion_id, user_id, content)
              VALUES (?, ?, ?)
            `, [
              discussions[1].id,
              userId,
              'I can help coordinate with the police department. Let me know when you want to schedule a meeting.'
            ]);
          }

          if (discussions.length > 2) {
            await db.execute(`
              INSERT INTO forum_comments (discussion_id, user_id, content)
              VALUES (?, ?, ?)
            `, [
              discussions[2].id,
              userId,
              'I think we should prioritize playground equipment and walking paths. What do others think?'
            ]);
          }
        }

        console.log('✓ Sample data inserted');
      } else {
        console.log('⚠ No citizen users found, skipping sample data');
      }
    } else {
      console.log('✓ Sample discussions already exist');
    }

    console.log('✅ Forum tables setup complete!');
  } catch (error) {
    console.error('❌ Error during forum tables setup:', error);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
  } finally {
    if (db.end) {
      db.end();
    }
  }
}

setupForumTables();

