/*
  # Add Equipment Maintenance and Categories Management

  1. New Tables
    - `equipment_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `maintenance_schedules`
      - `id` (uuid, primary key)
      - `equipment_id` (uuid, references equipment)
      - `scheduled_date` (timestamp)
      - `type` (text) - type of maintenance
      - `description` (text)
      - `status` (text) - scheduled, in_progress, completed, cancelled
      - `technician_notes` (text)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for lab managers and admins
*/

-- Create equipment_categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create maintenance_schedules table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  technician_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are viewable by all authenticated users"
  ON equipment_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories can be managed by lab managers and admins"
  ON equipment_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Maintenance schedules policies
CREATE POLICY "Maintenance schedules are viewable by all authenticated users"
  ON maintenance_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Maintenance schedules can be managed by lab managers and admins"
  ON maintenance_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance_schedules(scheduled_date);