-- ============================================
-- Complaint Updates Table for Real-time Tracking
-- ============================================
-- This table tracks status changes and updates for complaints

USE citizenvoice;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample update data (3 records)
-- Note: These will only insert if complaints with IDs 1, 2, 3 exist
-- Adjust the complaint_id values based on your actual complaint data

INSERT INTO complaint_updates (complaint_id, user_id, update_type, old_value, new_value, message) VALUES
(1, NULL, 'status_change', 'pending', 'in_review', 'Complaint has been assigned to Water Department and is now under review.'),
(2, NULL, 'assignment', NULL, 'Electricity Department', 'Complaint has been assigned to Electricity Department for investigation.'),
(3, NULL, 'status_change', 'in_review', 'resolved', 'Issue has been resolved. Water supply has been restored to the area.')
ON DUPLICATE KEY UPDATE message=message;

