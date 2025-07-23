-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS group_registrations CASCADE;
DROP VIEW IF EXISTS registration_view CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_group_id() CASCADE;
DROP FUNCTION IF EXISTS generate_delegate_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create function to generate random Group IDs
CREATE OR REPLACE FUNCTION generate_group_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'GRP_' || LEFT(MD5(random()::text), 8);
END;
$$ LANGUAGE plpgsql;

-- Create function to generate random Delegate IDs  
CREATE OR REPLACE FUNCTION generate_delegate_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'DEL_' || LEFT(MD5(random()::text), 8);
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create group_registrations table
CREATE TABLE group_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id TEXT UNIQUE NOT NULL DEFAULT generate_group_id(),
    group_name TEXT NOT NULL DEFAULT 'Spandan Team',
    total_amount DECIMAL(10,2) NOT NULL,
    member_count INTEGER NOT NULL CHECK (member_count >= 1 AND member_count <= 12),
    payment_transaction_id TEXT NOT NULL,
    payment_screenshot_path TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create group_members table
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegate_user_id TEXT UNIQUE NOT NULL DEFAULT generate_delegate_id(),
    group_id TEXT NOT NULL REFERENCES group_registrations(group_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    college TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_location TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('tier1', 'tier2', 'tier3')),
    tier_amount DECIMAL(10,2) NOT NULL,
    member_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, member_order),
    UNIQUE(email)
);

-- Create updated_at triggers
CREATE TRIGGER update_group_registrations_updated_at
    BEFORE UPDATE ON group_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
    BEFORE UPDATE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create registration view for admin dashboard
CREATE VIEW registration_view AS
SELECT 
    gr.group_id,
    gr.group_name,
    gm.delegate_user_id,
    gm.name as leader_name,
    gm.email as leader_email,
    gm.phone as leader_phone,
    gm.college,
    gm.college_location,
    gm.tier,
    gm.tier_amount,
    gr.member_count as members_count,
    gr.total_amount,
    gr.payment_transaction_id,
    gr.registration_status as status,
    gr.rejection_reason,
    gr.created_at,
    gr.updated_at
FROM group_registrations gr
JOIN group_members gm ON gr.group_id = gm.group_id
WHERE gm.member_order = 1;  -- Only show the first member (team leader) for each group

-- Create indexes for better performance
CREATE INDEX idx_group_registrations_group_id ON group_registrations(group_id);
CREATE INDEX idx_group_registrations_status ON group_registrations(registration_status);
CREATE INDEX idx_group_registrations_created_at ON group_registrations(created_at);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_email ON group_members(email);
CREATE INDEX idx_group_members_delegate_id ON group_members(delegate_user_id);

-- Enable Row Level Security
ALTER TABLE group_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for group_registrations
CREATE POLICY "Allow public read access to group_registrations" ON group_registrations
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert to group_registrations" ON group_registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to group_registrations" ON group_registrations
    FOR UPDATE USING (true);

-- Create RLS policies for group_members
CREATE POLICY "Allow public read access to group_members" ON group_members
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert to group_members" ON group_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to group_members" ON group_members
    FOR UPDATE USING (true);

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO group_registrations (group_name, total_amount, member_count, payment_transaction_id, payment_screenshot_path, contact_name, contact_email, contact_phone)
-- VALUES ('Test Team 1', 2000.00, 2, 'TXN123456', 'payment-screenshots/test.jpg', 'John Doe', 'john@example.com', '+91-9876543210');

-- INSERT INTO group_members (group_id, name, email, college, phone, college_location, tier, tier_amount, member_order)
-- SELECT group_id, 'John Doe', 'john@example.com', 'Test College', '+91-9876543210', 'Mumbai', 'tier1', 1000.00, 1
-- FROM group_registrations WHERE contact_email = 'john@example.com';

-- INSERT INTO group_members (group_id, name, email, college, phone, college_location, tier, tier_amount, member_order)  
-- SELECT group_id, 'Jane Smith', 'jane@example.com', 'Test College 2', '+91-9876543211', 'Delhi', 'tier1', 1000.00, 2
-- FROM group_registrations WHERE contact_email = 'john@example.com';

-- Grant necessary permissions
GRANT ALL ON group_registrations TO postgres, anon, authenticated;
GRANT ALL ON group_members TO postgres, anon, authenticated;
GRANT SELECT ON registration_view TO postgres, anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
