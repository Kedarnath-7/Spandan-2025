-- Create admin_emails table for managing admin users
CREATE TABLE IF NOT EXISTS admin_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin email (replace with actual admin email)
INSERT INTO admin_emails (email, name, is_active) 
VALUES ('admin@spandan.com', 'Admin User', true)
ON CONFLICT (email) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_emails_updated_at
    BEFORE UPDATE ON admin_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
