# Teacher Incidents API

API endpoints for managing student incident reports.

## Endpoints

### GET `/api/teacher/incidents`

Fetch all incidents created by the authenticated teacher.

**Authentication:** Required (Teacher role)

**Response:**
```json
{
  "success": true,
  "incidents": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "teacher_id": "uuid",
      "type": "behavioral|academic|positive",
      "severity": "low|medium|high",
      "description": "string",
      "created_at": "timestamp",
      "student_name": "string",
      "student_grade": "string",
      "resolution_status": "pending|in_progress|resolved",
      "location": "string",
      "incident_date": "timestamp"
    }
  ],
  "count": 0
}
```

### POST `/api/teacher/incidents`

Create a new incident report.

**Authentication:** Required (Teacher role)

**Request Body:**
```json
{
  "student_id": "uuid (optional)",
  "student_name": "string (required)",
  "type": "behavioral|academic|positive (required)",
  "severity": "low|medium|high (required)",
  "description": "string (required, min 10 chars)",
  "location": "string (optional)",
  "incident_date": "timestamp (optional, defaults to now)"
}
```

**Validation:**
- `student_name`: Required, non-empty
- `description`: Required, minimum 10 characters
- `type`: Must be one of: behavioral, academic, positive
- `severity`: Must be one of: low, medium, high
- `student_id`: Optional, must be valid student in same school if provided

**Response:**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "incident": {
    "id": "uuid",
    "student_id": "uuid",
    "teacher_id": "uuid",
    "type": "behavioral",
    "severity": "medium",
    "description": "string",
    "created_at": "timestamp",
    "student_name": "string",
    "student_grade": "string",
    "resolution_status": "pending"
  }
}
```

### PATCH `/api/teacher/incidents`

Update an existing incident (status, resolution notes).

**Authentication:** Required (Teacher role)

**Request Body:**
```json
{
  "incident_id": "uuid (required)",
  "status": "open|investigating|resolved|closed (optional)",
  "resolution_notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Incident updated successfully",
  "incident": {
    // Updated incident object
  }
}
```

### DELETE `/api/teacher/incidents?id=uuid`

Delete an incident report.

**Authentication:** Required (Teacher role, must be the creator)

**Query Parameters:**
- `id`: Incident UUID

**Response:**
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

## Database Schema

The API uses the `incident_reports` table with the following structure:

```sql
- id: UUID (primary key)
- school_id: UUID (foreign key to schools)
- reported_by: UUID (foreign key to profiles - teacher)
- incident_type: TEXT (behavioral, academic, positive)
- severity: TEXT (low, medium, high, critical)
- description: TEXT
- location: TEXT (optional)
- incident_date: TIMESTAMP
- students_involved: UUID[] (array of student IDs)
- witnesses: UUID[] (optional)
- status: TEXT (open, investigating, resolved, closed)
- assigned_to: UUID (optional)
- resolution_notes: TEXT (optional)
- resolved_at: TIMESTAMP (optional)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Security

- All endpoints require authentication
- Only teachers can access these endpoints
- Teachers can only view/manage incidents from their school
- Teachers can only delete incidents they created
- Student verification ensures students belong to the same school

## Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Only teachers can create incidents"
}
```

**400 Bad Request:**
```json
{
  "error": "Student name is required"
}
```

**404 Not Found:**
```json
{
  "error": "Incident not found or access denied"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```
