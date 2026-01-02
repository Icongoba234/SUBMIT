-- ============================================
-- Migration: Add agency_id to users table
-- ============================================
-- This links agency users to their agency records

USE citizenvoice;

-- Add agency_id column to users table
ALTER TABLE users 
ADD COLUMN agency_id INT NULL AFTER role,
ADD FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL,
ADD INDEX idx_agency_id (agency_id);

-- Link existing agency users to agencies by email match
UPDATE users u
INNER JOIN agencies a ON u.email = a.email
SET u.agency_id = a.id
WHERE u.role = 'agency';

