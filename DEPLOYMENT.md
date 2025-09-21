# Catalyst Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set environment variables (see below)
5. Deploy

### Option 2: Netlify
1. Build the application: `npm run build`
2. Deploy the `out` folder to Netlify
3. Set environment variables in Netlify dashboard

## Required Environment Variables for Production

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=K8mN2pQ4rT6wY9zB3eF5hJ7kL0mP2sU4vX6zA8cE1gI3jL5nQ7tW9yB2eF4hK6m
NEXTAUTH_URL=https://your-domain.vercel.app

# Supabase Configuration (Replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Production Settings
NODE_ENV=production
```

## Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed (run SQL files in Supabase)
- [ ] Environment variables configured
- [ ] Build process tested locally
- [ ] Domain configured (if custom domain)

## Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test production build locally
npm start
```

## Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run these SQL files in order in Supabase SQL Editor:
   - `database/schema.sql`
   - `database/additional_tables.sql`
   - `database/help_requests_update.sql`
   - `database/school_encryption_migration.sql`
   - `database/minimal_school_setup.sql`

## Post-Deployment Steps

1. Create admin user account
2. Set up school data
3. Test all functionality
4. Configure custom domain (optional)

## Troubleshooting

- **Build fails**: Check Node.js version (requires 18+)
- **Database errors**: Verify Supabase credentials
- **Auth issues**: Check NEXTAUTH_URL matches deployment URL
- **API errors**: Verify all environment variables are set
