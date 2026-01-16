# CatalystWells Python SDK

The official Python SDK for the CatalystWells Education Platform API.

## Installation

```bash
pip install catalystwells
```

## Quick Start

```python
from catalystwells import CatalystWells, Environment

# Initialize the client
client = CatalystWells(
    client_id="your_client_id",
    client_secret="your_client_secret",
    environment=Environment.SANDBOX
)

# Get authorization URL
auth_url = client.get_authorization_url([
    "student.profile.read",
    "student.attendance.read"
])
print(f"Authorize at: {auth_url}")

# After user authorizes, exchange the code
tokens = client.exchange_code(authorization_code)

# Make API calls
student = client.get_current_student()
print(f"Hello, {student['name']}!")
```

## OAuth 2.0 with PKCE

For enhanced security, use PKCE:

```python
from catalystwells import CatalystWells

client = CatalystWells(client_id="your_client_id")

# Generate PKCE codes
verifier = CatalystWells.generate_code_verifier()
challenge = CatalystWells.generate_code_challenge(verifier)

# Get auth URL with challenge
auth_url = client.get_authorization_url(
    scopes=["student.profile.read"],
    code_challenge=challenge
)

# Later, exchange with verifier
tokens = client.exchange_code(code, code_verifier=verifier)
```

## Context Manager

Use the context manager for automatic cleanup:

```python
from catalystwells import CatalystWells, Environment

with CatalystWells(
    client_id="your_client_id",
    client_secret="your_client_secret",
    environment=Environment.SANDBOX
) as client:
    client.set_tokens(stored_tokens)
    student = client.get_current_student()
```

## API Reference

### Students

```python
# Get current student
student = client.get_current_student()

# Get student by ID
student = client.get_student("student-uuid")

# Get academic marks
marks = client.get_student_marks(
    "student-uuid",
    term="1",
    academic_year="2024"
)
```

### Attendance

```python
# Get attendance records
attendance = client.get_student_attendance(
    "student-uuid",
    month="2024-01",
    limit=30
)

print(f"Attendance rate: {attendance['summary']['attendance_rate']}")
```

### Timetable

```python
# Get full timetable
timetable = client.get_student_timetable("student-uuid")

# Get specific day
monday = client.get_student_timetable("student-uuid", day="monday")
```

### Wellbeing (Requires Consent)

```python
# Get current mood
mood = client.get_current_mood(student_id="student-uuid")

# Get aggregated data (no consent required)
aggregated = client.get_current_mood(aggregated=True)

# Get mood history
history = client.get_mood_history("student-uuid", days=30)

# Get behavior summary
behavior = client.get_behavior_summary(
    student_id="student-uuid",
    period="month"
)
```

### Notifications

```python
from catalystwells import NotificationType, Priority

# Send notification
result = client.send_notification(
    user_id="user-uuid",
    title="Assignment Due",
    message="Your math assignment is due tomorrow",
    notification_type=NotificationType.WARNING,
    priority=Priority.HIGH,
    action_url="/assignments/123"
)

# Send bulk notifications
bulk = client.send_bulk_notifications(
    user_ids=["user-1", "user-2", "user-3"],
    title="Holiday Notice",
    message="School will be closed on Friday"
)
```

### Announcements

```python
# Get announcements
announcements = client.get_announcements(
    school_id="school-uuid",
    category="general"
)

# Create announcement
result = client.create_announcement(
    school_id="school-uuid",
    title="Parent-Teacher Meeting",
    content="PTM scheduled for Saturday...",
    category="event",
    priority="high"
)
```

### Privacy & Consent

```python
# Check consent status
consent = client.get_consent_status(user_id="user-uuid")

# Request consent
request = client.request_consent(
    user_id="user-uuid",
    consent_type="wellbeing_data",
    purpose="To provide personalized learning recommendations",
    expires_in_days=365
)
```

## Error Handling

```python
from catalystwells import CatalystWells, CatalystWellsError

try:
    student = client.get_current_student()
except CatalystWellsError as e:
    print(f"Error {e.code}: {e.description}")
    
    if e.code == "insufficient_scope":
        # Request additional permissions
        pass
    
    if e.status == 401:
        # Token expired, refresh
        client.refresh_access_token()
```

## Token Management

```python
# Tokens are auto-refreshed 1 minute before expiry

# Manually set tokens
client.set_tokens({
    "access_token": "stored_access_token",
    "refresh_token": "stored_refresh_token",
    "expires_in": 3600,
    "token_type": "Bearer",
    "scope": "student.profile.read"
})

# Revoke tokens on logout
client.revoke_token()
```

## Async Support

For async applications, use `httpx.AsyncClient`:

```python
# Coming in v1.1.0
```

## License

MIT © CatalystWells

## Support

- Documentation: https://developer.catalystwells.com/docs
- Issues: https://github.com/catalystwells/sdk-python/issues
- Email: developer-support@catalystwells.com
