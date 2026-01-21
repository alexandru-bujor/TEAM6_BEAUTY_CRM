-- Lume Database Schema
-- MySQL Database Schema for Salon Management Platform

-- Create Database
CREATE DATABASE IF NOT EXISTS lume_db;
USE lume_db;

-- Users Table (for both customers and salon owners)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type ENUM('customer', 'salon_owner', 'admin') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    location VARCHAR(255),
    date_of_birth DATE,
    bio TEXT,
    profile_image VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
);

-- Salons Table
CREATE TABLE IF NOT EXISTS salons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    salon_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    description TEXT,
    profile_image VARCHAR(500),
    cover_image VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    is_individual_stylist BOOLEAN DEFAULT FALSE,
    is_partner BOOLEAN DEFAULT FALSE,
    price_range ENUM('$', '$$', '$$$', '$$$$') DEFAULT '$$',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_city (city),
    INDEX idx_rating (rating)
);

-- Salon Categories (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS salon_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_category (category),
    UNIQUE KEY unique_salon_category (salon_id, category)
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

-- Employees/Staff Table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    salon_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    bio TEXT,
    image VARCHAR(500),
    rating DECIMAL(3,2) DEFAULT 0.00,
    experience INT DEFAULT 0 COMMENT 'Years of experience',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    INDEX idx_salon (salon_id),
    INDEX idx_is_active (is_active)
);

-- Employee Specialties (Many-to-Many)
CREATE TABLE IF NOT EXISTS employee_specialties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    UNIQUE KEY unique_employee_specialty (employee_id, specialty)
);

-- Employee Schedule
CREATE TABLE IF NOT EXISTS employee_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    UNIQUE KEY unique_employee_day (employee_id, day_of_week)
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    service_id INT NOT NULL,
    employee_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INT NOT NULL COMMENT 'Duration in minutes',
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_salon (salon_id),
    INDEX idx_date (appointment_date),
    INDEX idx_status (status)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    appointment_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_salon (salon_id),
    INDEX idx_customer (customer_id),
    UNIQUE KEY unique_appointment_review (appointment_id)
);

-- Customer Favorites
CREATE TABLE IF NOT EXISTS customer_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    salon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (customer_id, salon_id),
    INDEX idx_customer (customer_id)
);

-- Verification Codes (for email/phone verification)
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_code (code),
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);

-- User MFA (Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS user_mfa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    secret_encrypted TEXT NOT NULL,
    secret_iv VARCHAR(32) NOT NULL,
    secret_auth_tag VARCHAR(32) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_enabled (enabled)
);

-- Security Events Log (for monitoring suspicious activities)
CREATE TABLE IF NOT EXISTS security_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user (user_id),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created_at),
    INDEX idx_severity (severity)
);
