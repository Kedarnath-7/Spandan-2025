-- Create the database schema for Spandan 2025 group registration system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table (for simple admin authentication)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table (for storing event information)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('Cultural', 'Sports', 'Fine Arts', 'Literary', 'Academic')),
    info_points TEXT[], -- Array of bullet points
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    venue VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group registrations table (main registration record)
CREATE TABLE IF NOT EXISTS group_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id VARCHAR(50) UNIQUE NOT NULL, -- Generated ID like GRP-TIER-A1B2C3
    
    -- Group totals
    total_amount INTEGER NOT NULL,
    member_count INTEGER NOT NULL CHECK (member_count >= 1 AND member_count <= 12),
    
    -- Payment information
    payment_transaction_id VARCHAR(255) NOT NULL,
    payment_screenshot_path VARCHAR(500),
    
    -- Registration status and management
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Admin review information
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Contact person (first member details)
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table (individual member data)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id VARCHAR(50) REFERENCES group_registrations(group_id) ON DELETE CASCADE,
    delegate_user_id VARCHAR(50) UNIQUE NOT NULL, -- Generated ID like USER-COPR-A1B2C3
    
    -- Member personal information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    college VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    college_location VARCHAR(255),
    
    -- Tier selection (individual per member)
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('Collectors Print', 'Deluxe Edition', 'Issue #1')),
    tier_amount INTEGER NOT NULL CHECK (tier_amount IN (375, 650, 850)),
    
    -- Order in group
    member_order INTEGER NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_registrations_group_id ON group_registrations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_registrations_contact_email ON group_registrations(contact_email);
CREATE INDEX IF NOT EXISTS idx_group_registrations_status ON group_registrations(status);
CREATE INDEX IF NOT EXISTS idx_group_registrations_created_at ON group_registrations(created_at);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_email ON group_members(email);
CREATE INDEX IF NOT EXISTS idx_group_members_delegate_user_id ON group_members(delegate_user_id);

-- Create a view for easy registration overview (combining group and member data)
CREATE OR REPLACE VIEW registration_view AS
SELECT 
    gr.group_id,
    gm.delegate_user_id,
    gm.name,
    gm.email,
    gm.college,
    gm.phone,
    gm.college_location,
    gm.tier,
    gm.tier_amount,
    gr.member_count,
    gr.total_amount AS group_total_amount,
    gr.payment_transaction_id,
    gr.status AS registration_status,
    gr.created_at::date AS submitted_date,
    gr.created_at,
    CASE 
        WHEN gr.status = 'approved' THEN 'approved'
        WHEN gr.status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END AS review_status,
    gr.reviewed_at,
    gr.reviewed_by,
    gr.rejection_reason,
    gr.total_amount
FROM group_registrations gr
JOIN group_members gm ON gr.group_id = gm.group_id
ORDER BY gr.created_at DESC, gm.member_order ASC;

-- Function to generate group ID
CREATE OR REPLACE FUNCTION generate_group_id()
RETURNS TEXT AS $$
DECLARE
    random_suffix TEXT;
BEGIN
    -- Generate a random 6-character alphanumeric suffix
    random_suffix := UPPER(
        substring(
            encode(gen_random_bytes(4), 'base64')
            from 1 for 6
        )
    );
    -- Remove any non-alphanumeric characters
    random_suffix := regexp_replace(random_suffix, '[^A-Z0-9]', '', 'g');
    -- Ensure it's exactly 6 characters, pad with random letters if needed
    WHILE length(random_suffix) < 6 LOOP
        random_suffix := random_suffix || chr(65 + floor(random() * 26)::int);
    END LOOP;
    random_suffix := substring(random_suffix from 1 for 6);
    
    RETURN 'GRP-' || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to generate delegate user ID
CREATE OR REPLACE FUNCTION generate_delegate_id(tier_name TEXT)
RETURNS TEXT AS $$
DECLARE
    tier_code TEXT;
    random_suffix TEXT;
BEGIN
    -- Map tier names to codes
    tier_code := CASE 
        WHEN tier_name = 'Collectors Print' THEN 'COPR'
        WHEN tier_name = 'Deluxe Edition' THEN 'DELX'
        WHEN tier_name = 'Issue #1' THEN 'ISS1'
        ELSE 'UNKN'
    END;
    
    -- Generate a random 6-character alphanumeric suffix
    random_suffix := UPPER(
        substring(
            encode(gen_random_bytes(4), 'base64')
            from 1 for 6
        )
    );
    -- Remove any non-alphanumeric characters
    random_suffix := regexp_replace(random_suffix, '[^A-Z0-9]', '', 'g');
    -- Ensure it's exactly 6 characters, pad with random letters if needed
    WHILE length(random_suffix) < 6 LOOP
        random_suffix := random_suffix || chr(65 + floor(random() * 26)::int);
    END LOOP;
    random_suffix := substring(random_suffix from 1 for 6);
    
    RETURN 'USER-' || tier_code || '-' || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate group_id before insert
CREATE OR REPLACE FUNCTION set_group_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.group_id IS NULL OR NEW.group_id = '' THEN
        NEW.group_id := generate_group_id();
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM group_registrations WHERE group_id = NEW.group_id) LOOP
            NEW.group_id := generate_group_id();
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_group_id
    BEFORE INSERT ON group_registrations
    FOR EACH ROW
    EXECUTE FUNCTION set_group_id();

-- Trigger to auto-generate delegate_user_id before insert
CREATE OR REPLACE FUNCTION set_delegate_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delegate_user_id IS NULL OR NEW.delegate_user_id = '' THEN
        NEW.delegate_user_id := generate_delegate_id(NEW.tier);
        -- Ensure uniqueness
        WHILE EXISTS (SELECT 1 FROM group_members WHERE delegate_user_id = NEW.delegate_user_id) LOOP
            NEW.delegate_user_id := generate_delegate_id(NEW.tier);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_delegate_id
    BEFORE INSERT ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION set_delegate_id();

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (email, name, password_hash) 
VALUES ('admin@spandan2025.com', 'Admin User', 'admin123')
ON CONFLICT (email) DO NOTHING;

-- Insert sample events
INSERT INTO events (name, description, category, info_points, is_active) VALUES
('Dance Competition', 'Showcase your dancing skills in various dance forms', 'Cultural', 
 ARRAY['Solo and group categories', 'Multiple dance forms allowed', 'Professional judging panel', 'Cash prizes for winners'], true),
('Singing Competition', 'Solo and group singing performances', 'Cultural',
 ARRAY['Classical and modern categories', 'Instrumental allowed', 'Live band support', 'Recording opportunities'], true),
('Basketball Tournament', 'Inter-college basketball championship', 'Sports',
 ARRAY['5v5 format', 'Knockout rounds', 'Professional referees', 'Trophies and medals'], true),
('Art Exhibition', 'Display your artistic creations', 'Fine Arts',
 ARRAY['Painting and sculpture', 'Digital art welcome', 'Live art sessions', 'Expert critique sessions'], true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to registration tables
CREATE POLICY "Enable insert for all users" ON group_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read for all users" ON events FOR SELECT USING (is_active = true);

-- Create policies for admin access
CREATE POLICY "Enable all for admin users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Enable read for all users" ON group_registrations FOR SELECT USING (true);
CREATE POLICY "Enable read for all users" ON group_members FOR SELECT USING (true);
CREATE POLICY "Enable update for service role" ON group_registrations FOR UPDATE USING (true);
CREATE POLICY "Enable update for service role" ON group_members FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
