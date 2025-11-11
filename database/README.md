# Database Setup Guide

This folder contains the database schema and setup instructions for DohaDealsRadar.

## Quick Setup

### Step 1: Run the Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `schema.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)

### Step 2: Verify Tables Were Created

1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `deals`
   - `votes`
   - `reports`

### Step 3: (Optional) Add Test Data

If you want to test with sample data:
1. Open `schema.sql`
2. Uncomment the "SAMPLE DATA" section at the bottom
3. Run it in the SQL Editor

## Database Schema Overview

### Tables

#### **users**
Stores user account information
- `id` - Unique user identifier
- `email` - User's email (unique)
- `username` - Display name
- `role` - User role (user, moderator, admin)
- `auto_approve` - Whether user's deals are auto-approved

#### **deals**
Stores all deal submissions
- `id` - Unique deal identifier
- `title`, `description` - Deal information
- `image_url` - Deal image
- `link` - External link to deal
- `location` - Physical location in Doha
- `category` - Deal category (Food, Electronics, etc.)
- `promo_code` - Optional promo code
- `hot_votes`, `cold_votes` - Vote counts
- `user_id` - Creator of the deal
- `is_approved` - Moderation status
- `is_archived` - Archived status
- `expires_at` - When the deal expires

#### **votes**
Tracks user votes on deals
- `deal_id` - Reference to deal
- `device_id` - Unique device identifier
- `vote_type` - 'hot' or 'cold'
- One vote per device per deal (enforced by UNIQUE constraint)

#### **reports**
Tracks deal reports from users
- `deal_id` - Reference to reported deal
- `device_id` - Reporter's device ID
- `reason` - Report reason
- `note` - Additional notes

## Security

The schema includes Row Level Security (RLS) policies:
- Public can view approved, active deals
- Users can manage their own content
- Moderators have additional permissions

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the entire `schema.sql` file
- Verify tables appear in Table Editor

### Error: "permission denied"
- Check that RLS policies are set up correctly
- Ensure you're using the anon key for public access

### Need to Reset Database?
To start fresh:
1. Go to Table Editor
2. Delete each table individually
3. Run `schema.sql` again
