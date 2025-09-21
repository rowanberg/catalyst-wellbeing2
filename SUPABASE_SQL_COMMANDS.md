# Supabase SQL Commands for Attendance System

Copy and paste these commands **one by one** into your Supabase SQL Editor:

## 1. Create Attendance Table (Basic Structure)

```sql
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    school_id UUID NOT NULL,
    class_id UUID,
    grade_level_id UUID,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);
```

## 2. Enable Row Level Security

```sql
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
```

## 3. Create RLS Policy

```sql
CREATE POLICY "Teachers can manage attendance for their school" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('teacher', 'admin')
            AND profiles.school_id = attendance.school_id
        )
    );
```

## 4. Create Performance Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON attendance(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_grade_date ON attendance(grade_level_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
```

## 5. Grant Permissions

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO authenticated;
```

---

## After running these commands:

1. The attendance system APIs should work properly
2. Teachers will be able to access their assigned grades and classes
3. The 404 errors should be resolved
4. The hierarchical navigation (Grades → Classes → Students) will function

## Test the system:

1. Go to `/teacher` in your app
2. Click on "Today's Attendance" 
3. You should see your assigned grade levels
4. Click on a grade to see classes
5. Click on a class to see students and mark attendance

The system now works with your existing database structure without requiring complex database functions.
