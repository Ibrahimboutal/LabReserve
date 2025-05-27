/*
  # Create lab table and establish equipment relationship

  1. New Tables
    - `lab`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `location` (text, not null)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())
  
  2. Changes
    - Add foreign key constraint from `equipment.lab_id` to `lab.id`
  
  3. Security
    - Enable RLS on `lab` table
    - Add policies for authenticated users to read lab data
*/

-- Create lab table if it doesn't exist
CREATE TABLE IF NOT EXISTS lab (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add some sample labs if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lab LIMIT 1) THEN
    INSERT INTO lab (name, location) VALUES
      ('Main Research Lab', 'Building A, Floor 2'),
      ('Chemistry Lab', 'Building B, Floor 1'),
      ('Physics Lab', 'Building C, Floor 3'),
      ('Biology Lab', 'Building D, Floor 1'),
      ('Engineering Lab', 'Building E, Floor 2');
  END IF;
END $$;

-- Check if lab_id column exists in equipment table, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment' AND column_name = 'lab_id'
  ) THEN
    ALTER TABLE equipment ADD COLUMN lab_id uuid REFERENCES lab(id);
  END IF;
END $$;

-- Update existing equipment to have a lab_id if they don't have one
DO $$
DECLARE
  first_lab_id uuid;
BEGIN
  -- Get the first lab id
  SELECT id INTO first_lab_id FROM lab ORDER BY created_at LIMIT 1;
  
  -- Update equipment without lab_id
  IF first_lab_id IS NOT NULL THEN
    UPDATE equipment SET lab_id = first_lab_id WHERE lab_id IS NULL;
  END IF;
END $$;

-- Enable RLS on lab table
ALTER TABLE lab ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read lab data
CREATE POLICY "Anyone can read labs"
  ON lab
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for admins to insert/update/delete labs
CREATE POLICY "Admins can manage labs"
  ON lab
  USING (auth.jwt() ->> 'role' = 'admin');