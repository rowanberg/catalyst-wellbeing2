# Quick Start: CatalystWells Admin MCP Server

## Prerequisites
- Node.js >= 18.0.0
- CatalystWells API running on localhost:3000

## Setup (First Time)

```bash
# 1. Navigate to MCP server
cd c:\projects\kids\catalyst\mcp-server

# 2. Install dependencies (if not already done)
npm install

# 3. Copy environment template
copy .env.example .env

# 4. Edit .env file with your credentials
# Set: CATALYST_API_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 5. Build the server
npm run build
```

## Run the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Test the Server

### With MCP Inspector (Interactive)
```bash
npx @modelcontextprotocol/inspector node dist/server.js
```

This opens a web interface where you can:
- Browse all 36 tools
- Test tool execution
- View request/response

### Manual Test
```bash
# Server should output:
🚀 CatalystWells Admin MCP Server
📊 Registered 36 tools across 7 categories:
   • Dashboard: 4 tools
   • Students: 8 tools
   • Attendance: 5 tools  
   • Classes: 6 tools
   • Teachers: 5 tools
   • Communication: 4 tools
   • Security: 4 tools

✅ MCP Server ready and listening on stdio
⚡ Waiting for tool requests...
```

## Available Tools

### Dashboard (4)
- getAdminDashboard
- getSchoolStats
- getAttendanceOverview
- getWellbeingOverview

### Students (8)
- searchStudents
- getStudentInfo
- updateStudentInfo ⚠️
- addStudent ⚠️
- disableStudent ⚠️
- getStudentAttendance
- getStudentWellbeing
- getStudentFees

### Attendance (5)
- getTodayAttendance
- getAttendanceByDate
- getClassAttendance
- updateAttendance ⚠️
- markClassAttendance ⚠️

### Classes (6)
- getClassList
- createClass ⚠️
- updateClass ⚠️
- deleteClass ⚠️
- getClassDetails
- getTimetable

### Teachers (5)
- searchTeachers
- getTeacherProfile
- addTeacher ⚠️
- updateTeacher ⚠️
- getTeacherTimetable

### Communication (4)
- sendEmail ⚠️
- sendNotification ⚠️
- broadcastToClass ⚠️
- broadcastToSchool ⚠️

### Security (4)
- getAdminList
- createAdmin ⚠️
- updateAdmin ⚠️
- getAuditLogs

⚠️ = Requires user confirmation

## Integration with Admin UI

The admin AI assistant at `/admin/ai-assistant` should:

1. Spawn this server as a child process
2. Connect to stdio streams
3. Send MCP protocol messages
4. Handle tool responses
5. Show confirmations to user

See `docs/admin/ai-assistant/integration-guide.md` for details.

## Troubleshooting

### Port Already in Use
MCP server uses stdio (not HTTP), so no port conflicts.

### API Not Responding
- Check CatalystWells API is running: http://localhost:3000
- Verify CATALYST_API_URL in .env
- Check SUPABASE_SERVICE_ROLE_KEY is correct

### Build Errors
```bash
npm run type-check  # Check TypeScript errors
npm install         # Reinstall dependencies
```

### Tool Execution Errors
- Verify school_id format (must be UUID)
- Check API endpoint exists
- Review server logs (stderr output)

## Documentation

- `README.md` - Full documentation
- `docs/admin/ai-assistant/integration-guide.md` - Gemini 3 integration
- Source code in `src/` - Well-commented

## Support

Check server logs for debugging:
- Tool calls logged with 📞
- Confirmations logged with ⏸️
- Success logged with ✅
- Errors logged with ❌
