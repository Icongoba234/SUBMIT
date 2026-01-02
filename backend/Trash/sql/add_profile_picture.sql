-- ============================================
-- Migration: Add profile_picture to users table
-- ============================================

USE citizenvoice;

-- Add profile_picture column to users table
ALTER TABLE users 
ADD COLUMN profile_picture VARCHAR(255) NULL AFTER agency_id;

