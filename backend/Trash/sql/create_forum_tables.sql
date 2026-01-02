-- ============================================
-- Forum Tables for Community Forum
-- ============================================
-- This script creates tables for forum discussions, comments, and statistics

USE citizenvoice;

-- Forum Discussions Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forum Comments Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Forum Votes Table (for upvoting discussions)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample discussions (at most 3) - only if table is empty
INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
SELECT 
  u.id,
  'Community Solution for Main Street Pothole Crisis',
  'After multiple reports about the dangerous potholes on Main Street, let''s collaborate on a comprehensive solution. I''ve researched similar issues in other cities and found some innovative approaches we could propose to the city council.',
  'infrastructure',
  TRUE,
  156,
  47
FROM users u
WHERE u.role = 'citizen'
AND NOT EXISTS (SELECT 1 FROM forum_discussions WHERE title = 'Community Solution for Main Street Pothole Crisis')
LIMIT 1;

INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
SELECT 
  u.id,
  'Organizing Neighborhood Watch for Oak Avenue',
  'With the recent streetlight outages on Oak Avenue, several neighbors have expressed interest in starting a neighborhood watch program. Let''s discuss how we can coordinate with local police and create a safer environment for everyone.',
  'safety',
  FALSE,
  89,
  32
FROM users u
WHERE u.role = 'citizen'
AND NOT EXISTS (SELECT 1 FROM forum_discussions WHERE title = 'Organizing Neighborhood Watch for Oak Avenue')
LIMIT 1;

INSERT INTO forum_discussions (user_id, title, content, category, is_featured, views, votes) 
SELECT 
  u.id,
  'Central Park Renovation: Community Input Needed',
  'The city has approved budget for Central Park renovation! They''re asking for community input on what improvements we''d like to see. Let''s compile our suggestions and present them as a unified community voice.',
  'environment',
  FALSE,
  203,
  64
FROM users u
WHERE u.role = 'citizen'
AND NOT EXISTS (SELECT 1 FROM forum_discussions WHERE title = 'Central Park Renovation: Community Input Needed')
LIMIT 1;

-- Insert sample comments for discussions
INSERT INTO forum_comments (discussion_id, user_id, content)
SELECT 
  fd.id,
  u.id,
  'Great initiative! I''ve been dealing with these potholes for months. Count me in for any community action.'
FROM forum_discussions fd
CROSS JOIN users u
WHERE u.role = 'citizen'
AND fd.title LIKE '%Main Street%'
AND NOT EXISTS (
  SELECT 1 FROM forum_comments fc 
  WHERE fc.discussion_id = fd.id 
  AND fc.user_id = u.id 
  AND fc.content LIKE '%Great initiative%'
)
LIMIT 1;

INSERT INTO forum_comments (discussion_id, user_id, content)
SELECT 
  fd.id,
  u.id,
  'I can help coordinate with the police department. Let me know when you want to schedule a meeting.'
FROM forum_discussions fd
CROSS JOIN users u
WHERE u.role = 'citizen'
AND fd.title LIKE '%Neighborhood Watch%'
AND NOT EXISTS (
  SELECT 1 FROM forum_comments fc 
  WHERE fc.discussion_id = fd.id 
  AND fc.user_id = u.id 
  AND fc.content LIKE '%police department%'
)
LIMIT 1;

INSERT INTO forum_comments (discussion_id, user_id, content)
SELECT 
  fd.id,
  u.id,
  'I think we should prioritize playground equipment and walking paths. What do others think?'
FROM forum_discussions fd
CROSS JOIN users u
WHERE u.role = 'citizen'
AND fd.title LIKE '%Park Renovation%'
AND NOT EXISTS (
  SELECT 1 FROM forum_comments fc 
  WHERE fc.discussion_id = fd.id 
  AND fc.user_id = u.id 
  AND fc.content LIKE '%playground equipment%'
)
LIMIT 1;

