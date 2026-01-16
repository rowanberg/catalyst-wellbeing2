# CatalystWells Public API Documentation

> **Version:** 1.0.0  
> **Last Updated:** 2026-01-14  
> **Base URL:** `https://api.catalystwells.com/api/public/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
   - [OAuth 2.0 Flow](#oauth-20-authorization-code-flow)
   - [API Keys](#api-keys-server-to-server)
   - [Token Management](#token-management)
3. [Scopes & Permissions](#scopes--permissions)
4. [API Endpoints](#api-endpoints)
   - [Student API](#student-api)
   - [Teacher API](#teacher-api)
   - [Parent API](#parent-api)
   - [Admin API](#admin-api)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)
8. [SDKs & Libraries](#sdks--libraries)

---

## Overview

The CatalystWells Public API enables third-party applications to securely access school data. Built on OAuth 2.0 standards, it provides:

- **Role-based access control** - Students, teachers, parents, and admins have role-specific permissions
- **Granular scopes** - Request only the data your application needs
- **Secure authentication** - PKCE support, token hashing, and rate limiting
- **RESTful design** - JSON responses with consistent error formats

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.catalystwells.com/api/public/v1` |
| Development | `http://localhost:3000/api/public/v1` |

### API Conventions

- All requests must include authentication (Bearer token or API key)
- Request bodies use JSON format
- Responses return JSON with standardized structure
- Timestamps use ISO 8601 format (UTC)
- IDs are UUIDs

---

## Authentication

### OAuth 2.0 Authorization Code Flow

CatalystWells uses the OAuth 2.0 Authorization Code flow with optional PKCE support.

#### Step 1: Redirect User to Authorization

Direct users to the CatalystWells SSO page:

```
GET /authsso?client_id={client_id}&redirect_uri={redirect_uri}&scope={scopes}&state={state}&response_type=code
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Your registered application's client ID |
| `redirect_uri` | Yes | URL-encoded callback URL (must match registered URI) |
| `scope` | Yes | Space-separated list of requested permission scopes |
| `state` | Recommended | Random string for CSRF protection |
| `response_type` | Yes | Must be `code` |
| `code_challenge` | Optional | PKCE code challenge (base64url-encoded SHA256 hash) |
| `code_challenge_method` | Optional | `S256` (recommended) or `plain` |

**Example:**
```
https://app.catalystwells.com/authsso?client_id=my-app&redirect_uri=https://myapp.com/callback&scope=profile.read%20student.grades.read&state=abc123&response_type=code
```

#### Step 2: User Authorizes

The user reviews requested permissions and clicks "Allow" or "Cancel".

- **On Allow:** User is redirected to `redirect_uri` with authorization code
- **On Cancel:** User is redirected with `error=access_denied`

#### Step 3: Exchange Code for Tokens

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={client_id}
&client_secret={client_secret}
&code={authorization_code}
&redirect_uri={redirect_uri}
&code_verifier={code_verifier}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `authorization_code` |
| `client_id` | Yes | Your application's client ID |
| `client_secret` | Yes | Your application's client secret |
| `code` | Yes | Authorization code from Step 2 |
| `redirect_uri` | Yes | Same redirect URI used in Step 1 |
| `code_verifier` | PKCE | Original code verifier (if PKCE was used) |

**Response:**
```json
{
  "access_token": "cw_at_abc123...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "cw_rt_xyz789...",
  "scope": "profile.read student.grades.read"
}
```

#### Step 4: Use Access Token

```http
GET /api/public/v1/students?action=me
Authorization: Bearer cw_at_abc123...
```

### Refreshing Tokens

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id={client_id}
&client_secret={client_secret}
&refresh_token={refresh_token}
```

**Note:** Refresh tokens rotate on each use. Store the new refresh token from the response.

### API Keys (Server-to-Server)

For backend integrations without user context, use API keys:

```http
GET /api/public/v1/admin?action=dashboard
X-API-Key: cw_live_abc123...
```

API keys are tied to a specific user and inherit that user's role permissions.

### Token Management

#### Revoking Tokens

```http
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token={access_token_or_refresh_token}
&token_type_hint={access_token|refresh_token}
&client_id={client_id}
&client_secret={client_secret}
```

