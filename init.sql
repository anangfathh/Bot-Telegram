-- ========================================
-- Telegram Bot Database Initialization
-- ========================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `mager_bot` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `mager_bot`;

-- ========================================
-- Users Table
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` BIGINT PRIMARY KEY,
  `username` VARCHAR(64) NULL,
  `first_name` VARCHAR(255) NULL,
  `last_name` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NULL,
  `last_seen_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_full_name` (`full_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- User Posts Table
-- ========================================
CREATE TABLE IF NOT EXISTS `user_posts` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `message_id` BIGINT NOT NULL,
  `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
  `closed_at` DATETIME NULL,
  `expires_at` DATETIME NULL,
  `last_edited_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_posts_user_id_timestamp` (`user_id`, `timestamp` DESC),
  INDEX `idx_user_posts_expires` (`is_closed`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- User Ratings Table
-- ========================================
CREATE TABLE IF NOT EXISTS `user_ratings` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `target_user_id` BIGINT NOT NULL,
  `rated_by_user_id` BIGINT NOT NULL,
  `score` TINYINT NOT NULL CHECK (`score` BETWEEN 1 AND 5),
  `comment` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_rating_pair` (`target_user_id`, `rated_by_user_id`),
  INDEX `idx_user_ratings_target` (`target_user_id`),
  CONSTRAINT `fk_rating_target` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rating_author` FOREIGN KEY (`rated_by_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Drivers Table
-- ========================================
CREATE TABLE IF NOT EXISTS `drivers` (
  `user_id` BIGINT PRIMARY KEY,
  `username` VARCHAR(64) NULL,
  `full_name` VARCHAR(255) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `joined_at` DATETIME NOT NULL,
  `expires_at` DATETIME NULL,
  `last_payment_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_drivers_status_expires` (`status`, `expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Initial Data (Optional)
-- ========================================
-- You can add sample data here if needed
