# CatalystWells JavaScript/TypeScript SDK

The official JavaScript/TypeScript SDK for the CatalystWells Education Platform API.

## Installation

```bash
npm install @catalystwells/sdk
# or
yarn add @catalystwells/sdk
# or
pnpm add @catalystwells/sdk
```

## Quick Start

```typescript
import { CatalystWells } from '@catalystwells/sdk'

// Initialize the client
const client = new CatalystWells({
    clientId: 'your_client_id',
    clientSecret: 'your_client_secret',
    environment: 'sandbox' // or 'production'
})

// Get authorization URL
const authUrl = client.getAuthorizationUrl([
    'student.profile.read',
    'student.attendance.read'
])

// After user authorizes, exchange the code
const tokens = await client.exchangeCode(authorizationCode)

// Make API calls
const student = await client.getCurrentStudent()
console.log(student.name)
```

## OAuth 2.0 with PKCE

For browser-based apps, use PKCE for enhanced security:

```typescript
import { CatalystWells } from '@catalystwells/sdk'

// Generate code challenge
function generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

// Store verifier and get auth URL
const verifier = generateCodeVerifier()
const challenge = await generateCodeChallenge(verifier)
sessionStorage.setItem('code_verifier', verifier)

const authUrl = client.getAuthorizationUrl(
    ['student.profile.read'],
    crypto.randomUUID(), // state
    challenge // code_challenge
)

// Later, exchange with verifier
const verifier = sessionStorage.getItem('code_verifier')
const tokens = await client.exchangeCode(code, verifier)
```

## API Reference

### Students

```typescript
// Get current student
const student = await client.getCurrentStudent()

// Get student by ID
const student = await client.getStudent('student-uuid')

// Get academic marks
const marks = await client.getStudentMarks('student-uuid', {
    term: '1',
    academic_year: '2024'
})
```

### Attendance

```typescript
// Get attendance records
const attendance = await client.getStudentAttendance('student-uuid', {
    month: '2024-01',
    limit: 30
})

console.log(attendance.summary.attendance_rate)
```

### Timetable

```typescript
// Get timetable
const timetable = await client.getStudentTimetable('student-uuid')

// Get specific day
const monday = await client.getStudentTimetable('student-uuid', 'monday')
```

### Wellbeing (Requires Consent)

```typescript
// Get current mood
const mood = await client.getCurrentMood('student-uuid')

// Get aggregated data (no consent required)
const aggregated = await client.getCurrentMood(undefined, true)

// Get mood history
const history = await client.getMoodHistory('student-uuid', 30)

// Get behavior summary
const behavior = await client.getBehaviorSummary({
    student_id: 'student-uuid',
    period: 'month'
})
```

### Notifications

```typescript
// Send notification
const result = await client.sendNotification('user-uuid', {
    title: 'Assignment Due',
    message: 'Your math assignment is due tomorrow',
    type: 'warning',
    priority: 'high',
    action_url: '/assignments/123'
})

// Send bulk notifications
const bulk = await client.sendBulkNotifications(
    ['user-1', 'user-2', 'user-3'],
    {
        title: 'Holiday Notice',
        message: 'School will be closed on Friday'
    }
)
```

### Announcements

```typescript
// Get announcements
const announcements = await client.getAnnouncements({
    school_id: 'school-uuid',
    category: 'general'
})

// Create announcement
const result = await client.createAnnouncement({
    school_id: 'school-uuid',
    title: 'Parent-Teacher Meeting',
    content: 'PTM scheduled for Saturday...',
    category: 'event',
    priority: 'high'
})
```

### Privacy & Consent

```typescript
// Check consent status
const consent = await client.getConsentStatus('user-uuid')

// Request consent
const request = await client.requestConsent('user-uuid', 'wellbeing_data', {
    purpose: 'To provide personalized learning recommendations',
    expires_in_days: 365
})
```

## Error Handling

```typescript
import { CatalystWellsError } from '@catalystwells/sdk'

try {
    const student = await client.getCurrentStudent()
} catch (error) {
    if (error instanceof CatalystWellsError) {
        console.error(`Error ${error.code}: ${error.description}`)
        
        if (error.code === 'insufficient_scope') {
            // Request additional permissions
        }
        
        if (error.status === 401) {
            // Token expired, refresh
            await client.refreshAccessToken()
        }
    }
}
```

## Token Management

The SDK automatically refreshes tokens when they're about to expire:

```typescript
// Tokens are auto-refreshed 1 minute before expiry
const student = await client.getCurrentStudent()

// You can also manually set tokens (useful for server-side)
client.setTokens({
    access_token: 'stored_access_token',
    refresh_token: 'stored_refresh_token',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'student.profile.read'
})

// Revoke tokens on logout
await client.revokeToken()
```

## TypeScript Support

Full TypeScript support with type definitions:

```typescript
import { 
    CatalystWells, 
    Student, 
    AttendanceRecord, 
    MoodData,
    CatalystWellsConfig,
    TokenResponse
} from '@catalystwells/sdk'

const config: CatalystWellsConfig = {
    clientId: 'your_client_id',
    environment: 'sandbox'
}

const client = new CatalystWells(config)

const student: Student = await client.getCurrentStudent()
```

## Browser Support

Works in all modern browsers. For older browsers, you may need polyfills for:
- `fetch`
- `crypto.getRandomValues`
- `URLSearchParams`

## License

MIT © CatalystWells

## Support

- Documentation: https://developer.catalystwells.com/docs
- Issues: https://github.com/catalystwells/sdk-javascript/issues
- Email: developer-support@catalystwells.com
