-- ============================================
-- Success Stories Table for Homepage
-- ============================================
-- This script creates a table for success stories/testimonials

USE citizenvoice;

-- Success Stories Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample success stories (at most 3) - only if table is empty
INSERT INTO success_stories (author_name, author_role, testimonial, resolution_days, is_featured, display_order)
SELECT 
  'Sarah Kamara',
  'Downtown Resident',
  'I reported a broken water main that was flooding our street. Within 48 hours, the city responded and had it fixed. CitizenVoice made it so easy to get help!',
  2,
  TRUE,
  1
WHERE NOT EXISTS (SELECT 1 FROM success_stories WHERE author_name = 'Sarah Kamara');

INSERT INTO success_stories (author_name, author_role, testimonial, resolution_days, is_featured, display_order)
SELECT 
  'Michael Kargbo',
  'Community Advocate',
  'The transparency features helped our neighborhood organize around a park renovation. We could see other similar requests and work together for a better outcome.',
  14,
  TRUE,
  2
WHERE NOT EXISTS (SELECT 1 FROM success_stories WHERE author_name = 'Michael Kargbo');

INSERT INTO success_stories (author_name, author_role, testimonial, resolution_days, is_featured, display_order)
SELECT 
  'Aminata Sesay',
  'Local Business Owner',
  'The streetlight outage near my shop was fixed within a week after I reported it. The tracking feature kept me informed every step of the way!',
  7,
  FALSE,
  3
WHERE NOT EXISTS (SELECT 1 FROM success_stories WHERE author_name = 'Aminata Sesay');