#### User Info Endpoint

```http
GET /api/oauth/userinfo
Authorization: Bearer {access_token}
```

Returns:
```json
{
  "sub": "user-uuid",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john@school.edu",
  "picture": "https://...",
  "role": "student",
  "school_id": "school-uuid",
  "school_name": "Example School"
}
```

---

## Scopes & Permissions

Scopes control what data your application can access. Always request the minimum scopes needed.

### Common Scopes (All Roles)

| Scope | Description |
|-------|-------------|
| `profile.read` | Read user's basic profile (name, avatar) |
| `profile.email` | Read user's email address |
| `profile.write` | Update user's profile |
| `calendar.read` | View calendar events |
| `notifications.write` | Send push notifications |
| `school.read` | View school information |

### Student Scopes

| Scope | Description |
|-------|-------------|
| `student.classes.read` | View enrolled classes and schedules |
| `student.grades.read` | View grades and assessments |
| `student.assignments.read` | View assignments and homework |
| `student.attendance.read` | View attendance records |
| `student.wellbeing.read` | View mood and wellbeing data |
| `student.achievements.read` | View XP, badges, and levels |

### Teacher Scopes

| Scope | Description |
|-------|-------------|
| `teacher.students.read` | View student rosters |
| `teacher.grades.read` | View student grades |
| `teacher.grades.write` | Update grades and assessments |
| `teacher.attendance.read` | View attendance records |
| `teacher.attendance.write` | Mark attendance |
| `teacher.assignments.read` | View assignments |
| `teacher.assignments.write` | Create/update assignments |
| `teacher.communications.write` | Send messages to students/parents |
| `teacher.analytics.read` | View class performance analytics |

### Parent Scopes

| Scope | Description |
|-------|-------------|
| `parent.children.read` | View children's profiles |
| `parent.grades.read` | View children's grades |
| `parent.attendance.read` | View children's attendance |
| `parent.communications.read` | Read school messages |
| `parent.meetings.read` | View scheduled meetings |
| `parent.meetings.write` | Schedule parent-teacher meetings |

### Admin Scopes

| Scope | Description |
|-------|-------------|
| `admin.users.read` | View all users in school |
| `admin.users.write` | Manage user accounts |
| `admin.school.read` | View school settings |
| `admin.school.write` | Update school settings |
| `admin.reports.read` | View analytics reports |
| `admin.aegisx.read` | View AegisX access data |
| `admin.aegisx.write` | Manage AegisX settings |

---

## API Endpoints

### Student API

**Base Path:** `/api/public/v1/students`

All endpoints require authentication via Bearer token with appropriate scopes.

#### GET Actions

| Action | Scope Required | Description |
|--------|----------------|-------------|
| `me` | `profile.read` | Get authenticated user's profile |
| `classes` | `student.classes.read` | Get enrolled classes |
| `grades` | `student.grades.read` | Get grades and assessments |
| `attendance` | `student.attendance.read` | Get attendance records |
| `assignments` | `student.assignments.read` | Get assignments |
| `achievements` | `student.achievements.read` | Get XP, badges, levels |
| `wellbeing` | `student.wellbeing.read` | Get mood and wellbeing data |
| `list` | `teacher.students.read` | List students (teachers/admins) |

#### Example: Get Student Profile

```http
GET /api/public/v1/students?action=me
Authorization: Bearer {access_token}
```

```json
{
  "data": {
    "id": "profile-uuid",
    "user_id": "user-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "grade_level": "10",
    "xp": 1500,
    "gems": 245,
    "level": 5,
    "schools": {
      "id": "school-uuid",
      "name": "Example High School"
    }
  },
  "meta": {
    "scopes": ["profile.read", "profile.email"]
  }
}
```

#### Example: Get Student Grades

```http
GET /api/public/v1/students?action=grades&limit=10
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)

```json
{
  "data": [
    {
      "id": "grade-uuid",
      "score": 85,
      "percentage": 85.0,
      "letter_grade": "B",
      "feedback": "Good work!",
      "created_at": "2026-01-10T10:00:00Z",
      "assessment": {
        "id": "assessment-uuid",
        "title": "Math Quiz 1",
        "type": "quiz",
        "max_score": 100,
        "class": {
          "id": "class-uuid",
          "class_name": "Math 101",
          "subject": "Mathematics"
        }
      }
    }
  ],
  "meta": {
    "count": 10
  }
}
```

#### Example: Get Attendance

```http
GET /api/public/v1/students?action=attendance&days=30
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `days` (optional): Number of days to look back (default: 30)

