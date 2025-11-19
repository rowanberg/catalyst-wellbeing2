# Student Wellbeing Interventions System

## Overview
This system provides comprehensive tracking and management of student wellbeing interventions, including actions, participants, and follow-ups.

## Database Schema

### Tables Created

#### 1. `student_interventions` (Main Table)
- **Purpose**: Track overall intervention plans for students
- **Key Fields**:
  - `student_id`: Student receiving intervention
  - `priority`: urgent, high, medium, low
  - `status`: pending, in_progress, completed, cancelled, on_hold
  - `risk_level`: Student's risk level at time of intervention
  - `notes`: Additional context and instructions
  - Timeline fields for tracking progress
  - Outcome tracking and effectiveness rating

#### 2. `intervention_actions`
- **Purpose**: Individual intervention strategies that make up a plan
- **Action Types**:
  - `counseling`: Schedule Counseling Session
  - `parent_contact`: Contact Parents/Guardians
  - `wellness_plan`: Create Wellness Plan
  - `support_teacher`: Assign Support Teacher
  - `peer_support`: Peer Support Group
  - `mental_health`: Mental Health Resources
  - `academic_support`: Academic Tutoring
  - `priority_checkin`: Priority Daily Check-in
  - `school_counselor`: Refer to School Counselor
  - `break_schedule`: Adjusted Schedule

#### 3. `intervention_participants`
- **Purpose**: Track all staff, parents, and stakeholders involved
- **Fields**: Role, responsibilities, contact info, notification preferences

#### 4. `intervention_follow_ups`
- **Purpose**: Document progress checks and outcomes
- **Fields**: Follow-up date, progress notes, wellbeing scores, next steps

## Installation

### Step 1: Run the Migration

```bash
# Connect to your Supabase database and run:
psql -h <your-db-host> -U postgres -d postgres -f database/migrations/create_interventions_tables.sql
```

Or use the Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire `create_interventions_tables.sql` file
4. Execute the script

### Step 2: Verify Installation

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%intervention%'
ORDER BY table_name;
```

Expected tables:
- `intervention_actions`
- `intervention_follow_ups`
- `intervention_participants`
- `student_interventions`

## API Endpoints

### Create Intervention
```typescript
POST /api/admin/interventions

Body: {
  student_id: string,
  student_name: string,
  interventions: string[], // Array of action types
  priority: 'urgent' | 'high' | 'medium' | 'low',
  notes?: string,
  risk_level?: string,
  risk_score?: number,
  overall_wellbeing_score?: number,
  scheduled_start_date?: string,
  target_completion_date?: string
}

Response: {
  success: true,
  intervention: { ... },
  message: string
}
```

### Get Interventions
```typescript
GET /api/admin/interventions?status=all&priority=all&student_id=xxx&limit=100&offset=0

Response: {
  interventions: [...],
  summary: {
    total: number,
    by_status: { ... },
    by_priority: { ... }
  },
  pagination: { ... }
}
```

### Get Single Intervention
```typescript
GET /api/admin/interventions/[id]

Response: {
  intervention: {
    ...,
    intervention_actions: [...],
    intervention_participants: [...],
    intervention_follow_ups: [...]
  }
}
```

### Update Intervention
```typescript
PATCH /api/admin/interventions/[id]

Body: {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold',
  priority?: 'urgent' | 'high' | 'medium' | 'low',
  notes?: string,
  outcome_summary?: string,
  effectiveness_rating?: 1-5,
  ...
}

Response: {
  success: true,
  intervention: { ... }
}
```

### Cancel Intervention
```typescript
DELETE /api/admin/interventions/[id]

Response: {
  success: true,
  message: 'Intervention cancelled successfully'
}
```

## Usage Example

### Frontend: Creating an Intervention

```typescript
const createIntervention = async (studentData) => {
  const response = await fetch('/api/admin/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: studentData.id,
      student_name: studentData.name,
      interventions: ['counseling', 'parent_contact', 'wellness_plan'],
      priority: 'high',
      notes: 'Student showing signs of academic stress',
      risk_level: 'high',
      risk_score: 7.5
    })
  })
  
  const result = await response.json()
  return result.intervention
}
```

### Backend: Using the Helper Function

```sql
-- Create intervention with multiple actions in one call
SELECT create_intervention_with_actions(
  p_student_id := 'student-uuid',
  p_student_name := 'John Doe',
  p_school_id := 'school-uuid',
  p_priority := 'high',
  p_risk_level := 'high',
  p_risk_score := 7.5,
  p_notes := 'Requires immediate attention',
  p_created_by := 'admin-uuid',
  p_action_types := ARRAY['counseling', 'parent_contact', 'wellness_plan']::intervention_action_type[]
);
```

## Security

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

- **Admins**: Full access to interventions in their school
- **Teachers**: View interventions for their students
- **Students**: View their own interventions only
- **Parents**: (Can be extended) View their children's interventions

### Permissions
- Only admins can create, update, or delete interventions
- Teachers and counselors can add follow-ups
- All authorized staff can view interventions

## Best Practices

### 1. Creating Interventions
- Select multiple complementary intervention types
- Set appropriate priority based on risk level
- Include detailed notes for context
- Set realistic target completion dates

### 2. Tracking Progress
- Add follow-ups regularly (weekly for high priority)
- Update wellbeing scores at each check-in
- Document all actions taken
- Update status as intervention progresses

### 3. Completion
- Always add an outcome summary
- Rate effectiveness (1-5 stars)
- Document lessons learned
- Schedule future check-ins if needed

## Monitoring Queries

### Active Interventions Dashboard
```sql
SELECT * FROM active_interventions_view
WHERE status IN ('pending', 'in_progress')
ORDER BY priority DESC, created_at DESC;
```

### Overdue Interventions
```sql
SELECT 
  id,
  student_name,
  priority,
  target_completion_date,
  DATE_PART('day', CURRENT_DATE - target_completion_date) as days_overdue
FROM student_interventions
WHERE status = 'in_progress'
  AND target_completion_date < CURRENT_DATE
ORDER BY days_overdue DESC;
```

### Effectiveness Report
```sql
SELECT 
  priority,
  AVG(effectiveness_rating) as avg_effectiveness,
  COUNT(*) as total_completed
FROM student_interventions
WHERE status = 'completed'
  AND effectiveness_rating IS NOT NULL
GROUP BY priority
ORDER BY priority;
```

## Troubleshooting

### Issue: RLS blocking inserts
**Solution**: Ensure the user's profile has the correct role and school_id

### Issue: Function not found
**Solution**: Verify the migration ran completely. Check:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%intervention%';
```

### Issue: Foreign key violations
**Solution**: Ensure student_id, school_id, and created_by are valid UUIDs that exist in their respective tables

## Future Enhancements

Potential additions:
- Email notifications to participants
- Automated escalation for overdue interventions
- Integration with calendar systems
- Document attachment support
- Parent portal access
- Multi-language support
- Intervention templates
- Analytics and reporting dashboard

## Support

For issues or questions:
1. Check the logs in Supabase dashboard
2. Review RLS policies if access is denied
3. Verify all foreign keys are valid
4. Check the API response for detailed error messages
