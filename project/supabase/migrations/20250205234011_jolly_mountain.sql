/*
  # Initial Schema Setup for LabReserve

  1. New Tables
    - users (extends auth.users)
      - department
      - role
    - equipment
      - Basic equipment information
      - Status tracking
      - Maintenance schedule
    - reservations
      - Booking details
      - Status management
    - waitlist
      - Queue management for popular equipment

  2. Security
    - RLS policies for each table
    - Role-based access control
*/

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'lab_manager', 'admin')),
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lab_id UUID NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{"last_maintenance": null, "next_maintenance": null}',
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'out_of_order')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  desired_date DATE NOT NULL,
  desired_duration INTERVAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'fulfilled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Lab managers and admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Equipment policies
CREATE POLICY "Anyone can view operational equipment"
  ON equipment
  FOR SELECT
  USING (status = 'operational');

CREATE POLICY "Lab managers and admins can manage equipment"
  ON equipment
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Reservations policies
CREATE POLICY "Users can view their own reservations"
  ON reservations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

CREATE POLICY "Users can cancel their own reservations"
  ON reservations
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    status != 'cancelled' AND
    start_time > now() + INTERVAL '24 hours'
  )
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Lab managers and admins can manage all reservations"
  ON reservations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Waitlist policies
CREATE POLICY "Users can view their own waitlist entries"
  ON waitlist
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add themselves to waitlists"
  ON waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lab managers and admins can manage waitlists"
  ON waitlist
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('lab_manager', 'admin')
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment_id ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_equipment_id ON waitlist(equipment_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);