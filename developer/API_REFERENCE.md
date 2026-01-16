# 📚 CatalystWells Developer API Reference

Complete API documentation for the CatalystWells Education Platform Developer APIs.

---

## 🔐 Authentication

All API requests require an OAuth 2.0 access token in the Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Getting an Access Token

1. **Redirect user to authorization endpoint:**
```
GET https://developer.catalystwells.com/api/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=student.profile.read student.attendance.read&
  state=RANDOM_STATE&
  code_challenge=BASE64URL_CHALLENGE&
  code_challenge_method=S256
```

2. **Exchange code for tokens:**
```bash
curl -X POST https://developer.catalystwells.com/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=YOUR_REDIRECT_URI" \
  -d "code_verifier=PLAIN_VERIFIER"
```

---

## 📖 Core APIs

### Students API

#### Get Current Student Profile
```http
GET /api/v1/students/me
Authorization: Bearer {token}
```

**Required Scope:** `student.profile.read` or `profile.read`

**Response:**
```json
{
  "id": "uuid",
  "enrollment_number": "2024001",
  "name": "John Doe",
  "grade": "10",
  "section": "A",
  "roll_number": "15",
  "avatar_url": "https://...",
  "school": {
    "id": "uuid",
    "name": "Springfield High School",
    "code": "SHS"
  },
  "class": {
    "id": "uuid",
    "name": "10-A"
  }
}
```

#### Get Student by ID
```http
GET /api/v1/students/{student_id}
Authorization: Bearer {token}
```

**Required Scope:** `student.profile.read`

**Authorization:** Teachers, parents, or the student themselves

#### Get Student Academic Marks
```http
GET /api/v1/students/{student_id}/marks?term=1&academic_year=2024
Authorization: Bearer {token}
```

**Required Scope:** `student.academic.read`

**Query Parameters:**
- `term` (optional): Academic term (1, 2, 3)
- `subject` (optional): Filter by subject ID
- `academic_year` (optional): Academic year (e.g., 2024)

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "name": "John Doe",
    "grade": "10",
    "section": "A"
  },
  "summary": {
    "total_exams": 15,
    "overall_average": 85.5,
    "subjects_count": 6
  },
  "subjects": [
    {
      "subject": {
        "id": "uuid",
        "name": "Mathematics",
        "code": "MATH"
      },
      "exams": [
        {
          "exam": {
            "id": "uuid",
            "name": "Mid-Term Exam",
            "type": "mid_term",
            "date": "2024-07-15",
            "term": "1"
          },
          "marks_obtained": 85,
          "max_marks": 100,
          "percentage": 85.0,
          "grade": "A",
          "remarks": "Excellent"
        }
      ],
      "average_percentage": 87.5
    }
  ]
}
```

---

### Attendance API

#### Get Student Attendance
```http
GET /api/v1/attendance/student/{student_id}?month=2024-01&limit=30
Authorization: Bearer {token}
```

**Required Scope:** `student.attendance.read`

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `month` (optional): Month filter (YYYY-MM)
- `limit` (optional): Max records (default: 30)

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "name": "John Doe",
    "grade": "10",
    "section": "A"
  },
  "summary": {
    "total_days": 20,
    "working_days": 18,
    "present": 16,
    "absent": 2,
    "late": 0,
    "excused": 0,
    "holidays": 2,
    "attendance_rate": 0.89
  },
  "records": [
    {
      "date": "2024-01-15",
      "status": "present",
      "check_in_time": "08:30:00",
      "check_out_time": "15:00:00",
      "is_holiday": false,
      "notes": null
    }
  ],
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }
}
```

---

### Timetable API

#### Get Student Timetable
```http
GET /api/v1/timetable/student/{student_id}?day=monday
Authorization: Bearer {token}
```

**Required Scope:** `student.timetable.read`

