const db = require('./db');

async function setupForumComments() {
  console.log('🔄 Setting up forum comments/replies...');
  try {
    // Check if forum_comments table exists and has data
    const [existingComments] = await db.execute('SELECT COUNT(*) as count FROM forum_comments');
    
    if (existingComments[0].count === 0) {
      console.log('No comments found, creating sample comments and replies...');
      
      // Get first discussion
      const [discussions] = await db.execute('SELECT id FROM forum_discussions ORDER BY id LIMIT 1');
      if (discussions.length === 0) {
        console.log('⚠ No discussions found. Please create discussions first.');
        return;
      }

      const discussionId = discussions[0].id;

      // Get first citizen user
      const [users] = await db.execute("SELECT id FROM users WHERE role = 'citizen' LIMIT 3");
      if (users.length === 0) {
        console.log('⚠ No citizen users found. Please create users first.');
        return;
      }

      const userId1 = users[0].id;
      const userId2 = users.length > 1 ? users[1].id : userId1;
      const userId3 = users.length > 2 ? users[2].id : userId1;

      // Insert main comments (at most 3)
      const [comment1] = await db.execute(`
        INSERT INTO forum_comments (discussion_id, user_id, content)
        VALUES (?, ?, ?)
      `, [discussionId, userId1, 'Great initiative! I\'ve been dealing with these potholes for months. Count me in for any community action.']);

      const [comment2] = await db.execute(`
        INSERT INTO forum_comments (discussion_id, user_id, content)
        VALUES (?, ?, ?)
      `, [discussionId, userId2, 'I can help coordinate with the city council. Let me know when you want to schedule a meeting.']);

      // Insert replies to first comment
      await db.execute(`
        INSERT INTO forum_comments (discussion_id, user_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?)
      `, [discussionId, userId2, 'Same here! The potholes on my street are getting worse every day.', comment1.insertId]);

      await db.execute(`
        INSERT INTO forum_comments (discussion_id, user_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?)
      `, [discussionId, userId3, 'I agree, we need to take action together. Strength in numbers!', comment1.insertId]);

      // Insert reply to second comment
      await db.execute(`
        INSERT INTO forum_comments (discussion_id, user_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?)
      `, [discussionId, userId1, 'That would be great! I\'ll reach out to you soon.', comment2.insertId]);

      console.log('✓ Sample comments and replies created');
    } else {
      console.log(`✓ Already have ${existingComments[0].count} comments, skipping sample data creation.`);
    }

    console.log('✅ Forum comments setup complete!');
  } catch (error) {
    console.error('❌ Error during forum comments setup:', error);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200));
    }
  } finally {
    if (db.end) {
      db.end();
    }
  }
}

setupForumComments();

