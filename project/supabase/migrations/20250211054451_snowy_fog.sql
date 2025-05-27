/*
  # Add equipment images and enhanced specifications

  1. Changes
    - Add image_url column to equipment table
    - Add detailed_specs column for structured specifications
    - Add manufacturer and model columns
    
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS detailed_specs JSONB DEFAULT '{
  "dimensions": null,
  "weight": null,
  "power_requirements": null,
  "calibration_interval": null,
  "safety_requirements": null,
  "operating_conditions": null
}'::jsonb;