**Query Parameters:**
- `day` (optional): Filter by day (monday, tuesday, etc.)

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "name": "John Doe",
    "grade": "10",
    "section": "A"
  },
  "today": {
    "day": "monday",
    "schedule": [
      {
        "period": 1,
        "start_time": "08:00",
        "end_time": "08:45",
        "subject": {
          "id": "uuid",
          "name": "Mathematics",
          "code": "MATH",
          "color": "#3B82F6"
        },
        "teacher": {
          "id": "uuid",
          "name": "Dr. Smith",
          "avatar_url": "https://..."
        },
        "room": "Room 101"
      }
    ],
    "next_class": {
      "period": 2,
      "start_time": "09:00",
      "subject": { "name": "Physics" }
    }
  },
  "week": {
    "monday": [...],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...]
  },
  "total_periods": 35
}
```

---

### Schools API

#### Get School Information
```http
GET /api/v1/schools/{school_id}?include=grades,stats
Authorization: Bearer {token}
```

**Required Scope:** `school.structure.read`

**Query Parameters:**
- `include` (optional): Comma-separated list of includes
  - `grades` - Include grade levels
  - `sections` - Include sections
  - `departments` - Include departments
  - `terms` - Include academic terms
  - `stats` - Include statistics

**Response:**
```json
{
  "id": "uuid",
  "name": "Springfield High School",
  "code": "SHS",
  "contact": {
    "address": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "country": "USA",
    "phone": "+1-555-0100",
    "email": "info@springfield.edu",
    "website": "https://springfield.edu"
  },
  "logo_url": "https://...",
  "academic_year": "2024-2025",
  "timezone": "America/Chicago",
  "established_year": 1985,
  "grades": [
    {
      "id": "uuid",
      "name": "Grade 10",
      "level": 10,
      "display_order": 10
    }
  ],
  "stats": {
    "total_students": 1250,
    "total_teachers": 85,
    "total_classes": 45
  }
}
```

---

## 🧠 Wellbeing APIs

### Mood Tracking

#### Get Current Mood State
```http
GET /api/v1/wellbeing/mood/current?student_id={id}&aggregated=false
Authorization: Bearer {token}
```

**Required Scope:** `wellbeing.mood.read`

**Query Parameters:**
- `student_id` (optional): Specific student ID (requires consent)
- `aggregated` (optional): Return aggregated data (default: false)

**Individual Response (with consent):**
```json
{
  "student_id": "uuid",
  "current_mood": {
    "mood_level": 4,
    "mood_emoji": "😊",
    "energy_level": 3,
    "stress_level": 2,
    "notes": "Feeling good today",
    "recorded_at": "2024-01-15T10:30:00Z"
  },
  "consent_granted": true,
  "data_type": "individual",
  "disclaimer": "This data is provided for educational purposes only..."
}
```

**Aggregated Response (no consent required):**
```json
{
  "data_type": "aggregated",
  "period": "last_7_days",
  "sample_size": 450,
  "averages": {
    "mood_level": 3.5,
    "energy_level": 3.2,
    "stress_level": 2.8
  },
  "distribution": {
    "very_happy": 120,
    "happy": 180,
    "neutral": 100,
    "sad": 40,
    "very_sad": 10
  },
  "disclaimer": "Aggregated data from multiple students..."
}
```

#### Get Mood History
```http
GET /api/v1/wellbeing/mood/history?student_id={id}&days=30
Authorization: Bearer {token}
```

**Required Scope:** `wellbeing.mood.read`

**Requires:** Student consent for wellbeing data access

**Query Parameters:**
- `student_id` (required): Student ID
- `days` (optional): Number of days (default: 30)
- `limit` (optional): Max records (default: 50)

**Response:**
```json
{
  "student_id": "uuid",
  "student_name": "John Doe",
  "period": {
    "days": 30,
    "start_date": "2023-12-16",
    "end_date": "2024-01-15"
  },
  "summary": {
    "total_check_ins": 25,
    "average_mood": 3.6,
    "average_energy": 3.4,
    "average_stress": 2.5,
    "trend": "improving"
  },
  "history": [
    {
      "date": "2024-01-15",
      "time": "10:30:00",
      "mood_level": 4,
      "mood_emoji": "😊",
      "energy_level": 3,
      "stress_level": 2,
      "sleep_quality": 4,
      "has_notes": true
    }
  ],
  "consent_granted": true
}
```

---

## 🔔 Notifications API

### Send Notification

#### Send Single Notification
```http
POST /api/v1/notifications/send
Authorization: Bearer {token}
Content-Type: application/json
```

**Required Scope:** `notifications.send`

**Request Body:**
```json
{
  "user_id": "uuid",
  "title": "Assignment Due Tomorrow",
  "message": "Your Math assignment is due tomorrow at 5 PM",
  "type": "info",
  "priority": "normal",
  "action_url": "/assignments/123",
  "action_label": "View Assignment",
  "data": {
    "assignment_id": "123",
    "subject": "Mathematics"
  }
}
```

**Parameters:**
- `user_id` (required): Recipient user ID
- `title` (required): Notification title
- `message` (required): Notification message
- `type` (optional): info, success, warning, error, announcement
- `priority` (optional): low, normal, high, urgent
- `action_url` (optional): Deep link or URL
- `action_label` (optional): Button text
- `data` (optional): Additional metadata

**Response:**
```json
{
  "notification_id": "uuid",
  "status": "sent",
  "recipient": {
    "user_id": "uuid",
    "name": "John Doe"
  },
  "sent_at": "2024-01-15T10:30:00Z",
  "message": "Notification sent successfully"
}
```

#### Send Bulk Notifications
```http
PUT /api/v1/notifications/send
Authorization: Bearer {token}
Content-Type: application/json
```

**Required Scope:** `notifications.send`

**Request Body:**
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"],
  "title": "School Announcement",
  "message": "School will be closed tomorrow",
  "type": "announcement",
  "priority": "high"
}
```

