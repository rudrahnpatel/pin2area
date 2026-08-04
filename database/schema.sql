-- ============================================================
-- Pin2Area - Bangalore Pincode Directory Database Schema
-- DBMS: MySQL 8.0+
-- Author: Rudra Patel
-- ============================================================

CREATE DATABASE IF NOT EXISTS pin2area_db;
USE pin2area_db;

-- 1. Main Pincodes Table
CREATE TABLE IF NOT EXISTS pincodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pincode VARCHAR(10) NOT NULL UNIQUE,
    area_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) DEFAULT 'Bengaluru Urban',
    state VARCHAR(100) DEFAULT 'Karnataka',
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pincode (pincode),
    INDEX idx_area_name (area_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Sub-localities & Post Offices Mapping Table
CREATE TABLE IF NOT EXISTS sub_localities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pincode_id INT NOT NULL,
    sub_area_name VARCHAR(150) NOT NULL,
    FOREIGN KEY (pincode_id) REFERENCES pincodes(id) ON DELETE CASCADE,
    INDEX idx_sub_area (sub_area_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. User Saved Bookmarks Table
CREATE TABLE IF NOT EXISTS saved_bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pincode) REFERENCES pincodes(pincode) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
