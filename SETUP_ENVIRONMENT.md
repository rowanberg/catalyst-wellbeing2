# 🔧 Fix 500 Internal Server Error - Environment Setup

## The Problem
You're seeing "Server error: Original endpoint failed: 500 Internal Server Error" because the Supabase environment variables are missing or contain placeholder values.

## Quick Fix

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)

### Step 2: Get Your Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

### Step 3: Create .env.local File
Create a file named `.env.local` in your catalyst folder with:

```bash
# Replace with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration
NEXTAUTH_SECRET=K8mN2pQ4rT6wY9zB3eF5hJ7kL0mP2sU4vX6zA8cE1gI3jL5nQ7tW9yB2eF4hK6m
NEXTAUTH_URL=http://localhost:3000

# Development Settings
NODE_ENV=development
```

### Step 4: Set Up Database
Run these SQL files in your Supabase SQL Editor (in order):
1. `database/schema.sql`
2. `database/additional_tables.sql`
3. `database/help_requests_update.sql`
4. `database/school_encryption_migration.sql`
5. `database/minimal_school_setup.sql`

### Step 5: Restart Server
```bash
npm run dev
```

## Verify It's Working
1. Go to `http://localhost:3000/admin/messaging`
2. Click on the **Analytics** tab
3. Click **Run Full Test** button
4. You should see database connection details instead of errors

## Still Having Issues?
- Check browser console for specific error messages
- Verify all environment variables are set correctly
- Ensure Supabase project is active and database is set up