**Limits:** Maximum 1000 recipients per request

**Response:**
```json
{
  "status": "sent",
  "total_requested": 500,
  "total_sent": 485,
  "skipped": 15,
  "message": "Sent 485 notifications successfully"
}
```

---

## 🧪 Sandbox APIs

### Seed Test Data
```http
POST /api/sandbox/seed
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "application_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Sandbox data seeded successfully",
  "application_id": "uuid",
  "environment": "sandbox",
  "test_data": {
    "schools": 5,
    "students": 500,
    "teachers": 50,
    "classes": 50,
    "subjects": 15,
    "attendance_records": 90000,
    "exam_records": 5000,
    "mood_check_ins": 10000
  },
  "sample_credentials": {
    "student_email": "test.student@sandbox.catalystwells.com",
    "password": "SandboxTest123!"
  }
}
```

### Reset Sandbox Data
```http
DELETE /api/sandbox/seed?application_id={id}
Authorization: Bearer {token}
```

### Check Sandbox Status
```http
GET /api/sandbox/seed?application_id={id}
Authorization: Bearer {token}
```

---

## 📊 Rate Limits

| Environment | Rate Limit | Burst |
|-------------|------------|-------|
| Sandbox | Unlimited | Unlimited |
| Production | 100 req/min | 200 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

---

## ❌ Error Responses