```json
{
  "data": [
    {
      "id": "attendance-uuid",
      "attendance_date": "2026-01-14",
      "attendance_status": "present",
      "notes": null,
      "created_at": "2026-01-14T08:00:00Z"
    }
  ],
  "meta": {
    "summary": {
      "total": 20,
      "present": 18,
      "absent": 1,
      "late": 1,
      "excused": 0
    },
    "days": 30
  }
}
```

---

### Teacher API

**Base Path:** `/api/public/v1/teachers`

#### GET Actions

| Action | Scope Required | Parameters |
|--------|----------------|------------|
| `me` | `profile.read` | - |
| `classes` | `teacher.students.read` | - |
| `students` | `teacher.students.read` | `class_id` (required) |
| `grades` | `teacher.grades.read` | `class_id` or `assessment_id` |
| `attendance` | `teacher.attendance.read` | `date` (optional) |
| `analytics` | `teacher.analytics.read` | `class_id` (required) |
| `assessments` | `teacher.assignments.read` | `class_id`, `type` (optional) |

#### POST Actions

| Action | Scope Required | Description |
|--------|----------------|-------------|
| `mark_attendance` | `teacher.attendance.write` | Mark student attendance |
| `create_assessment` | `teacher.assignments.write` | Create new assessment |
| `grade_assessment` | `teacher.grades.write` | Grade a student's work |
| `send_shout_out` | `teacher.communications.write` | Send recognition to student |

#### Example: Mark Attendance

```http
POST /api/public/v1/teachers
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "action": "mark_attendance",
  "date": "2026-01-14",
  "records": [
    { "student_id": "student-uuid-1", "status": "present" },
    { "student_id": "student-uuid-2", "status": "absent", "notes": "Sick" },
    { "student_id": "student-uuid-3", "status": "late" }
  ]
}
```

```json
{
  "data": [...],
  "meta": {
    "count": 3,
    "date": "2026-01-14"
  }
}
```

#### Example: Create Assessment

```http
POST /api/public/v1/teachers
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "action": "create_assessment",
  "class_id": "class-uuid",
  "title": "Chapter 5 Quiz",
  "description": "Quiz covering Chapter 5 material",
  "type": "quiz",
  "max_score": 100,
  "due_date": "2026-01-20T23:59:59Z",
  "is_published": true
}
```

---

### Parent API

**Base Path:** `/api/public/v1/parents`

#### GET Actions

| Action | Scope Required | Parameters |
|--------|----------------|------------|
| `me` | `profile.read` | - |
| `children` | `parent.children.read` | - |
| `child_grades` | `parent.grades.read` | `child_id` (required) |
| `child_attendance` | `parent.attendance.read` | `child_id`, `days` |
| `child_assessments` | `parent.children.read` | `child_id` (required) |
| `announcements` | `parent.communications.read` | `limit` |
| `messages` | `parent.communications.read` | `limit`, `unread` |
| `meetings` | `parent.meetings.read` | `upcoming` |

#### POST Actions

| Action | Scope Required | Description |
|--------|----------------|-------------|
| `book_meeting` | `parent.meetings.write` | Schedule a meeting |
| `mark_announcement_read` | `parent.communications.read` | Mark as read |

#### Example: Get Children

```http
GET /api/public/v1/parents?action=children
Authorization: Bearer {access_token}
```

