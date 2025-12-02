# CatalystWells Admin MCP Server

Model Context Protocol (MCP) server providing 36+ tools for the CatalystWells Admin Dashboard. This server enables Gemini 3 AI to interact with admin APIs through structured, type-safe tools with built-in confirmation workflows for write operations.

## 🎯 Overview

- **53+ Tools** across 12 admin categories
- **Type-safe** with Zod schema validation
- **Confirmation workflows** for all write operations (create/update/delete)
- **Admin-only scope** - restricted to admin dashboard APIs
- **Built with** Node.js, TypeScript, and MCP SDK

## 📦 Installation

```bash
cd c:\projects\kids\catalyst\mcp-server
npm install
```

## ⚙️ Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```env
CATALYST_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
LOG_LEVEL=info
```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Testing

#### Validate Schemas
```bash
npm run test:schemas
```

#### Validate API Endpoints
```bash
npm run test:endpoints
```

#### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

## 🛠️ Available Tools

### Dashboard (4 tools)
- `getAdminDashboard` - Comprehensive dashboard overview
- `getSchoolStats` - School-wide statistics
- `getAttendanceOverview` - Daily attendance summary
- `getWellbeingOverview` - Wellbeing metrics

### Students (8 tools)
- `searchStudents` - Search and filter students
- `getStudentInfo` - Student profile details
- `updateStudentInfo` - Update student (with confirmation)
- `addStudent` - Create student (with confirmation)
- `disableStudent` - Deactivate student (with confirmation)
- `getStudentAttendance` - Student attendance history
- `getStudentWellbeing` - Student wellbeing data
- `getStudentFees` - Student fee records

### Attendance (5 tools)
- `getTodayAttendance` - Today's attendance
- `getAttendanceByDate` - Historical attendance
- `getClassAttendance` - Class-specific attendance
- `updateAttendance` - Update record (with confirmation)
- `markClassAttendance` - Bulk mark class (with confirmation)

### Classes (6 tools)
- `getClassList` - List all classes
- `createClass` - Create new class (with confirmation)
- `updateClass` - Update class (with confirmation)
- `deleteClass` - Delete class (with confirmation)
- `getClassDetails` - Class information
- `getTimetable` - Class timetable

### Teachers (5 tools)
- `searchTeachers` - Search teachers
- `getTeacherProfile` - Teacher details
- `addTeacher` - Create teacher (with confirmation)
- `updateTeacher` - Update teacher (with confirmation)
- `getTeacherTimetable` - Teacher schedule

### Communication (4 tools)
- `sendEmail` - Send email (with confirmation)
- `sendNotification` - Push notification (with confirmation)
- `broadcastToClass` - Class broadcast (with confirmation)
- `broadcastToSchool` - School announcement (with confirmation)

### Security (4 tools)
- `getAdminList` - List administrators
- `createAdmin` - Create admin (with confirmation)
- `updateAdmin` - Update admin (with confirmation)
- `getAuditLogs` - View audit logs

## 🔒 Confirmation Workflow

All write operations require user confirmation:

1. Tool is called with intended action
2. Server generates confirmation message showing:
   - Action to be performed
   - Target entity
   - Changes to be made
   - Warnings (if applicable)
3. User responds with "Accept" or "Decline"
4. Server executes or cancels based on response

Example:
```
⚠️  CONFIRMATION REQUIRED

Action: Update Student Information
Target: Student ID: 123

Changes:
  • Email: old@example.com → new@example.com
  • First Name: John → Jonathan

Please reply with:
  • "Accept" to proceed with this action
  • "Decline" to cancel
```

## 🔌 Integration with Gemini 3 AI

The MCP server communicates via stdio. To integrate:

1. Start the MCP server
2. Connect Gemini 3 runtime to stdio streams
3. Gemini discovers tools via `listTools`
4. Gemini calls tools via `callTool`
5. Server executes and returns results

See [Integration Guide](../docs/admin/ai-assistant/integration-guide.md) for details.

## 📁 Project Structure

```
mcp-server/
├── src/
│   ├── server.ts              # Main MCP server
│   ├── tools/
│   │   ├── dashboard-tools.ts
│   │   ├── student-tools.ts
│   │   ├── attendance-tools.ts
│   │   ├── class-tools.ts
│   │   ├── teacher-tools.ts
│   │   ├── communication-tools.ts
│   │   └── security-tools.ts
│   └── utils/
│       ├── api-client.ts      # HTTP client with auth
│       ├── schemas.ts         # Zod validation schemas
│       └── confirmation.ts    # Confirmation workflows
├── package.json
├── tsconfig.json
└── .env.example
```

## 🧪 Development

### Type Checking
```bash
npm run type-check
```

### Watch Mode
```bash
npm run dev
```

### Logging

The server logs to stderr for debugging:
- `🚀` Server startup
- `📞` Tool calls
- `⏸️` Confirmation requests
- `✅` Successful operations
- `❌` Errors

## 🔐 Security

- Uses Supabase service role key for admin operations
- All API requests include authentication headers
- Confirmation required for destructive actions
- Audit logging via `getAuditLogs` tool

## 📝 API Routes

The MCP server calls these CatalystWells API routes:

- `/api/admin/stats` - Statistics
- `/api/admin/students` - Student management
- `/api/admin/attendance` - Attendance tracking
- `/api/admin/classes` - Class management
- `/api/admin/users` - User management
- `/api/admin/timetable/entries` - Timetables
- `/api/admin/wellbeing-*` - Wellbeing data
- `/api/admin/announcements` - Communications
- `/api/admin/activity-monitor` - Audit logs

## 🤝 Contributing

When adding new tools:

1. Create tool definition in appropriate category file
2. Add Zod schemas to `utils/schemas.ts`
3. Implement confirmation for write operations
4. Add tool to category export
5. Update this README

## 📄 License

MIT
