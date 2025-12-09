# Changes: Manual Retry/Cancel System

## Overview
This update removes automatic retry functionality and adds manual controls for staff to manage failed submissions. Staff can now retry or cancel failed submissions through a dedicated management page.

---

## What Changed

### ✅ Removed
1. **Automatic Cron Job** - No longer automatically retries failed submissions every hour
2. **CRON_SECRET environment variable** - No longer needed

### ✨ Added
1. **Manual Retry API** - `/api/storehub/manual-retry` - Staff can manually retry individual failed submissions
2. **Cancel API** - `/api/storehub/cancel` - Staff can cancel failed submissions
3. **Failed Submissions Page** - `/failed` - New page to view and manage all failed submissions
4. **Cancelled Status** - New database status for cancelled submissions
5. **Dashboard Link** - Added "Manage Failed" button on dashboard

---

## New Features

### 1. Failed Submissions Management Page (`/failed`)
- View all failed submissions in a table format
- See error messages, retry counts, and last update time
- Two action buttons for each submission:
  - **Retry**: Attempts to send to StoreHub again
  - **Cancel**: Marks submission as cancelled (no further action)

### 2. Manual Retry Functionality
- Staff can click "Retry" on any failed submission
- System attempts to send to StoreHub with current data
- If successful: Status changes to "success"
- If failed: Status remains "storehub_failed" with updated error message
- All attempts are logged in `api_logs` table

### 3. Cancel Functionality
- Staff can click "Cancel" on any failed submission
- Requires confirmation before proceeding
- Status changes to "cancelled"
- Cancelled submissions won't appear in failed submissions list
- Cannot be retried after cancellation

---

## Database Changes

### New Status: `cancelled`
The `member_submissions` table now supports a new status value:

**Valid statuses:**
- `pending` - Initial state
- `confirmed` - User confirmed on review page
- `processing` - Currently sending to StoreHub
- `success` - Successfully synced
- `storehub_failed` - Failed (can be retried or cancelled)
- `cancelled` - Manually cancelled by staff (final state)

**Migration file:** `supabase/migrations/20251128160000_add_cancelled_status.sql`

---

## API Endpoints

### New Endpoints

#### POST `/api/storehub/manual-retry`
Manually retry a failed submission.

**Request:**
```json
{
  "submissionId": "uuid-here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": { /* StoreHub response */ }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "StoreHub API error: 400",
  "details": "Error message from StoreHub"
}
```

#### POST `/api/storehub/cancel`
Cancel a failed submission.

**Request:**
```json
{
  "submissionId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission cancelled successfully"
}
```

### Deprecated Endpoints

#### `/api/storehub/retry` (DEPRECATED)
- No longer called automatically by cron job
- Kept for backward compatibility
- Can still be triggered manually if needed

---

## Setup Instructions

### 1. Apply Database Migration

Run the new migration to add support for `cancelled` status:

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/20251128160000_add_cancelled_status.sql`
4. Click "Run"

**Option B: Using Supabase CLI**
```bash
npx supabase db push
```

### 2. Update Environment Variables

Remove the `CRON_SECRET` variable from your `.env.local` file (no longer needed).

Your `.env.local` should now have:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# StoreHub API Configuration
STOREHUB_USERNAME=your_username
STOREHUB_PASSWORD=your_password
```

### 3. Update Vercel Configuration

If deploying to Vercel, the cron job has been removed from `vercel.json`. No action needed - just redeploy.

---

## Usage Guide

### For Staff Members

#### Managing Failed Submissions

1. **Access the Page**
   - Login to the app
   - From dashboard, click "Manage Failed" (red button)
   - You'll see a list of all failed submissions

2. **Retry a Failed Submission**
   - Find the submission in the table
   - Click the blue "Retry" button
   - Wait for processing (button shows "Processing...")
   - You'll get an alert:
     - Success: "Successfully sent to StoreHub!"
     - Failure: Error message explaining what went wrong
   - The list will automatically refresh

