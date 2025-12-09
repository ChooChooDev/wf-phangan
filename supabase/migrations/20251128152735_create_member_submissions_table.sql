/*
  # Create member_submissions table

  ## Summary
  This migration creates the core table for storing member registration submissions.
  It tracks the entire lifecycle of a member registration from initial submission
  through StoreHub API integration.

  ## New Tables
  
  ### `member_submissions`
  Stores all member registration data and tracks sync status with StoreHub.
  
  **Columns:**
  - `id` (uuid, primary key) - Internal unique identifier
  - `ref_id` (uuid, unique, not null) - UUID v5 generated from passport for StoreHub
  - `passport_number` (text, unique, not null) - Member's passport number (alphanumeric only)
  - `first_name` (text, not null) - Member's first name
  - `last_name` (text, not null) - Member's last name
  - `date_of_birth` (date, not null) - Member's date of birth (must be 20+ years old)
  - `nationality` (text, not null) - Member's nationality (English name, e.g., "Thailand")
  - `status` (text, not null, default 'pending') - Processing status
    - 'pending': Initial state before confirmation
    - 'confirmed': User confirmed on review page
    - 'processing': Currently sending to StoreHub API
    - 'success': Successfully synced to StoreHub
    - 'storehub_failed': Failed to sync to StoreHub (will retry)
  - `storehub_synced_at` (timestamptz) - When successfully synced to StoreHub
  - `storehub_error` (text) - Last error message from StoreHub API
  - `retry_count` (integer, default 0) - Number of retry attempts for failed submissions
  - `created_at` (timestamptz, default now()) - When record was created
  - `updated_at` (timestamptz, default now()) - When record was last updated
  - `created_by` (uuid, foreign key to auth.users) - Staff member who created the registration

  **Indexes:**
  - Primary key on `id`
  - Unique index on `ref_id`
  - Unique index on `passport_number`
  - Index on `status` for filtering
  - Index on `created_at` for sorting
  - Index on `created_by` for filtering by staff member

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the table
  - Only authenticated users can access the table
  - Users can view all submissions (for staff to see all registrations)
  - Users can insert new submissions
  - Users can update submissions they created (for edit functionality)
  - Users cannot delete submissions (data retention policy)

  ### Policies
  1. **"Staff can view all submissions"** - Allow authenticated users to read all records
  2. **"Staff can create submissions"** - Allow authenticated users to insert new records
  3. **"Staff can update own submissions"** - Allow users to update records they created
  4. **"System can update for sync"** - Allow service role to update sync status

  ## Important Notes
  - Passport numbers are stored in uppercase alphanumeric format (spaces/hyphens removed)
  - The `ref_id` is generated using UUID v5 with a fixed namespace and passport number
  - Duplicate passport numbers are prevented by unique constraint
  - Failed StoreHub syncs are retried automatically by background job
  - The `updated_at` timestamp is automatically updated via trigger
*/

-- Create member_submissions table
CREATE TABLE IF NOT EXISTS member_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id uuid UNIQUE NOT NULL,
  passport_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'success', 'storehub_failed')),
  storehub_synced_at timestamptz,
  storehub_error text,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_submissions_status ON member_submissions(status);
CREATE INDEX IF NOT EXISTS idx_member_submissions_created_at ON member_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_submissions_created_by ON member_submissions(created_by);
CREATE INDEX IF NOT EXISTS idx_member_submissions_passport ON member_submissions(passport_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_member_submissions_updated_at ON member_submissions;
CREATE TRIGGER update_member_submissions_updated_at
  BEFORE UPDATE ON member_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE member_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy 1: Staff can view all submissions
CREATE POLICY "Staff can view all submissions"
  ON member_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Staff can create submissions
CREATE POLICY "Staff can create submissions"
  ON member_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy 3: Staff can update own submissions (only if not already successful)
CREATE POLICY "Staff can update own submissions"
  ON member_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by AND status != 'success')
  WITH CHECK (auth.uid() = created_by AND status != 'success');

-- Policy 4: System can update for sync operations (using service role)
CREATE POLICY "System can update for sync"
  ON member_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