All errors follow OAuth 2.0 error format:

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: user_id"
}
```

**Common Error Codes:**
- `invalid_request` - Malformed request
- `unauthorized` - Missing or invalid token
- `insufficient_scope` - Token lacks required scope
- `forbidden` - Access denied
- `not_found` - Resource not found
- `rate_limit_exceeded` - Too many requests
- `server_error` - Internal server error
- `consent_required` - User consent needed for wellbeing data

---

## 🔗 Webhooks

Register webhooks to receive real-time events:

**Events:**
- `student.attendance.marked`
- `student.grade.updated`
- `student.mood.checked_in`
- `assignment.submitted`
- `notification.sent`

**Webhook Payload:**
```json
{
  "id": "event_uuid",
  "event": "student.attendance.marked",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "student_id": "uuid",
    "date": "2024-01-15",
    "status": "present"
  }
}
```

**Headers:**
```
X-CatalystWells-Signature: hmac_sha256_signature
X-CatalystWells-Timestamp: 1642262400
X-CatalystWells-Event: student.attendance.marked
```

---

## 📞 Support

- **Documentation**: https://developer.catalystwells.com/docs
- **API Status**: https://status.catalystwells.com
- **Support**: developer-support@catalystwells.com

---

## 📚 Additional APIs (Phase 4-6)

### Teachers API

#### Get Current Teacher Profile
```http
GET /api/v1/teachers/me
Authorization: Bearer {token}
```

**Required Scope:** `teacher.profile.read`

**Response:**
```json
{
  "id": "uuid",
  "full_name": "Dr. Sarah Smith",
  "email": "sarah.smith@school.edu",
  "employee_id": "TCH001",
  "department": {
    "id": "uuid",
    "name": "Science Department"
  },
  "school": {
    "id": "uuid",
    "name": "Springfield High School"
  },
  "classes_taught": [
    { "id": "uuid", "name": "10-A", "subject": "Physics" }
  ],
  "subjects": [
    { "id": "uuid", "name": "Physics", "code": "PHY" }
  ]
}
```

---

### Parents API

#### Get Current Parent Profile
```http
GET /api/v1/parents/me
Authorization: Bearer {token}
```

**Required Scope:** `parent.profile.read`

**Response:**
```json
{
  "id": "uuid",
  "full_name": "John Doe Sr.",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "children": [
    {
      "id": "uuid",
      "name": "John Doe Jr.",
      "relationship": "father",
      "grade": "10",
      "section": "A"
    }
  ]
}
```

---

### Classes API

#### Get Class Details
```http
GET /api/v1/classes/{class_id}?include=students,teachers,subjects
Authorization: Bearer {token}
```

**Required Scope:** `school.structure.read`

**Query Parameters:**
- `include` (optional): students, teachers, subjects

---

### Subjects API

#### List Subjects
```http
GET /api/v1/subjects?school_id={id}&grade_level=10
Authorization: Bearer {token}
```

**Required Scope:** `school.structure.read`

---

### Assignments API

#### List Assignments
```http
GET /api/v1/assignments?student_id={id}&status=pending
Authorization: Bearer {token}
```

**Required Scope:** `student.academic.read`

**Query Parameters:**
- `student_id` (optional): Filter by student
- `class_id` (optional): Filter by class
- `status` (optional): pending, submitted, graded, overdue
- `limit` (optional): Max results

---

### Homework API

#### List Homework
```http
GET /api/v1/homework?student_id={id}&upcoming=true
Authorization: Bearer {token}
```

**Required Scope:** `student.academic.read`

---

### Exams API

#### List Exams
```http
GET /api/v1/exams?school_id={id}&term=1
Authorization: Bearer {token}
```

**Required Scope:** `student.academic.read`

---

### Announcements API

#### List Announcements
```http
GET /api/v1/announcements?school_id={id}&category=general
Authorization: Bearer {token}
```

**Required Scope:** `announcements.read`

#### Create Announcement
```http
POST /api/v1/announcements
Authorization: Bearer {token}
Content-Type: application/json
```

**Required Scope:** `announcements.create`

---

### Academic Years API

#### List Academic Years
```http
GET /api/v1/academic-years?school_id={id}&current=true
Authorization: Bearer {token}
```

**Required Scope:** `school.structure.read`

---

### Terms API

#### List Terms
```http
GET /api/v1/terms?academic_year_id={id}
Authorization: Bearer {token}
```

**Required Scope:** `school.structure.read`

---

### Behavior Summary API

#### Get Behavior Summary
```http
GET /api/v1/wellbeing/behavior/summary?student_id={id}&period=month
Authorization: Bearer {token}
```

**Required Scope:** `wellbeing.behavior.read`

---

### Wellness Alerts API

#### Get Wellness Alerts
```http
GET /api/v1/wellbeing/alerts?severity=high&unread=true
Authorization: Bearer {token}
```

**Required Scope:** `wellbeing.alerts.read`

#### Subscribe to Alerts
```http
POST /api/v1/wellbeing/alerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "webhook_url": "https://your-app.com/webhooks/wellness",
  "alert_types": ["mood_decline", "stress_increase"],
  "min_severity": "medium"
}
```

---

### Privacy & Consent APIs

#### Check Consent Status
```http
GET /api/v1/privacy/consent?user_id={id}
Authorization: Bearer {token}
```

**Required Scope:** `privacy.consent.read`

#### Request Consent
```http
POST /api/v1/privacy/consent
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "uuid",
  "consent_type": "wellbeing_data",
  "purpose": "To provide personalized recommendations",
  "expires_in_days": 365
}
```

#### Get Audit Logs
```http
GET /api/v1/privacy/audit-logs?user_id={id}&start_date=2024-01-01
Authorization: Bearer {token}
```

**Required Scope:** `privacy.audit.read`

#### Request Data Deletion (GDPR/DPDP)
```http
POST /api/v1/privacy/data/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "uuid",
  "data_types": ["all"],
  "reason": "User requested deletion",
  "delete_from_third_parties": true
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "status": "pending",
  "grace_period_ends_at": "2024-02-15T00:00:00Z",
  "third_party_access_revoked": true,
  "compliance": {
    "gdpr": "Article 17 - Right to Erasure",
    "dpdp": "Section 12 - Right to Correction and Erasure"
  }
}
```

---

### Message Status API

#### Get Message Delivery Status
```http
GET /api/v1/messages/{message_id}/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message_id": "uuid",
  "status": "read",
  "delivery": {
    "sent_at": "2024-01-15T10:00:00Z",
    "delivered_at": "2024-01-15T10:00:05Z",
    "read_at": "2024-01-15T10:15:00Z"
  },
  "engagement": {
    "is_read": true,
    "action_clicked": true
  }
}
```

---

### Sandbox Event Trigger API

#### Trigger Test Event
```http
POST /api/sandbox/trigger-event
Authorization: Bearer {token}
Content-Type: application/json

