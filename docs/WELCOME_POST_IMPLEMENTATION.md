# Universal Welcome Post - Implementation Guide

## Overview

The Universal Welcome Post is an automated, school-wide onboarding message that appears as the **first item** in every parent's School Community feed. This feature replaces the need for teachers to create individual welcome posts for each class.

---

## User Experience

### For Parents
- When navigating to the "School Community" tab, the **Welcome Post always appears first**
- Below the welcome post, regular teacher posts appear in chronological order
- The welcome post has a distinctive appearance:
  - **Gradient background** (blue-to-purple)
  - **"✨ WELCOME" badge** at the top
  - Professional welcome message and school branding

### For Teachers
- Completely automated - no action required
- Teachers never see the welcome post in their own feeds
- They continue creating regular posts as normal

---

## Architecture

### Backend Strategy
The system uses **two parallel database queries** for optimal performance:

1. **Query 1**: Fetch the school's welcome post
   ```sql
   SELECT * FROM community_posts 
   WHERE school_id = ? 
   AND is_school_welcome_post = true 
   LIMIT 1;
   ```

2. **Query 2**: Fetch regular teacher posts (paginated)
   ```sql
   SELECT * FROM community_posts 
   WHERE school_id = ? 
   AND is_school_welcome_post = false
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Response Assembly**: Welcome post is prepended to the array (page 1 only)

---

## Database Changes

### New Column
```sql
ALTER TABLE community_posts 
ADD COLUMN is_school_welcome_post BOOLEAN DEFAULT false;
```

### Indexes
```sql
-- Efficient welcome post lookup
CREATE INDEX idx_community_posts_welcome 
ON community_posts(school_id, is_school_welcome_post) 
WHERE is_school_welcome_post = true;

-- Ensure only one welcome post per school
CREATE UNIQUE INDEX idx_one_welcome_post_per_school
ON community_posts(school_id)
WHERE is_school_welcome_post = true;
```

---

## Files Modified

### 1. Database Migration
**File**: `database/migrations/add_school_welcome_post.sql`
- Adds `is_school_welcome_post` column
- Creates performance indexes
- Adds uniqueness constraint

### 2. Seed Script
**File**: `database/seed_school_welcome_post.sql`
- Creates welcome post for each school
- Can be run for single school or bulk across all schools
- Includes customizable content template

### 3. API Endpoint
**File**: `src/app/api/v1/parents/community-feed/route.ts`

**Changes**:
- Fetches student's `school_id`
- Executes two parallel queries (welcome post + regular posts)
- Prepends welcome post to response (page 1 only)
- Adds `isWelcomePost` flag to post objects

**New Response Format**:
```typescript
{
  posts: [
    { ...welcomePost, isWelcomePost: true },  // Only on page 1
    { ...regularPost1, isWelcomePost: false },
    { ...regularPost2, isWelcomePost: false }
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalCount: 42,
    totalPages: 5,
    hasWelcomePost: true  // New field
  }
}
```

### 4. Frontend Component
**File**: `src/components/parent/CommunityTab.tsx`

**Changes**:
- Added `isWelcomePost?: boolean` to `Post` interface
- Conditional styling for welcome posts:
  - Gradient background: `from-blue-50 via-indigo-50 to-purple-50`
  - Blue border: `border-blue-200`
  - Welcome badge: `"✨ WELCOME"` with gradient button

---

## Deployment Instructions

### Step 1: Run Database Migration
```bash
# Connect to your production database
psql -U your_user -d catalyst_db

# Run the migration
\i database/migrations/add_school_welcome_post.sql
```

### Step 2: Seed Welcome Posts

#### For a Single School
```sql
-- Edit the school_id in the script first
\i database/seed_school_welcome_post.sql
```

#### For All Schools (Bulk)
Uncomment the bulk seeding section in `seed_school_welcome_post.sql` and run it.

### Step 3: Deploy Code Changes
```bash
# Build and deploy your application
npm run build
# Deploy to production
```

### Step 4: Verify
1. Log in as a parent
2. Navigate to "School Community" tab
3. Confirm the welcome post appears first with special styling
4. Scroll down to see regular posts below it

---

## Customization

### Welcome Message Template
Edit the content in `seed_school_welcome_post.sql`:

```sql
content: E'Hello Parents, and welcome to your private School Community feed!

This is your direct window into your child''s classroom. Here, teachers will share updates, photos, videos, and a glimpse into the wonderful learning happening every day.

**How it works:**

✨ **A Positive Highlights Reel**: This is a one-way feed from the school to you.

❤️ **Emoji Reactions**: You can show your appreciation for posts by reacting with emojis. To keep the feed clear and positive, replies are disabled.

We''re excited for you to be a part of our connected community!'
```

### Welcome Image
Replace the placeholder image URL in the seed script:
```json
{
  "type": "image",
  "url": "https://your-school-image.com/welcome.jpg",
  "thumbnail": "https://your-school-image.com/welcome-thumb.jpg"
}
```

---

## Technical Notes

### Performance Optimization
- Welcome post query uses indexed lookup (`O(1)` complexity)
- Regular posts query excludes welcome post with `WHERE is_school_welcome_post = false`
- Welcome post only fetched on page 1 (not on subsequent pages)

### Data Integrity
- Unique constraint ensures only **one welcome post per school**
- If a school tries to create a second welcome post, database will reject it

### Edge Cases Handled
1. **School without welcome post**: Feed works normally, just shows regular posts
2. **Pagination**: Welcome post only appears on page 1
3. **Empty feed**: If no posts exist, shows empty state (no crash)

---

## Future Enhancements

1. **Admin Dashboard**: UI for school admins to edit welcome post content
2. **Multi-language Support**: Different welcome messages based on parent's language preference
3. **A/B Testing**: Test different welcome messages to optimize engagement
4. **Analytics**: Track welcome post view rates and reaction rates

---

## Support

For issues or questions:
- Check database logs for migration errors
- Verify `is_school_welcome_post` column exists: `\d community_posts`
- Confirm welcome post was created: `SELECT * FROM community_posts WHERE is_school_welcome_post = true;`
