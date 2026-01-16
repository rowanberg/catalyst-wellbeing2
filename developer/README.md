# 🎓 CatalystWells Developer Console

A comprehensive OAuth 2.0 developer portal for the CatalystWells Education Platform, enabling third-party developers to build applications that integrate with schools, students, teachers, and parents.

## 🚀 Features

### Developer Portal
- **Application Management**: Create, configure, and manage OAuth applications
- **OAuth 2.0 Flow**: Full authorization code flow with PKCE support
- **API Playground**: Interactive API testing with code generation
- **Analytics Dashboard**: Real-time metrics and usage statistics
- **Documentation Hub**: Comprehensive API reference and guides
- **Team Management**: Collaborate with team members on applications
- **Security Settings**: API keys, session management, and 2FA

### OAuth 2.0 Implementation
- ✅ Authorization Code Grant with PKCE
- ✅ Refresh Token Grant
- ✅ Client Credentials Grant
- ✅ Token Revocation (RFC 7009)
- ✅ OpenID Connect (userinfo endpoint)
- ✅ Scope-based permissions
- ✅ Auto-approval for previously authorized scopes

### Core Education APIs (v1)
- **Students API**: Profile, enrollment, academic records
- **Attendance API**: Daily attendance, trends, summaries
- **Academic API**: Marks, grades, exams, assignments
- **Timetable API**: Class schedules, today's classes
- **Schools API**: Structure, grades, sections, departments
- **Teachers API**: Profile, classes, subjects (coming soon)
- **Parents API**: Children, contacts (coming soon)

### Webhooks
- Event-driven notifications for education events
- HMAC-SHA256 signature verification
- Automatic retry with exponential backoff
- Delivery logs and monitoring

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (or PostgreSQL database)
- Environment variables configured

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd catalyst/developer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Update the following variables:
   ```env
   # Developer Portal Supabase (Separate Database)
   NEXT_PUBLIC_DEV_SUPABASE_URL=your-dev-supabase-url
   NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY=your-dev-supabase-anon-key
   DEV_SUPABASE_SERVICE_ROLE_KEY=your-dev-supabase-service-role-key

   # Main CatalystWells Supabase (For OAuth Integration)
   NEXT_PUBLIC_MAIN_SUPABASE_URL=your-main-supabase-url
   NEXT_PUBLIC_MAIN_SUPABASE_ANON_KEY=your-main-supabase-anon-key
   MAIN_SUPABASE_SERVICE_ROLE_KEY=your-main-supabase-service-role-key

   # JWT Secret for token signing
   JWT_SECRET=your-secret-key-min-32-chars
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase project:
   ```bash
   # Developer Portal Database
   psql -h your-dev-db-host -U postgres -d postgres -f database/enhanced_schema.sql
   
   # Main CatalystWells Database (if separate)
   psql -h your-main-db-host -U postgres -d postgres -f ../database/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The portal will be available at `http://localhost:4000`

## 📚 API Documentation

### Authentication

All API requests require an OAuth 2.0 access token:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.catalystwells.com/v1/students/me
```

### OAuth 2.0 Flow

1. **Redirect user to authorization endpoint**
   ```
   GET /api/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=YOUR_REDIRECT_URI&
     response_type=code&
     scope=student.profile.read student.attendance.read&
     state=RANDOM_STATE&
     code_challenge=BASE64URL_ENCODED_CHALLENGE&
     code_challenge_method=S256
   ```

2. **Exchange authorization code for tokens**
   ```bash
   curl -X POST https://developer.catalystwells.com/api/oauth/token \
     -d "grant_type=authorization_code" \
     -d "code=AUTHORIZATION_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=YOUR_REDIRECT_URI" \
     -d "code_verifier=PLAIN_TEXT_VERIFIER"
   ```

3. **Use the access token**
   ```bash
   curl -H "Authorization: Bearer ACCESS_TOKEN" \
     https://api.catalystwells.com/v1/students/me
   ```

### Available Scopes

| Scope | Description | Risk Level |
|-------|-------------|------------|
| `openid` | OpenID Connect authentication | Low |
| `profile.read` | Basic profile information | Low |
| `email.read` | Email address | Low |
| `student.profile.read` | Student profile and enrollment | Medium |
| `student.attendance.read` | Attendance records | Medium |
| `student.academic.read` | Grades and academic performance | High |
| `student.timetable.read` | Class schedule | Low |
| `teacher.profile.read` | Teacher profile | Medium |
| `parent.profile.read` | Parent profile and children | High |
| `school.structure.read` | School organization | Low |
| `wellbeing.mood.read` | Aggregated mood data | High |
| `notifications.send` | Send notifications | Medium |

### Example API Calls

**Get current student profile:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  https://api.catalystwells.com/v1/students/me
```

**Get student attendance:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.catalystwells.com/v1/attendance/student/STUDENT_ID?month=2024-01"
```

**Get student marks:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.catalystwells.com/v1/students/STUDENT_ID/marks?term=1&academic_year=2024"
```

**Get school information:**
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.catalystwells.com/v1/schools/SCHOOL_ID?include=grades,stats"
```

## 🔐 Security

### Token Security
- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- All tokens are hashed before storage
- PKCE required for public clients

### API Security
- Rate limiting: 100 requests/minute per application
- HTTPS only in production
- CORS configured per application
- Row Level Security (RLS) on all database tables

### Webhook Security
- HMAC-SHA256 signatures on all webhook deliveries
- Timestamp validation to prevent replay attacks
- IP allowlisting (optional)
- Secret rotation support

## 📊 Database Schema

The developer portal uses two databases:

1. **Developer Portal Database** (`developer/database/enhanced_schema.sql`)
   - Developer accounts and teams
   - Applications and credentials
   - API keys and webhooks
   - Analytics and logs

2. **Main CatalystWells Database** (`database/schema.sql`)
   - Students, teachers, parents
   - Schools and classes
   - Attendance and academic records
   - OAuth authorization data

## 🧪 Testing

### Sandbox Mode

All applications start in sandbox mode with:
- Test data for 500+ students
- 50+ teachers across 5 schools
- Full academic year of attendance
- Sample exam results and grades
- No rate limits

### API Playground

Use the built-in API Playground at `/dashboard/playground` to:
- Test all API endpoints interactively
- View request/response examples
- Generate code snippets
- Debug API calls

## 🚀 Deployment

### Environment Setup

1. Set production environment variables
2. Configure Supabase production instance
3. Set up SSL certificates
4. Configure CORS origins

### Build for Production

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t catalystwells-developer .
docker run -p 4000:4000 catalystwells-developer
```

## 📖 Additional Resources

- [API Reference](https://developer.catalystwells.com/docs)
- [OAuth 2.0 Guide](https://developer.catalystwells.com/docs/oauth)
- [Webhooks Guide](https://developer.catalystwells.com/docs/webhooks)
- [Best Practices](https://developer.catalystwells.com/docs/best-practices)

## 🤝 Support

- **Documentation**: [developer.catalystwells.com/docs](https://developer.catalystwells.com/docs)
- **Support Portal**: [developer.catalystwells.com/support](https://developer.catalystwells.com/support)
- **Email**: developer-support@catalystwells.com

## 📄 License

Copyright © 2024 CatalystWells. All rights reserved.

## 🎯 Roadmap

- [x] OAuth 2.0 implementation
- [x] Core Education APIs
- [x] Webhooks system
- [x] API Playground
- [ ] Sandbox data generation
- [ ] Wellbeing APIs
- [ ] AI/Insights APIs
- [ ] Admin review dashboard
- [ ] App marketplace
- [ ] SDK libraries (JavaScript, Python, PHP)
