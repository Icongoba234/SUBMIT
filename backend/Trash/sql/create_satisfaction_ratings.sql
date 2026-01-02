-- ============================================
-- Satisfaction Ratings Table
-- ============================================
-- This table stores citizen satisfaction ratings for resolved complaints

USE citizenvoice;

CREATE TABLE IF NOT EXISTS satisfaction_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rating (complaint_id, user_id),
  INDEX idx_complaint_id (complaint_id),
  INDEX idx_rating (rating),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample satisfaction ratings (at most 3)
INSERT INTO satisfaction_ratings (complaint_id, user_id, rating, comment) 
SELECT 
  c.id,
  c.user_id,
  CASE 
    WHEN c.id % 3 = 0 THEN 5
    WHEN c.id % 3 = 1 THEN 4
    ELSE 5
  END as rating,
  CASE 
    WHEN c.id % 3 = 0 THEN 'Excellent service, issue resolved quickly!'
    WHEN c.id % 3 = 1 THEN 'Good response time, satisfied with the outcome.'
    ELSE 'Very pleased with the resolution.'
  END as comment
FROM complaints c
WHERE c.status = 'resolved'
AND NOT EXISTS (
  SELECT 1 FROM satisfaction_ratings sr WHERE sr.complaint_id = c.id
)
LIMIT 3
ON DUPLICATE KEY UPDATE rating=rating;

