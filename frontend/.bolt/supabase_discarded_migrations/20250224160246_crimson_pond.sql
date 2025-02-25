/*
  # Add Admin Panel Support

  1. Changes
    - Adds admin flag to profiles table
    - Adds company management fields
    - Adds user role management

  2. Security
    - Adds RLS policies for admin access
    - Ensures proper access control
*/

-- Add admin flag to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add company_id to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Create company_admins table for managing company-level admins
CREATE TABLE IF NOT EXISTS company_admins (
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Super admins can manage all companies"
  ON companies
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Company admins can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_admins
      WHERE company_admins.company_id = companies.id
      AND company_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage company admins"
  ON company_admins
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_company_id_idx ON profiles(company_id);
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);

-- Insert test admin user if not exists
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@taskgenie.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"System Admin"}',
  now(),
  now(),
  'authenticated'
) ON CONFLICT DO NOTHING;

-- Set admin profile
INSERT INTO profiles (
  id,
  is_admin,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  true,
  now()
) ON CONFLICT (id) DO UPDATE
SET is_admin = true;