3. **Cancel a Failed Submission**
   - Find the submission in the table
   - Click the gray "Cancel" button
   - Confirm the action
   - The submission will be removed from the failed list
   - Status changes to "cancelled" (visible in logs/NocoDB)

#### Understanding the Table

**Columns:**
- **Ref ID**: StoreHub reference identifier
- **Name**: Member's full name
- **Passport**: Passport number
- **Attempts**: Number of times retry was attempted
- **Error**: Last error message from StoreHub
- **Last Updated**: When the last attempt was made
- **Actions**: Retry and Cancel buttons

---

## Workflow Changes

### Before (Automatic)
```
Registration → Failed → Auto-retry every hour → Success/Failed
```

### After (Manual)
```
Registration → Failed → Staff reviews → Manual Retry or Cancel
                                      ↓                    ↓
                                   Success/Failed      Cancelled
```

---

## Benefits

### ✅ Better Control
- Staff can review why submissions failed before retrying
- Can decide if a submission should be cancelled instead of retried
- No wasted API calls on permanently failed submissions

### ✅ Immediate Action
- Don't wait for cron job (could be up to 1 hour)
- Staff can retry immediately after reviewing error
- Faster resolution for customers

### ✅ Cleaner Data
- Failed submissions that can't be fixed are marked as "cancelled"
- Failed list only shows actionable items
- Better tracking of submission lifecycle

---

## Technical Details

### Security
- All endpoints use service role for database access
- Only authenticated staff can access failed submissions page
- RLS policies prevent unauthorized access

### Logging
- All manual retries are logged with `request_type: 'retry'`
- Original creator is preserved in retry logs
- Error messages are stored for debugging

### Error Handling
- User-friendly error messages in UI
- Detailed error logging for debugging
- Graceful handling of network failures

---

## Testing Checklist

- [ ] Apply database migration successfully
- [ ] Access `/failed` page while logged in
- [ ] View list of failed submissions
- [ ] Click "Retry" on a failed submission
- [ ] Verify retry appears in API logs
- [ ] Click "Cancel" on a failed submission
- [ ] Verify cancelled submission no longer shows in failed list
- [ ] Check NocoDB for updated statuses
- [ ] Verify dashboard shows correct failed count
- [ ] Test in both English and Thai languages

---

## Troubleshooting

### Issue: Can't see failed submissions
**Solution:** Make sure you've applied the database migrations and have authentication working.

### Issue: Retry button doesn't work
**Solution:**
1. Check browser console for errors
2. Verify StoreHub credentials in `.env.local`
3. Check API logs for detailed error message

### Issue: Database error when cancelling
**Solution:** Apply the new migration to add `cancelled` status support.

### Issue: Old cron job still running
**Solution:**
1. Redeploy to Vercel to update `vercel.json`
2. Or manually remove cron job from Vercel dashboard

---

## Files Changed

### Modified Files
- `vercel.json` - Removed cron job configuration
- `app/dashboard/page.tsx` - Added link to failed submissions page
- `app/api/storehub/retry/route.ts` - Added deprecation notice
- `SETUP.md` - Updated documentation

### New Files
- `app/api/storehub/manual-retry/route.ts` - Manual retry endpoint
- `app/api/storehub/cancel/route.ts` - Cancel endpoint
- `app/failed/page.tsx` - Failed submissions management page
- `supabase/migrations/20251128160000_add_cancelled_status.sql` - Database migration
- `CHANGES.md` - This file

---

## Support

For questions or issues with this update, check:
1. API logs at `/logs` for detailed error messages
2. Supabase dashboard for database status
3. Browser console for client-side errors
4. NocoDB for data verification

---

## Version History

- **v2.0.0** (2024-11-28) - Manual retry/cancel system
- **v1.0.0** (2024-11-28) - Initial release with automatic retries

