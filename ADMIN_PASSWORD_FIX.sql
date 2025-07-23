-- Fix admin user password in database
-- Ensure the admin user exists with the correct plain text password

-- Update or insert the admin user with plain text password
INSERT INTO admin_users (email, name, password_hash, is_active) 
VALUES ('admin@spandan2025.com', 'Admin User', 'admin123', true)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = 'admin123',
  is_active = true,
  name = 'Admin User';

-- Verify the admin user exists
SELECT email, name, password_hash, is_active 
FROM admin_users 
WHERE email = 'admin@spandan2025.com';

SELECT 'Admin user password fixed!' AS message;
