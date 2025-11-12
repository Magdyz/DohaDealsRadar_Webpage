# DohaDealsRadar Web - Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

#### Step 2.1: Get Supabase Credentials
1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project (or use existing one)
3. Wait for the project to finish setting up
4. Go to Project Settings > API
5. Copy your:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys" → anon/public)

#### Step 2.2: Create .env.local file
A `.env.local` file has been created for you. Edit it with your Supabase credentials:

```bash
# Open .env.local and replace the placeholder values:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
NEXT_PUBLIC_API_BASE_URL=/api
```

**Important:**
- Replace `your-project-id` with your actual Supabase project ID
- Replace `your-actual-anon-key-here` with your actual anon key
- Keep `NEXT_PUBLIC_API_BASE_URL=/api` as is (uses Next.js API routes)
- **Note:** Use the Project URL (e.g., `https://abc123.supabase.co`), NOT the Edge Functions URL

### 3. Set Up Database Schema

**IMPORTANT:** You must set up the database before the app will work!

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `database/schema.sql` from this project
5. Copy the entire contents
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Verify tables were created:
   - Go to **Table Editor**
   - You should see: `users`, `deals`, `votes`, `reports`

📖 **Detailed instructions:** See `database/README.md`

### 3.5 Set Up Supabase Storage for Images

**REQUIRED FOR IMAGES TO WORK:** You must create a storage bucket for deal images!

1. Go to your Supabase Dashboard
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Create a bucket named `deals` (exactly this name)
5. **IMPORTANT:** Toggle **Public bucket** to ON
6. Click **Create bucket**

📖 **Detailed instructions:** See `STORAGE_SETUP.md`

**Without this step, images will not upload or display!**

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

### 5. Build for Production (Optional)
```bash
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # Reusable UI components
├── lib/             # Utilities and APIs
│   ├── api/         # API functions
│   ├── store/       # State management
│   ├── supabase/    # Supabase configuration
│   └── utils/       # Helper functions
├── types/           # TypeScript types
└── styles/          # Global styles
```

## Current Features (Phase 1)

✅ Next.js 16 with TypeScript & App Router
✅ Tailwind CSS with Material Design 3 theme
✅ Supabase integration setup
✅ Reusable UI components (Button, Card, Input, Badge, etc.)
✅ State management with Zustand
✅ Device ID system
✅ Complete API layer structure

## Next Steps

Phase 2 will implement:
- Authentication flow (email verification)
- User management
- Protected routes
- Account pages

## Troubleshooting

### Database not set up / "relation does not exist" error
**This is the most common issue!** If deals won't load or you see database errors:
1. Make sure you've run the `database/schema.sql` in Supabase SQL Editor
2. Verify tables exist: Go to Supabase → Table Editor → should see `users`, `deals`, `votes`, `reports`
3. If tables are missing, follow Step 3 in the setup guide above
4. See `database/README.md` for detailed database setup instructions

### Wrong Supabase URL format
Make sure you're using the **Project URL**, not the Edge Functions URL:
- ✅ **Correct:** `https://your-project-id.supabase.co`
- ❌ **Wrong:** `https://your-project-id.functions.supabase.co`
- ❌ **Wrong:** Trailing slash at the end

### Deals not loading (500 errors)
If you see 500 errors when trying to load deals:
1. **First**, verify the database is set up (see above)
2. Check that `.env.local` has the correct Project URL (not Edge Functions URL)
3. Make sure your anon key is complete (not cut off)
4. Restart the development server after updating `.env.local`:
   ```bash
   # Stop the server (Ctrl+C) then restart:
   npm run dev
   ```
5. Check browser console for detailed error messages

### Missing Supabase credentials error
If you see "Missing Supabase environment variables":
1. Ensure `.env.local` exists in the project root
2. Verify the file contains valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Restart the dev server after making changes

### Port already in use
If port 3000 is in use, you can specify a different port:
```bash
PORT=3001 npm run dev
```

### Build errors
Clear the cache and rebuild:
```bash
rm -rf .next
npm run build
```

### Module not found errors
Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```
