# Daily Topics System - Database Documentation

## Overview
The Daily Topics system allows teachers to record what they taught in each class on a daily basis. The system ensures **one topic per class per day** and automatically handles updates when a teacher changes the topic for the same day.

---

## Database Schema

### Table: `daily_topics`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `teacher_id` | UUID | NOT NULL, FK → auth.users(id) | Teacher who created the topic |
| `class_id` | UUID | NOT NULL, FK → classes(id) | Class the topic belongs to |
| `school_id` | UUID | NOT NULL, FK → schools(id) | School for filtering and RLS |
| `topic` | TEXT | NOT NULL, 3-1000 chars | The topic/lesson content |
| `topic_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Date the topic was taught |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | When first created |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

### Unique Constraint
```sql
CONSTRAINT unique_topic_per_class_per_day 
  UNIQUE (teacher_id, class_id, topic_date)
```

**This ensures:**
- Only ONE topic per class per day
- When a teacher saves a topic for a class on the same day, it **updates** the existing topic instead of creating a duplicate

---

## How It Works

### Day-Based Upsert Logic

1. **First Save (Insert)**
   ```
   Teacher saves: "Quadratic Equations" for Math Class on Nov 8, 2025
   → Creates new record with topic_date = 2025-11-08
   ```

2. **Same Day Update**
   ```
   Teacher changes to: "Quadratic Equations and Graphs" on same day
   → UPDATES existing record (no duplicate created)
   → updated_at timestamp changes
   → created_at stays the same
   ```

3. **Next Day (New Insert)**
   ```
   Teacher saves: "Linear Equations" for same class on Nov 9, 2025
   → Creates NEW record with topic_date = 2025-11-09
   → Previous day's topic remains unchanged
   ```

### API Behavior

**Endpoint:** `POST /api/teacher/daily-topics`

**Request:**
```json
{
  "class_id": "uuid-of-class",
  "topic": "Quadratic Equations",
  "topic_date": "2025-11-08" // Optional, defaults to today
}
```

**Response (New Topic):**
```json
{
  "success": true,
  "message": "Topic saved successfully",
  "topic": {
    "id": "uuid",
    "topic": "Quadratic Equations",
    "topic_date": "2025-11-08",
    "created_at": "2025-11-08T10:30:00Z",
    "updated_at": "2025-11-08T10:30:00Z"
  }
}
```

**Response (Updated Topic):**
```json
{
  "success": true,
  "message": "Topic saved successfully",
  "topic": {
    "id": "same-uuid",
    "topic": "Quadratic Equations and Graphs",
    "topic_date": "2025-11-08",
    "created_at": "2025-11-08T10:30:00Z",
    "updated_at": "2025-11-08T11:45:00Z"  // ← Changed!
  }
}
```

---

## Security (RLS Policies)

### SELECT Policy
```sql
-- Teachers can view their own topics
-- Admins can view all topics in their school
teacher_id = auth.uid() OR admin in same school
```

### INSERT Policy
```sql
-- Teacher must:
1. Be authenticated
2. Be assigned to the class
3. Belong to the school
```

### UPDATE/DELETE Policy
```sql
-- Only the teacher who created the topic can update/delete it
teacher_id = auth.uid()
```

---

## Indexes for Performance

```sql
-- Query by teacher and date (most common)
idx_daily_topics_teacher_date ON (teacher_id, topic_date DESC)

-- Query by class and date
idx_daily_topics_class_date ON (class_id, topic_date DESC)

