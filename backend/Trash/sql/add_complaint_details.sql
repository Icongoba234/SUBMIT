-- ============================================
-- Add Complaint Details Columns
-- ============================================
-- This script adds columns to store all complaint details

USE citizenvoice;

-- Add additional fields to complaints table
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS category VARCHAR(100) NULL AFTER description,
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' AFTER category,
ADD COLUMN IF NOT EXISTS location VARCHAR(500) NULL AFTER priority,
ADD COLUMN IF NOT EXISTS affected_area VARCHAR(100) NULL AFTER location,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50) UNIQUE NULL AFTER id,
ADD INDEX idx_tracking_number (tracking_number),
ADD INDEX idx_category (category),
ADD INDEX idx_priority (priority);

-- Create complaint_files table for storing images/files
CREATE TABLE IF NOT EXISTS complaint_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
  INDEX idx_complaint_id (complaint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generate tracking numbers for existing complaints
UPDATE complaints 
SET tracking_number = CONCAT('CV-2025-', LPAD(id, 6, '0'))
WHERE tracking_number IS NULL;

