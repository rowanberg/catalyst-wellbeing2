# Mood History Tracking Implementation

This document outlines the implementation of comprehensive mood history tracking in the Catalyst platform, allowing students to track their emotional wellbeing over time with multiple entries per day.

## Database Implementation

### 1. New Mood History Table

The solution centers around a new `mood_history` table that stores all mood entries chronologically:

```sql
CREATE TABLE IF NOT EXISTS public.mood_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (
    mood = ANY (ARRAY['happy', 'excited', 'calm', 'sad', 'angry', 'anxious'])
  ),
  mood_emoji TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_date DATE DEFAULT CURRENT_DATE,
  recorded_time TIME DEFAULT CURRENT_TIME
);
```

### 2. Automatic Sync with Current Mood

We've implemented a trigger that automatically copies mood entries from the main `mood_tracking` table into the history table:

```sql
CREATE OR REPLACE FUNCTION record_mood_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into mood_history whenever a new mood is recorded or updated
  INSERT INTO public.mood_history 
    (user_id, mood, mood_emoji, recorded_date, created_at, notes, mood_score)
  VALUES
    (NEW.user_id, NEW.mood, NEW.mood_emoji, NEW.date, NEW.created_at, NULL, 
     CASE 
       WHEN NEW.mood = 'happy' THEN 8
       WHEN NEW.mood = 'excited' THEN 10
       WHEN NEW.mood = 'calm' THEN 7
       WHEN NEW.mood = 'sad' THEN 3
       WHEN NEW.mood = 'angry' THEN 2
       WHEN NEW.mood = 'anxious' THEN 4
       ELSE 5
     END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mood_history_trigger
AFTER INSERT OR UPDATE ON public.mood_tracking
FOR EACH ROW EXECUTE FUNCTION record_mood_entry();
```

### 3. Database Indexes

Optimized indexes for efficient querying by date, user, and combined filters:

```sql
CREATE INDEX IF NOT EXISTS idx_mood_history_user_id ON public.mood_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_created_at ON public.mood_history USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_mood_history_user_date ON public.mood_history USING btree (user_id, recorded_date);
CREATE INDEX IF NOT EXISTS idx_mood_history_date_user ON public.mood_history USING btree (recorded_date, user_id);
CREATE INDEX IF NOT EXISTS idx_mood_history_user_date_recent ON public.mood_history USING btree (user_id, recorded_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_history_mood ON public.mood_history USING btree (mood);
```

## API Implementation

### 1. Direct Mood History API

Created a new endpoint for querying mood history with pagination:

```typescript
// src/app/api/student/mood-history/route.ts
export async function GET(request: NextRequest) {
  // Fetches mood history with pagination, filtering by date range
  // Returns structured data for the frontend
}

export async function POST(request: NextRequest) {
  // Allows direct creation of mood history entries without updating the daily mood
  // Useful for additional mood tracking throughout the day
}
```

### 2. Enhanced Current Mood API

Updated the existing mood API to synchronize with mood history:

```typescript
// src/app/api/student/mood/route.ts
export async function GET(request: NextRequest) {
  // New method to fetch today's mood and recent entries
}

export async function POST(request: NextRequest) {
  // Modified to also record in mood_history table
  // Added support for mood_score and notes fields
}
```

## Frontend Components

### 1. MoodHistoryTracker Component

Created a new React component for displaying mood history:

```tsx
// src/components/student/MoodHistoryTracker.tsx
export function MoodHistoryTracker({ className, limit = 10 }: MoodHistoryTrackerProps) {
  // Renders a timeline of mood entries with:
  // - Pagination for viewing older entries
  // - Filter by time period (7/30/90 days)
  // - Visual mood indicators with emoji
  // - Expandable entries to view notes
}
```

### 2. WellbeingTab Integration

Integrated the MoodHistoryTracker into the WellbeingTab component:

```tsx
// src/components/student/tabs/WellbeingTab.tsx
<MoodHistoryTracker className="mb-6" />
```

## Usage Flow

1. **Daily Mood Check-in**: Students continue to use the primary mood check-in UI, which is limited to one entry per day
2. **Mood History Viewing**: Students can now view their complete mood history through the new tracker component
3. **Additional Mood Updates**: The `/api/student/mood-history` POST endpoint allows for recording additional mood entries during the day without affecting the primary daily mood

## Benefits

1. **Complete Emotional Timeline**: Students now have a complete record of their emotional wellbeing over time
2. **Multiple Check-ins**: Support for multiple mood entries per day allows for more accurate tracking
3. **Historical Analysis**: Enables analysis of trends and patterns in emotional wellbeing
4. **Backward Compatibility**: Maintains the current daily mood tracking functionality while adding new capabilities

## Future Enhancements

- Add visual mood trends and analytics (graphs, patterns)
- Implement AI-powered mood insights and recommendations
- Create export functionality for sharing with counselors or parents
- Add custom mood categories beyond the predefined options

## Migration Notes

1. The `mood_history_migration.sql` file contains the full schema setup
2. Existing mood data is automatically migrated to the new table on creation
3. No changes to the existing `mood_tracking` table were required
