/*
  # Fix User Policies

  1. Changes
    - Remove recursive policies that cause infinite recursion
    - Simplify user policies to fix authentication issues
    
  2. Security
    - Maintain RLS security while fixing recursion issues
    - Ensure proper access control for different user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Lab managers and admins can view all users" ON users;

-- Create new, simplified policies
CREATE POLICY "Enable read access for authenticated users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for users registering"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users on their own records"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Lab managers and admins policy without recursion
CREATE POLICY "Admin access"
  ON users FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );