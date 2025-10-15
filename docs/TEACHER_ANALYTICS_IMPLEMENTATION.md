# Teacher Analytics Dashboard - Implementation Guide

## Overview
Comprehensive analytics dashboard showing real-time insights for teachers about their students' wellbeing, engagement, and performance.

## Data Sources

### Student Data (Filtered by Teacher's Classes)
All data automatically filtered to show only students in teacher's assigned classes via:
- `teacher_class_assignments` (teacher → classes)
- `student_class_assignments` (students → classes)

### Available Metrics

#### 1. Student Progress
- **XP & Level**: Average experience points and level across all students
- **Top Performers**: Leaderboard of top 5 students by XP
- **Engagement Rate**: % of students active today

#### 2. Wellbeing Tracking
- **Mood Distribution**: Count of students by mood (happy, excited, calm, sad, angry, anxious)
- **Energy Levels**: Average energy (0-100%)
- **Stress Levels**: Average stress (0-100%)
- **7-Day Trend**: Daily energy/stress averages with check-in counts
- **Support Needed**: Students showing low mood or high stress

#### 3. Help Requests
- **Pending Requests**: Total help requests awaiting response
- **Urgent Requests**: High-priority help requests
- **Status Tracking**: pending/acknowledged/resolved

#### 4. Engagement Metrics
- **Quest Completion Rate**: % of quests completed (last 7 days)
- **Total Quests Completed**: Absolute count
- **Habit Tracking**:
  - Average water intake (glasses per day)
  - Average sleep hours per night
  - Exercise minutes
- **Kindness Acts**: Total and weekly counts

#### 5. Smart Insights
Auto-generated alerts with priority levels:
- **High Priority**: Urgent help requests, students at risk
- **Medium Priority**: >20% students needing support
- **Low Priority**: Low engagement, celebration-worthy achievements

## API Endpoint

### GET `/api/teacher/analytics`

**Query Parameters:**
- `teacher_id` (required): Teacher's user ID
- `school_id` (required): School ID
- `class_id` (optional): Filter by specific class

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 28,
      "activeToday": 24,
      "avgXP": 1247,
      "avgLevel": 8,
      "engagementRate": 86
    },
    "wellbeing": {
      "moodDistribution": {
        "happy": 12,
        "excited": 8,
        "calm": 3,
        "sad": 2,
        "angry": 0,
        "anxious": 1
      },
      "avgEnergy": 75,
      "avgStress": 28,
      "studentsNeedingSupport": 3,
      "pendingHelpRequests": 2,
      "urgentHelpRequests": 1,
      "trend": [
        {
          "date": "2025-10-07",
          "avgEnergy": 72,
          "avgStress": 30,
          "checkIns": 24
        }
        // ... 6 more days
      ]
    },
    "engagement": {
      "questCompletionRate": 85,
      "totalQuestsCompleted": 142,
      "avgWaterIntake": 6,
      "avgSleepHours": 7.5,
      "totalKindnessActs": 245,
      "weeklyKindnessActs": 38
    },
    "topPerformers": [
      {
        "id": "uuid",
        "name": "John Doe",
        "xp": 2450,
        "level": 12
      }
      // ... top 5
    ],
    "insights": [
      {
        "type": "alert",
        "priority": "high",
        "message": "1 student(s) need urgent support",
        "action": "Review help requests"
      }
    ]
  },
  "metadata": {
    "totalClasses": 3,
    "totalStudents": 28,
    "dataRange": "7 days",
    "timestamp": "2025-10-13T13:49:38.000Z"
  }
}
```

## UI Component

### Location
`src/components/teacher/ComprehensiveAnalytics.tsx`

### Features
- **Auto-refresh**: Manual refresh button with loading state
- **Loading States**: Skeleton loaders while fetching
- **Error Handling**: Retry button on failure
- **Alert System**: Priority-based insight cards at top
- **Responsive Grid**: 4-column metrics, 3-column detail cards
- **Interactive Elements**: Hover effects, smooth transitions
- **Accessibility**: Clear labels, semantic HTML

### Design System
Following enterprise UI guidelines:
- **Colors**: Blue-600 primary, gray scale for neutrals
- **Cards**: White bg, gray-200 border, shadow-sm
- **Typography**: Semibold titles, medium body text
- **Spacing**: Consistent 6-unit scale (1.5rem gaps)
- **Animations**: transition-all, hover:shadow-md

### Key Metrics Cards (Top Row)
1. **Total Students** - Blue accent, Users icon
2. **Active Today** - Green accent, Activity icon
3. **Average XP** - Purple accent, Trophy icon
4. **Need Support** - Orange accent, AlertTriangle icon

### Detail Cards (Second Row)
1. **Mood Overview** - Distribution bars + energy/stress metrics
2. **Engagement** - Quest progress + habit tracking icons
3. **Top Performers** - Ranked list with XP/level

### Wellbeing Trend Chart
- 7-day view with date labels
- Dual progress bars (energy in green, stress in orange)
- Check-in counts on the right

## Integration

### In Teacher Dashboard
```tsx
import ComprehensiveAnalytics from '@/components/teacher/ComprehensiveAnalytics'