-- Query by school and date (admin views)
idx_daily_topics_school_date ON (school_id, topic_date DESC)
```

---

## Automatic Cleanup

### Function: `cleanup_old_daily_topics()`

Deletes topics older than 30 days to keep the database clean.

**Usage:**
```sql
SELECT cleanup_old_daily_topics();
-- Returns: number of deleted records
```

**Schedule this function** (using pg_cron or external scheduler):
```sql
-- Example: Run daily at 2 AM
SELECT cron.schedule('cleanup-daily-topics', '0 2 * * *', $$
  SELECT cleanup_old_daily_topics()
$$);
```

---

## View: `daily_topics_with_details`

Pre-joined view for easier querying with class and teacher information.

**Columns:**
- All `daily_topics` columns
- `class_name`, `subject`, `room_number`, `grade_level_id`
- `teacher_name` (full name)

**Usage:**
```sql
-- Get all topics for a teacher with full details
SELECT * FROM daily_topics_with_details
WHERE teacher_id = 'uuid'
ORDER BY topic_date DESC
LIMIT 10;
```

---

## Frontend Integration

### State Management
```typescript
const [selectedClassForTopic, setSelectedClassForTopic] = useState('')
const [dailyTopic, setDailyTopic] = useState('')
const [recentTopics, setRecentTopics] = useState<any[]>([])
```

### Save Topic
```typescript
const saveDailyTopic = async () => {
  const response = await fetch('/api/teacher/daily-topics', {
    method: 'POST',
    body: JSON.stringify({
      class_id: selectedClassForTopic,
      topic: dailyTopic.trim()
    })
  })
  
  // Automatically replaces if exists for today!
}
```

### Load Recent Topics
```typescript
const fetchRecentTopics = async () => {
  const response = await fetch('/api/teacher/daily-topics?days=7')
  const data = await response.json()
  setRecentTopics(data.topics)
}
```

---

## Example Workflow

### Monday (Nov 8)
```
9:00 AM - Teacher saves: "Quadratic Equations" for Math 10
         → Record created with topic_date = 2025-11-08

11:00 AM - Teacher updates: "Quadratic Equations & Factoring"
          → SAME record updated (no duplicate)
```

### Tuesday (Nov 9)
```
9:00 AM - Teacher saves: "Linear Equations" for Math 10
         → NEW record created with topic_date = 2025-11-09
         → Monday's topic unchanged
```

### Result in Database:
```
| topic_date  | topic                          | created_at | updated_at |
|-------------|--------------------------------|------------|------------|
| 2025-11-08  | Quadratic Equations & Factoring| 09:00      | 11:00      |
| 2025-11-09  | Linear Equations               | 09:00      | 09:00      |
```

---

## Benefits

✅ **No Duplicates** - Unique constraint prevents multiple topics per class per day
✅ **Automatic Updates** - Same day edits update instead of duplicate
✅ **Clean Data** - One source of truth per class per day
✅ **Efficient Queries** - Indexed by teacher, class, and date
✅ **Secure** - RLS ensures teachers only manage their own topics
✅ **Scalable** - Automatic cleanup keeps database lean
✅ **Organized** - Easy to track teaching history

---

## Migration Commands

### Apply Schema
```bash
psql -U postgres -d catalyst -f daily_topics_schema.sql
```

### Verify Tables
```sql
\d daily_topics
\d+ daily_topics_with_details
```

### Test Unique Constraint
```sql
-- Insert first topic
INSERT INTO daily_topics (teacher_id, class_id, school_id, topic)
VALUES ('uuid1', 'class1', 'school1', 'First topic');

-- Try to insert duplicate (same day) - will fail
INSERT INTO daily_topics (teacher_id, class_id, school_id, topic)
VALUES ('uuid1', 'class1', 'school1', 'Duplicate topic');
-- ERROR: duplicate key value violates unique constraint

-- Use upsert instead
INSERT INTO daily_topics (teacher_id, class_id, school_id, topic)
VALUES ('uuid1', 'class1', 'school1', 'Updated topic')
ON CONFLICT (teacher_id, class_id, topic_date) 
DO UPDATE SET topic = EXCLUDED.topic, updated_at = NOW();
-- SUCCESS: Updates existing record
```

---

## Monitoring

### Check Topic Count
```sql
SELECT COUNT(*) FROM daily_topics;
```

### Topics by Date
```sql
SELECT topic_date, COUNT(*) 
FROM daily_topics 
GROUP BY topic_date 
ORDER BY topic_date DESC;
```

### Most Active Teachers
```sql
SELECT teacher_name, COUNT(*) as topics_count
FROM daily_topics_with_details
WHERE topic_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY teacher_name
ORDER BY topics_count DESC;
```

---

## Support

For questions or issues:
- Check RLS policies if access denied
- Verify teacher is assigned to class
- Ensure dates are in correct format (YYYY-MM-DD)
- Check unique constraint if duplicates appear