```json
{
  "data": [
    {
      "id": "profile-uuid",
      "user_id": "user-uuid",
      "first_name": "Emma",
      "last_name": "Doe",
      "grade_level": "8",
      "xp": 2500,
      "level": 8,
      "current_mood": "happy",
      "relationship": "parent"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### Admin API

**Base Path:** `/api/public/v1/admin`

**Note:** Admin endpoints require the user to have `admin` or `super_admin` role.

#### GET Actions

| Action | Scope Required | Parameters |
|--------|----------------|------------|
| `dashboard` | `admin.reports.read` | - |
| `users` | `admin.users.read` | `role`, `search`, `page`, `limit` |
| `user` | `admin.users.read` | `user_id` (required) |
| `classes` | `admin.school.read` | - |
| `reports` | `admin.reports.read` | `type`, `days` |
| `school` | `admin.school.read` | - |
| `aegisx` | `admin.aegisx.read` | `resource` (readers/logs) |

#### POST Actions

| Action | Scope Required | Description |
|--------|----------------|-------------|
| `update_user` | `admin.users.write` | Update user profile |
| `deactivate_user` | `admin.users.write` | Deactivate user account |
| `update_school` | `admin.school.write` | Update school settings |

#### Example: Get Dashboard

```http
GET /api/public/v1/admin?action=dashboard
Authorization: Bearer {access_token}
```

```json
{
  "data": {
    "overview": {
      "students": 450,
      "teachers": 32,
      "parents": 380,
      "classes": 28
    },
    "today": {
      "attendanceRate": 94.5,
      "attendanceRecords": 425
    }
  }
}
```

#### Example: Get Reports

```http
GET /api/public/v1/admin?action=reports&type=attendance&days=30
Authorization: Bearer {access_token}
```

---

## Error Handling

All errors follow OAuth 2.0 error format:

```json
{
  "error": "error_code",
  "error_description": "Human-readable description"
}
```

### Error Codes

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | `invalid_request` | Missing or invalid parameters |
| 401 | `invalid_token` | Access token invalid or expired |
| 401 | `invalid_api_key` | API key invalid or revoked |
| 403 | `insufficient_scope` | Token lacks required scope |
| 403 | `forbidden` | Not authorized for this resource |
| 404 | `not_found` | Resource not found |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `server_error` | Internal server error |

### Handling Token Expiration

When you receive a `401 invalid_token` error:

1. Use your refresh token to get a new access token
2. If refresh fails, redirect user to re-authorize
3. Store the new tokens securely

---

## Rate Limiting

API requests are rate-limited to ensure fair usage.

| Trust Level | Requests/Minute | Requests/Day |
|-------------|-----------------|--------------|
| Standard | 60 | 10,000 |
| Verified | 120 | 50,000 |
| Official | 1,000 | Unlimited |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705235400
```

### Handling Rate Limits

When you receive a `429` error:

```json
{
  "error": "rate_limit_exceeded",
  "error_description": "Rate limit exceeded. Try again in 60 seconds."
}
```

Wait until the `X-RateLimit-Reset` timestamp before retrying.

---

## Best Practices

### Security

1. **Store secrets securely** - Never expose client secrets in client-side code
2. **Use PKCE** - Always use PKCE for mobile and SPA applications
3. **Validate state** - Always verify the `state` parameter to prevent CSRF
4. **HTTPS only** - All production calls must use HTTPS
5. **Rotate tokens** - Use refresh tokens and handle rotation

### Performance

1. **Request minimal scopes** - Only request scopes you actually need
2. **Cache responses** - Respect cache headers and cache appropriate data
3. **Use pagination** - For list endpoints, use `page` and `limit` parameters
4. **Batch requests** - Combine related data needs where possible

### User Experience

1. **Explain permissions** - Clearly explain why you need each permission
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Provide logout** - Allow users to disconnect your app
4. **Respect privacy** - Only access data you've explained to users

---

## SDKs & Libraries

Official SDKs are coming soon:

- **JavaScript/TypeScript:** `npm install @catalystwells/sdk`
- **Python:** `pip install catalystwells`
- **Ruby:** `gem install catalystwells`

### Community Libraries

Submit your library to be listed here by contacting developers@catalystwells.com.

---

## Support

- **Documentation:** https://developers.catalystwells.com
- **API Status:** https://status.catalystwells.com
- **Support Email:** api-support@catalystwells.com
- **Developer Portal:** https://developers.catalystwells.com/apps

---

## Changelog

### v1.0.0 (2026-01-14)

- Initial release
- OAuth 2.0 with PKCE support
- Student, Teacher, Parent, and Admin APIs
- Rate limiting and request logging
- Role-based scope enforcement
