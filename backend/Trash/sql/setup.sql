-- ============================================
-- CitizenVoice Database Setup Script
-- ============================================
-- Run this script in phpMyAdmin or MySQL command line
-- Make sure XAMPP MySQL is running before executing

-- Create database
CREATE DATABASE IF NOT EXISTS citizenvoice;
USE citizenvoice;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('citizen','admin','agency') DEFAULT 'citizen',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: agencies
-- ============================================
CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: complaints
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('pending','in_review','resolved') DEFAULT 'pending',
  assigned_agency_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_agency_id) REFERENCES agencies(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_assigned_agency_id (assigned_agency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample agencies
INSERT INTO agencies (name, email) VALUES
('Water Department', 'water@city.gov'),
('Electricity Department', 'electricity@city.gov'),
('Sanitation Department', 'sanitation@city.gov'),
('Road Maintenance', 'roads@city.gov')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (fullname, email, password, role) VALUES
('Admin User', 'admin@citizenvoice.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Note: The password hash above is a placeholder.
-- In production, use the actual bcrypt hash from registration.

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify the setup:

-- SELECT * FROM users;
-- SELECT * FROM agencies;
-- SELECT * FROM complaints;
-- SHOW TABLES;

