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

### 3. Run Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

### 4. Build for Production (Optional)
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

### Deals not loading (404 errors)
If you see 404 errors when trying to load deals:
1. Make sure you've configured `.env.local` with your actual Supabase credentials
2. Restart the development server after updating `.env.local`:
   ```bash
   # Stop the server (Ctrl+C) then restart:
   npm run dev
   ```
3. Verify your Supabase project has the required database tables set up
4. Check browser console for any error messages

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
