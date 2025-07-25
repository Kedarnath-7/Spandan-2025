-- Run this SQL script in your Supabase database to set up email functionality

-- Create email templates table if not exists
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  last_edited TIMESTAMP DEFAULT NOW(),
  UNIQUE(type)
);

-- Create email logs table if not exists
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50),
  error TEXT
);

-- Insert default templates (use this to set up initial templates)
-- You can run this script in your Supabase SQL editor