// Inside analytics tab
{activeTab === 'analytics' && (
  <motion.div
    key="analytics"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
  >
    <ComprehensiveAnalytics />
  </motion.div>
)}
```

## Database Tables Used

### Core Tables
- `profiles` - Student info, XP, level, gems
- `teacher_class_assignments` - Teacher→Class mapping
- `student_class_assignments` - Student→Class mapping

### Wellbeing Tables
- `mood_tracking` - Daily mood, energy, stress
- `help_requests` - Support requests with urgency
- `habit_tracker` - Water, sleep, exercise

### Engagement Tables
- `daily_quests` - Quest completion tracking
- `kindness_counter` - Acts of kindness
- `mindfulness_sessions` - Breathing, gratitude sessions

## Performance Optimizations

1. **Parallel Queries**: All data fetched simultaneously
2. **Smart Caching**: 7-day data window reduces query load
3. **Efficient Filtering**: Set operations for unique student IDs
4. **Computed Metrics**: Server-side aggregation
5. **Loading States**: Progressive rendering prevents layout shift

## Security & Privacy

- **RLS Policies**: All tables have Row Level Security enabled
- **Teacher Scope**: Only assigned class data accessible
- **No Direct Student IDs**: Names and aggregated data only
- **School Isolation**: Multi-tenant filtering by school_id

## Usage Instructions

### For Teachers
1. Navigate to Analytics tab in teacher dashboard
2. View real-time overview metrics at the top
3. Check priority alerts for urgent issues
4. Review mood distribution and wellbeing trends
5. Monitor engagement metrics and top performers
6. Click Refresh to update data manually

### Interpreting Insights
- **Red alerts**: Take immediate action (urgent help requests)
- **Yellow warnings**: Monitor situation (high stress levels)
- **Blue info**: Awareness items (low engagement)
- **Green success**: Positive achievements to celebrate

## Future Enhancements

### Potential Additions
- [ ] Class comparison view
- [ ] Individual student drill-down
- [ ] Export reports as PDF
- [ ] Weekly/monthly trend emails
- [ ] Custom alert thresholds
- [ ] Integration with parent communication
- [ ] Predictive analytics (ML-based insights)
- [ ] Goal setting and tracking
- [ ] Historical comparison (year-over-year)

## Troubleshooting

### No Data Showing
- Verify teacher has assigned classes
- Check students are enrolled in classes
- Ensure students have logged activity
- Confirm RLS policies are active

### Slow Loading
- Check database indexes on date fields
- Review query performance logs
- Consider caching layer for frequently accessed data
- Monitor API response times

### Incorrect Counts
- Verify `is_active` flags are set correctly
- Check date ranges in queries
- Confirm student_class_assignments are current
- Review teacher_class_assignments mapping

## Related Documentation
- Teacher Dashboard Overview
- Student Wellbeing System
- Quest & Badge System
- Help Request Management
