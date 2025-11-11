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
Copy `.env.example` to `.env.local` and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=your_supabase_edge_functions_url
```

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
