-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- e.g. 'approval_tier', 'approval_event', 'bulk_announcement'
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL, -- HTML content
  last_edited TIMESTAMP DEFAULT NOW(),
  UNIQUE(type)
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50), -- e.g. 'sent', 'failed'
  error TEXT
);
