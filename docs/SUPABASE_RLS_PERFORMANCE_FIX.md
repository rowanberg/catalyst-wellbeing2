# Supabase RLS Performance Optimization Guide

## Issue Summary
**79 RLS policies** across 45 tables are experiencing performance issues due to inefficient auth function calls. These policies re-evaluate `auth.uid()` for every row instead of once per query, causing significant performance degradation at scale.

## Root Cause
The policies use direct function calls like:
```sql
auth.uid() = user_id
```

Instead of optimized subquery format:
```sql
(SELECT auth.uid()) = user_id
```

## Impact
- **Performance**: Each row triggers a separate auth function evaluation
- **Scale**: Query time increases linearly with row count
- **Cost**: Higher database CPU usage and slower response times

## Affected Tables (45 total)
### Critical Tables (High Usage)
1. **profiles** - 2 policies
2. **assessments** - 9 policies
3. **assessment_grades** - 11 policies
4. **help_requests** - 9 policies
5. **school_classes** - 2 policies
6. **student_wallets** - 1 policy
7. **wellbeing_assessments** - 3 policies
8. **analytics_events** - 2 policies
9. **user_sessions** - 2 policies

### Wellbeing & Activity Tables
10. **courage_log** - 2 policies
11. **gratitude_entries** - 2 policies
12. **daily_quests** - 1 policy
13. **mindfulness_sessions** - 1 policy
14. **breathing_sessions** - 2 policies
15. **habit_tracker** - 1 policy
16. **kindness_counter** - 1 policy

### Communication Tables
17. **school_announcements** - 1 policy
18. **incident_reports** - 2 policies
19. **family_conversations** - 1 policy
20. **family_messages** - 3 policies
21. **office_hours_conversations** - 4 policies
22. **office_hours_messages** - 2 policies
23. **office_hours_notifications** - 1 policy

### Academic Tables
24. **grade_templates** - 2 policies
25. **offline_grade_sync** - 2 policies
26. **teacher_office_hours** - 3 policies
27. **parent_child_relationships** - 2 policies

### Achievement & Portfolio Tables
28. **student_achievements** - 1 policy
29. **event_registrations** - 1 policy
30. **portfolio_items** - 1 policy
31. **student_portfolios** - 1 policy
32. **game_sessions** - 1 policy

## Fix Pattern
### Before (Inefficient)
```sql
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (auth.uid() = user_id);
```

### After (Optimized)
```sql
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING ((SELECT auth.uid()) = user_id);
```

## Implementation Steps

### Step 1: Create Backup
```sql
-- Backup current policies before modification
pg_dump -h [host] -U [user] -d [database] --schema-only > rls_backup_$(date +%Y%m%d).sql
```

### Step 2: Generate Fix Scripts
Run the main migration script (see `fix_all_rls_policies.sql`)

### Step 3: Test in Staging
1. Apply fixes to staging environment
2. Run performance benchmarks
3. Verify functionality remains intact

### Step 4: Deploy to Production
1. Schedule maintenance window
2. Apply fixes in transaction blocks
3. Monitor performance metrics

## Performance Improvements Expected
- **Query Time**: 50-80% reduction for tables with >1000 rows
- **CPU Usage**: 30-50% reduction during peak loads
- **Scalability**: Linear to logarithmic complexity improvement

## Verification Queries
```sql
-- Check for remaining inefficient policies
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual LIKE '%auth.uid()%'
AND qual NOT LIKE '%(SELECT auth.uid())%';

-- Benchmark before/after
EXPLAIN ANALYZE
SELECT * FROM table_name
WHERE condition;
```

## Monitoring
After applying fixes, monitor:
1. Query performance (p95, p99 latencies)
2. Database CPU usage
3. Connection pool utilization
4. Error rates

## Rollback Plan
If issues occur:
```sql
-- Restore from backup
psql -h [host] -U [user] -d [database] < rls_backup_[date].sql
```

## Prevention
For future RLS policies:
1. Always use `(SELECT auth.uid())` pattern
2. Add linting rules to catch direct auth function calls
3. Include performance testing in deployment pipeline
4. Document best practices in team wiki

## References
- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Database Linter Rules](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan)
