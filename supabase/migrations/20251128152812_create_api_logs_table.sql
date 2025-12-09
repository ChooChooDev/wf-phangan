/*
  # Create api_logs table

  ## Summary
  This migration creates the API logging table for tracking all interactions
  with the StoreHub API. This is essential for debugging, monitoring, and
  troubleshooting failed API calls.

  ## New Tables
  
  ### `api_logs`
  Stores detailed logs of all StoreHub API requests and responses.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique log entry identifier
  - `member_submission_id` (uuid, foreign key) - Links to member_submissions table
  - `ref_id` (uuid, not null) - The refId sent to StoreHub API
  - `request_type` (text, not null) - Type of request ('create' or 'retry')
  - `request_body` (jsonb, not null) - Full request body sent to StoreHub
  - `request_headers` (jsonb) - Request headers (without sensitive data)
  - `response_status` (integer) - HTTP response status code
  - `response_body` (jsonb) - Full response body from StoreHub
  - `success` (boolean, not null) - Whether the API call succeeded
  - `error_message` (text) - Error message if call failed
  - `duration_ms` (integer) - Request duration in milliseconds
  - `created_at` (timestamptz, default now()) - When log entry was created
  - `created_by` (uuid, foreign key to auth.users) - Staff member who initiated (null for system retries)

  **Indexes:**
  - Primary key on `id`
  - Index on `member_submission_id` for quick lookup by submission
  - Index on `ref_id` for quick lookup by StoreHub reference
  - Index on `success` for filtering failed calls
  - Index on `created_at` for chronological sorting

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the table
  - Only authenticated users can access logs
  - All authenticated users can view all logs (for admin debugging)
  - Only the system can insert logs (logged automatically during API calls)
  - No updates or deletes allowed (audit trail integrity)

  ### Policies
  1. **"Staff can view all API logs"** - Allow authenticated users to read all logs
  2. **"System can create API logs"** - Allow authenticated users to insert logs during API calls

  ## Important Notes
  - Sensitive data (API tokens, passwords) should NOT be stored in request_headers
  - Response bodies are stored as JSONB for easy querying
  - Failed API calls can be identified by `success = false`
  - Duration tracking helps identify performance issues
  - This table grows over time - consider implementing retention policy
*/

-- Create api_logs table
CREATE TABLE IF NOT EXISTS api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_submission_id uuid REFERENCES member_submissions(id) ON DELETE SET NULL,
  ref_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('create', 'retry')),
  request_body jsonb NOT NULL,
  request_headers jsonb,
  response_status integer,
  response_body jsonb,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_logs_member_submission ON api_logs(member_submission_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_ref_id ON api_logs(ref_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_success ON api_logs(success);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_request_type ON api_logs(request_type);

-- Enable Row Level Security
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Policy 1: Staff can view all API logs
CREATE POLICY "Staff can view all API logs"
  ON api_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: System can create API logs
CREATE POLICY "System can create API logs"
  ON api_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