{
  "application_id": "uuid",
  "event_type": "attendance.marked",
  "custom_payload": null
}
```

**Available Events:**
- `attendance.marked`
- `attendance.absent`
- `exam.results.published`
- `assignment.submitted`
- `assignment.graded`
- `wellness.alert`
- `timetable.updated`
- `student.enrolled`
- `parent.linked`

---

### Webhook Management

#### Test Webhook
```http
POST /api/webhooks/{webhook_id}/test
Authorization: Bearer {token}
```

#### Get Webhook Deliveries
```http
GET /api/webhooks/{webhook_id}/deliveries?limit=50
Authorization: Bearer {token}
```

---

### Analytics APIs

#### Export Analytics Data
```http
GET /api/analytics/export?application_id={id}&type=api_calls&format=csv
Authorization: Bearer {token}
```

**Query Parameters:**
- `type`: api_calls, webhooks, users
- `format`: json, csv
- `start_date` / `end_date`: Date range

#### Get Error Logs
```http
GET /api/analytics/errors?application_id={id}&error_code=unauthorized
Authorization: Bearer {token}
```

**Response includes recommendations for common issues.**

#### Get Rate Limit Status
```http
GET /api/analytics/rate-limits?application_id={id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tier": "growth",
  "limits": {
    "requests_per_minute": 300,
    "requests_per_day": 50000
  },
  "current_usage": {
    "requests_last_minute": 45,
    "requests_today": 12500,
    "minute_usage_percent": 15.0,
    "daily_usage_percent": 25.0
  },
  "status": {
    "minute_limit_approaching": false,
    "is_rate_limited": false
  }
}
```

---

### School Linking APIs

#### Request School Access
```http
POST /api/schools/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "application_id": "uuid",
  "school_id": "uuid",
  "requested_scopes": ["student.profile.read"],
  "purpose": "To provide tutoring services"
}
```

#### Get Linked Schools
```http
GET /api/schools/linked?application_id={id}
Authorization: Bearer {token}
```

---

### Team Management APIs

#### List Team Members
```http
GET /api/team
Authorization: Bearer {token}
```

#### Invite Team Member
```http
POST /api/team
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "developer@company.com",
  "role": "developer",
  "permissions": ["read", "write"]
}
```

#### Remove Team Member
```http
DELETE /api/team?member_id={id}
Authorization: Bearer {token}
```

---

### Notification Templates API

#### List Templates
```http
GET /api/templates?application_id={id}
Authorization: Bearer {token}
```

#### Create Template
```http
POST /api/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Assignment Due Reminder",
  "title_template": "{{assignment_title}} due soon",
  "body_template": "Your {{subject}} assignment is due on {{due_date}}",
  "category": "academic",
  "default_priority": "high"
}
```

---

### API Playground

#### Execute API Request
```http
POST /api/playground/execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "application_id": "uuid",
  "method": "GET",
  "endpoint": "/api/v1/students/me",
  "headers": {},
  "body": null
}
```

**Response includes request/response details and tips.**

---

### Admin Review APIs

#### Get Pending Applications
```http
GET /api/admin/apps/pending?category=education
Authorization: Bearer {token} (Admin only)
```

#### Review Application
```http
POST /api/admin/apps/{id}/review
Authorization: Bearer {token} (Admin only)
Content-Type: application/json

{
  "action": "approve",
  "notes": "Application meets all requirements"
}
```

**Actions:** approve, reject, request_changes, suspend, reinstate

---

## 🔧 SDKs Available

### JavaScript/TypeScript
```bash
npm install @catalystwells/sdk
```

```typescript
import { CatalystWells } from '@catalystwells/sdk'

const client = new CatalystWells({
  clientId: 'your_client_id',
  environment: 'sandbox'
})
```

### Python
```bash
pip install catalystwells
```

```python
from catalystwells import CatalystWells, Environment

client = CatalystWells(
    client_id="your_client_id",
    environment=Environment.SANDBOX
)
```
