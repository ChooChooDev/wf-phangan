/*
  # Add 'cancelled' status to member_submissions

  ## Summary
  This migration adds support for 'cancelled' status to the member_submissions table.
  This allows staff to manually mark failed submissions as cancelled instead of retrying them.

  ## Changes
  - Drop existing CHECK constraint on status column
  - Add new CHECK constraint that includes 'cancelled' status
  - The valid statuses are now:
    - 'pending': Initial state before confirmation
    - 'confirmed': User confirmed on review page
    - 'processing': Currently sending to StoreHub API
    - 'success': Successfully synced to StoreHub
    - 'storehub_failed': Failed to sync to StoreHub (staff can retry or cancel)
    - 'cancelled': Manually cancelled by staff (no further retries)

  ## Important Notes
  - Existing data is not affected
  - Only failed submissions can be cancelled
  - Cancelled submissions will not be included in retry logic
*/

-- Drop the existing CHECK constraint
ALTER TABLE member_submissions
DROP CONSTRAINT IF EXISTS member_submissions_status_check;

-- Add new CHECK constraint with 'cancelled' status
ALTER TABLE member_submissions
ADD CONSTRAINT member_submissions_status_check
CHECK (status IN ('pending', 'confirmed', 'processing', 'success', 'storehub_failed', 'cancelled'));

