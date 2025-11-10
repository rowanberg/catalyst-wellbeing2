# Feature Removal Checklist
## Grade Analytics, Digital Portfolio, Achievement Center, School Events Hub

This document provides a complete checklist for removing deprecated features from the Catalyst Wells platform.

---

## ✅ **Step 1: Update UI (COMPLETED)**
- [x] Removed "Grade Analytics" from messaging tools
- [x] Removed "School Events Hub" from messaging tools  
- [x] Removed "Achievement Center" from messaging tools
- [x] Removed "Digital Portfolio" from messaging tools

**File Modified:**
- `src/app/(dashboard)/student/messaging/page.tsx`

---

## 📋 **Step 2: Delete Page Folders**

### Student Dashboard Pages to Delete:
```
src/app/(dashboard)/student/achievement-center/
src/app/(dashboard)/student/digital-portfolio/
src/app/(dashboard)/student/school-events/
src/app/(dashboard)/student/grade-analytics/ (if exists)
```

**Command (PowerShell):**
```powershell
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\(dashboard)\student\achievement-center"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\(dashboard)\student\digital-portfolio"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\(dashboard)\student\school-events"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\(dashboard)\student\grade-analytics"
```

---

## 🔌 **Step 3: Delete API Routes**

### API Folders to Delete:
```
src/app/api/achievements/
src/app/api/achievements/milestones/
src/app/api/v2/student/achievements/
src/app/api/digital-portfolio/
src/app/api/school-events/
src/app/api/school-events/my-events/
src/app/api/school-events/register/
src/app/api/student/calendar-events/ (if only used by events)
```

**Command (PowerShell):**
```powershell
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\api\achievements"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\api\v2\student\achievements"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\api\digital-portfolio"
Remove-Item -Recurse -Force "c:\projects\kids\catalyst\src\app\api\school-events"
```

---

## 🗄️ **Step 4: Run Database Cleanup**

### Option A: Run All-in-One Script (Recommended)
```sql
-- In Supabase SQL Editor, run:
-- File: database/migrations/remove_all_deprecated_features.sql
```

### Option B: Run Individual Scripts
```sql
-- Run in this order:
1. database/migrations/remove_achievement_tables.sql
2. database/migrations/remove_school_events_tables.sql
3. database/migrations/remove_digital_portfolio_tables.sql
4. database/migrations/remove_grade_analytics_tables.sql
```

**SQL Files Created:**
- ✅ `remove_achievement_tables.sql` - Drops 4 tables
- ✅ `remove_school_events_tables.sql` - Drops 5 tables  
- ✅ `remove_digital_portfolio_tables.sql` - Drops 10+ tables
- ✅ `remove_grade_analytics_tables.sql` - Drops 10+ tables
- ✅ `remove_all_deprecated_features.sql` - Master cleanup script

---

## 📊 **Database Tables Being Removed**

### Achievement Center (4 tables):
- `student_achievements`
- `student_achievement_stats`
- `achievement_templates`
- `achievement_milestones`

### School Events Hub (5 tables):
- `school_events`
- `event_registrations`
- `event_participants`
- `event_attendance`
- `event_categories`

### Digital Portfolio (10+ tables):
- `student_portfolios` / `digital_portfolios`
- `portfolio_items` / `student_portfolio_items`
- `portfolio_collections` / `portfolio_albums`
- `portfolio_reactions` / `portfolio_likes`
- `portfolio_comments`
- `portfolio_item_tags`
- `portfolio_categories` / `portfolio_tags`

### Grade Analytics (10+ tables):
- `grade_analytics` / `student_performance_analytics`
- `subject_analytics` / `subject_performance_analytics`
- `grade_trends` / `performance_trends`
- `grade_benchmarks` / `class_performance_benchmarks`
- `grade_predictions` / `performance_predictions`
- `analytics_snapshots` / `performance_snapshots`

**Total: ~30+ tables, ~8+ functions, ~6+ views**

---

## ⚠️ **Important Notes**

1. **Backup First**: Export all data from these tables before deletion
2. **No Rollback**: Once deleted, data cannot be recovered
3. **Core Tables Preserved**: Grade/assessment core tables remain untouched
4. **RLS Policies**: Automatically dropped with CASCADE
5. **Test Environment**: Run on test DB first if available

---

## 🔍 **Verification Steps**

After running all scripts, verify cleanup:

```sql
-- Check if tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%achievement%' OR
  table_name LIKE '%event%' OR
  table_name LIKE '%portfolio%' OR
  table_name LIKE '%analytics%'
);

-- Should return 0 rows for deleted features
```

---

## 🎯 **Success Criteria**

- [ ] All 4 tool sections removed from messaging page
- [ ] All student dashboard page folders deleted
- [ ] All API route folders deleted
- [ ] All database tables dropped successfully
- [ ] No broken links or 404 errors in app
- [ ] No console errors related to deleted features

---

## 📞 **Support**

If you encounter issues during removal:
1. Check Supabase logs for FK constraint errors
2. Use CASCADE option to force deletion
3. Review API routes for any remaining references
4. Search codebase for hardcoded feature references

**Files Created:**
- 5 SQL migration files in `database/migrations/`
- This checklist document
