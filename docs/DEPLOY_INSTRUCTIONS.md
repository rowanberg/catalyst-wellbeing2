# 🚀 Catalyst Deployment Instructions

## Quick Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
cd c:\projects\kids\catalyst
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/catalyst-school-wellbeing.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your `catalyst-school-wellbeing` repository
4. Framework: **Next.js** (auto-detected)
5. Build Command: `npm run build`
6. Output Directory: `out`

### Step 3: Set Environment Variables in Vercel
In your Vercel project dashboard, go to Settings > Environment Variables and add:

```
NEXTAUTH_SECRET=K8mN2pQ4rT6wY9zB3eF5hJ7kL0mP2sU4vX6zA8cE1gI3jL5nQ7tW9yB2eF4hK6m
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NODE_ENV=production
```

### Step 4: Deploy
Click "Deploy" and your app will be live at `https://your-app-name.vercel.app`

## Alternative: Deploy to Netlify

### Option A: Drag & Drop
1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag the `out` folder to Netlify
4. Set environment variables in Site Settings

### Option B: Git Integration
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `out`
4. Set environment variables

## Before Deployment Checklist

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Run database schema files in Supabase SQL Editor:
  - `database/schema.sql`
  - `database/additional_tables.sql` 
  - `database/help_requests_update.sql`
  - `database/school_encryption_migration.sql`
  - `database/minimal_school_setup.sql`
- [ ] Get Supabase credentials from Settings > API
- [ ] Update NEXTAUTH_URL with your actual domain

## Post-Deployment Steps

1. Visit your deployed app
2. Register first admin user at `/register`
3. Update user role to 'admin' in Supabase profiles table
4. Create school record in schools table
5. Test admin messaging functionality

## Troubleshooting

**Build Errors:**
- Ensure Node.js 18+ is installed
- Check all imports are correct
- Verify environment variables

**Runtime Errors:**
- Check browser console for specific errors
- Verify Supabase credentials are correct
- Ensure database schema is properly set up

**Need Help?**
Check the browser console and network tab for specific error messages.
