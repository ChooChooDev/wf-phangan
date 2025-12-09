# StoreHub Member Registration System - Setup Guide

## Overview

This is a bilingual (Thai/English) member registration system for front desk staff using iPad. The system integrates with StoreHub API and uses NocoDB for data management.

## Features

- ✅ Bilingual UI (Thai/English with language toggle)
- ✅ Secure staff authentication via Supabase Auth
- ✅ iPad-optimized responsive design
- ✅ Multi-step registration form with validation
- ✅ Duplicate passport detection
- ✅ Automatic StoreHub API integration
- ✅ Real-time data viewing in NocoDB
- ✅ Manual retry/cancel controls for failed submissions
- ✅ Edit prevention after successful registration
- ✅ Comprehensive API logging
- ✅ Google Fonts Kanit for Thai support

## Prerequisites

- Node.js 18+ installed
- Supabase account with project created
- StoreHub API credentials
- NocoDB hosted instance (already available at https://nocodb-production-c63c.up.railway.app/)
- Vercel account for deployment

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# StoreHub API Configuration - Basic Auth Credentials
# Username and password for https://api.storehubhq.com/customers
STOREHUB_USERNAME=your_storehub_username
STOREHUB_PASSWORD=your_storehub_password
```

### How to Get Supabase Service Role Key:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Settings" (gear icon) → "API"
4. Copy the `service_role` key (keep it secret!)


## Step 3: Database Setup

The database migrations have already been applied to your Supabase instance. The following tables were created:

- `member_submissions` - Stores all member registration data
- `api_logs` - Tracks all StoreHub API requests and responses

**Verification:**
Go to Supabase Dashboard → Table Editor → You should see both tables listed.

## Step 4: Create First Admin User

Since we don't have a registration page, you need to manually create the first admin user in Supabase:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `your-admin@example.com`
   - Password: `your-secure-password`
   - Auto Confirm User: ✅ (checked)
4. Click "Create user"

**Important:** Save these credentials - you'll use them to log in to the app!

## Step 5: Connect NocoDB to Supabase

Your NocoDB instance is already hosted. Now connect it to the Supabase database:

1. Log in to NocoDB: https://nocodb-production-c63c.up.railway.app/
2. Click "Add New Base" → "Connect to External Database"
3. Select "PostgreSQL"
4. Enter Supabase connection details:

**Get your connection details from Supabase:**
- Go to Supabase Dashboard → Settings → Database
- Look for "Connection parameters" section

```
Host: db.0ec90b57d6e95fcbda19832f.supabase.co
Port: 5432
Database: postgres
Username: postgres
Password: [Your Supabase database password]
```

5. Click "Test Database Connection" → "Ok & Save Project"

### Recommended NocoDB Views:

Create these views for better data management:

**View 1: All Submissions**
- Table: `member_submissions`
- Show all columns
- Sort by: `created_at` (descending)

**View 2: Today's Registrations**
- Table: `member_submissions`
- Filter: `created_at` → `is within` → `today`
- Sort by: `created_at` (descending)

**View 3: Failed Submissions**
- Table: `member_submissions`
- Filter: `status` → `equals` → `storehub_failed`
- Sort by: `updated_at` (descending)

**View 4: Successful Registrations**
- Table: `member_submissions`
- Filter: `status` → `equals` → `success`
- Sort by: `storehub_synced_at` (descending)

**View 5: API Logs**
- Table: `api_logs`
- Show: `created_at`, `ref_id`, `request_type`, `success`, `response_status`, `duration_ms`
- Sort by: `created_at` (descending)

## Step 6: Local Development

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 7: Test the Application

1. **Login:** Go to http://localhost:3000 (automatically redirects to /login)
   - Use the admin credentials you created in Step 4

2. **Dashboard:** After login, you'll see:
   - Statistics (Total Members, Today's Registrations, Failed Submissions)
   - "New Registration" button
   - "View API Logs" button

3. **Register a Member:**
   - Click "New Registration"
   - Fill in the form:
     - Passport Number: TEST123456
     - First Name: John
     - Last Name: Doe
     - Date of Birth: Select a date (must be 20+ years old)
     - Nationality: Start typing "Thailand" and select from dropdown
   - Click "Next"
   - Review the information
   - Click "Confirm"

4. **Check Results:**
   - If successful: You'll see a success page with the Reference ID
   - If failed: You'll see an error page (member data is saved for manual retry)
   - View in NocoDB: Check the `member_submissions` table
   - View API Logs: Click "View API Logs" from dashboard

5. **Manage Failed Submissions:**
   - Click "Manage Failed" from dashboard
   - You'll see a list of all failed submissions
   - For each failed submission, you can:
     - **Retry**: Attempts to send to StoreHub again
     - **Cancel**: Marks the submission as cancelled (no further action)
   - After retry, check if it succeeds or fails again
   - View detailed error messages in the table

## Step 8: Deploy to Vercel

1. **Push code to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (copy all from `.env.local`)
   - Click "Deploy"

3. **Test Production:**
   - Open your Vercel URL
   - Test the complete flow
   - Test manual retry/cancel for failed submissions

## System Architecture

### Database Schema

**member_submissions:**
- `id` - Internal UUID
- `ref_id` - UUID v5 generated from passport (sent to StoreHub)
- `passport_number` - Normalized (uppercase, no spaces/hyphens)
- `first_name`, `last_name` - Member names
- `date_of_birth` - Member DOB
- `nationality` - English name (e.g., "Thailand")
- `status` - pending, confirmed, processing, success, storehub_failed, cancelled
- `storehub_synced_at` - When synced to StoreHub
- `storehub_error` - Last error message
- `retry_count` - Number of retry attempts
- `created_at`, `updated_at` - Timestamps
- `created_by` - Staff member who created

**api_logs:**
- `id` - Log entry ID
- `member_submission_id` - Link to submission
- `ref_id` - StoreHub reference ID
- `request_type` - 'create' or 'retry'
- `request_body` - Full request sent to StoreHub
- `response_status` - HTTP status code
- `response_body` - Full response from StoreHub
- `success` - Boolean
- `error_message` - Error if failed
- `duration_ms` - Request duration
- `created_at` - Timestamp

### API Routes

- `/api/storehub/create` - Create member in StoreHub
- `/api/storehub/manual-retry` - Manually retry a failed submission
- `/api/storehub/cancel` - Cancel a failed submission

### Pages

- `/login` - Staff login
- `/dashboard` - Main dashboard with statistics
- `/register` - Multi-step registration form
- `/register/success` - Success page
- `/register/error` - Error page
- `/failed` - Manage failed submissions (retry or cancel)
- `/logs` - API logs viewer

## Troubleshooting

### Issue: Cannot log in
**Solution:** Verify you created the admin user in Supabase Auth with "Auto Confirm User" checked.

### Issue: Duplicate passport error
**Solution:** The system prevents duplicate registrations. Check NocoDB to see existing member.

### Issue: StoreHub API error
**Solution:**
1. Verify StoreHub credentials in `.env.local` (STOREHUB_USERNAME and STOREHUB_PASSWORD)
2. Check API logs for detailed error message
3. Test credentials with curl:
```bash
curl -X POST https://api.storehubhq.com/customers \
  -u "your_username:your_password" \
  -H "Content-Type: application/json" \
  -d '{"refId":"test-uuid","firstName":"Test","lastName":"User","address1":"ABC123","state":"Thailand","birthday":"1990-01-01","tags":["wf-phangan"]}'
```

### Issue: NocoDB not showing data
**Solution:**
1. Verify NocoDB is connected to correct Supabase database
2. Check that tables `member_submissions` and `api_logs` exist
3. Verify connection credentials

### Issue: Language not switching
**Solution:** Language preference is stored in cookies. Clear browser cookies and try again.

### Issue: Date validation error
**Solution:** Member must be at least 20 years old. The date picker limits selection to valid dates.

## Security Notes

- ✅ All API credentials stored as environment variables (never in code)
- ✅ Service role key used only on server (never exposed to client)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Authentication required for all protected routes
- ✅ Passport numbers normalized and stored consistently
- ✅ Cron job authenticated with secret token

## Support

For issues:
1. Check API logs in `/logs` page
2. Check Supabase logs in Dashboard → Logs
3. Check NocoDB for data integrity
4. Review error messages in console

## License

Proprietary - All rights reserved
