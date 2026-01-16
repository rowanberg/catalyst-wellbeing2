# Developer Portal - Quick Start Guide

## 🚀 Get Running in 10 Minutes

### Step 1: Create Second Supabase Project (2 min)

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it: `catalystwells-developers`
4. Choose same region as main project
5. Set a strong database password
6. Wait for project to initialize

### Step 2: Run Database Migration (1 min)

1. In your new Supabase project, go to **SQL Editor**
2. Copy contents of `/developer/database/schema.sql`
3. Paste and click **Run**
4. Verify tables created in **Table Editor**

### Step 3: Configure Environment (2 min)

1. In developer folder, copy `.env.example` to `.env.local`:
```bash
cd developer
cp .env.example .env.local
```

2. Get your Supabase credentials:

**Developer Portal Project**:
- Go to Settings → API
- Copy `Project URL` → `NEXT_PUBLIC_DEV_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY`
- Copy `service_role` key → `DEV_SUPABASE_SERVICE_ROLE_KEY`

**Main CatalystWells Project**:
- Go to your main project → Settings → API
- Copy `Project URL` → `NEXT_PUBLIC_MAIN_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_MAIN_SUPABASE_ANON_KEY`
- Copy `service_role` key → `MAIN_SUPABASE_SERVICE_ROLE_KEY`

3. Generate secrets:
```bash
# JWT Secret (32+ chars)
JWT_SECRET=$(openssl rand -hex 32)

# Encryption Key (32+ chars)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# API Key Salt (16+ chars)
API_KEY_SALT=$(openssl rand -hex 16)
```

4. Update `.env.local` with all values

### Step 4: Install Dependencies (2 min)

```bash
cd developer
npm install
```

### Step 5: Start Development Server (1 min)

```bash
npm run dev
```

Visit: http://localhost:4000

### Step 6: Enable GitHub OAuth (Optional, 2 min)

1. In Developer Portal Supabase:
   - Go to **Authentication** → **Providers**
   - Enable **GitHub**
   - Add your GitHub OAuth app credentials

2. Create GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - New OAuth App
   - Homepage URL: `http://localhost:4000`
   - Callback URL: `https://[your-dev-project].supabase.co/auth/v1/callback`

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Landing page loads at http://localhost:4000
- [ ] Login page accessible at http://localhost:4000/login
- [ ] Can register new account (if registration page built)
- [ ] Database tables visible in Supabase Table Editor
- [ ] No console errors in browser
- [ ] Environment variables loaded correctly

---

## 🧪 Test the System

### Test 1: Create Developer Account

1. Go to http://localhost:4000/login
2. Click "Sign up"
3. Create account with email/password
4. Check Supabase → Table Editor → `developer_accounts`
5. Verify account created

### Test 2: Verify Database Connection

Open browser console and run:
```javascript
// Test developer portal connection
const { data, error } = await devSupabase
    .from('developer_accounts')
    .select('*')
    .limit(1)

console.log('Developer DB:', data, error)
```

### Test 3: Verify Main DB Connection

```javascript
// Test main CatalystWells connection
const { data, error } = await mainSupabase
    .from('oauth_applications')
    .select('*')
    .limit(1)

console.log('Main DB:', data, error)
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Cause**: Supabase URL or keys incorrect

**Fix**:
1. Double-check `.env.local` values
2. Ensure no trailing slashes in URLs
3. Verify keys are from correct project
4. Restart dev server: `npm run dev`

### Error: "relation does not exist"

**Cause**: Database migration not run

**Fix**:
1. Go to Supabase SQL Editor
2. Run `schema.sql` again
3. Check for any SQL errors

### Error: "Invalid API key"

**Cause**: Using wrong Supabase project keys

**Fix**:
1. Verify you're using **developer portal** keys for dev database
2. Verify you're using **main project** keys for main database
3. Don't mix them up!

### GitHub OAuth Not Working

**Fix**:
1. Check callback URL matches exactly
2. Verify GitHub app is not suspended
3. Check Supabase Auth settings
4. Clear browser cookies and try again

---

## 📝 Next Steps

Once running:

1. **Build Registration Page** (`/register/page.tsx`)
2. **Build Dashboard** (`/dashboard/page.tsx`)
3. **Create API Routes** (`/api/applications/route.ts`)
4. **Test End-to-End** OAuth flow
5. **Deploy to Production** (Vercel)

---

## 🎯 Quick Commands

```bash
# Start developer portal
cd developer && npm run dev

# Start main CatalystWells (in another terminal)
cd .. && npm run dev

# Install new package
npm install package-name

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

---

## 📞 Need Help?

- **Database Issues**: Check Supabase logs in dashboard
- **Auth Issues**: Check Supabase Auth logs
- **Build Errors**: Run `npm run type-check`
- **Runtime Errors**: Check browser console

---

## 🎉 Success!

If you see the landing page with no errors, you're ready to build!

**Next**: Start building the dashboard pages and API routes.

---

**Estimated Setup Time**: 10 minutes  
**Difficulty**: Easy  
**Prerequisites**: Node.js 18+, Supabase account
