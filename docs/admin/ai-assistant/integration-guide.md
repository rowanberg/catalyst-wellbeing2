# Gemini 3 Integration Guide for CatalystWells Admin MCP Server

This guide explains how to integrate the CatalystWells MCP Tool Server with Gemini 3 AI runtime for the admin AI assistant interface.

## Overview

**Architecture:**
```
Admin UI (catalystwells.in/admin/ai-assistant)
    ↓
Gemini 3 AI Runtime
    ↓
MCP Server (stdio)
    ↓
CatalystWells Admin APIs
```

## Server Setup

### 1. Install Dependencies

```bash
cd c:\projects\kids\catalyst\mcp-server
npm install
```

### 2. Configure Environment

Create `.env` file:
```env
CATALYST_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NODE_ENV=development
```

### 3. Build the Server

```bash
npm run build
```

### 4. Test the Server

```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/server.js

# Or run in dev mode
npm run dev
```

## Gemini 3 Integration

### Connection Method

The MCP server uses **stdio transport** (standard input/output). Gemini 3 should:

1. Spawn MCP server as a child process
2. Connect to stdin/stdout streams
3. Send MCP protocol messages via stdin
4. Receive responses via stdout
5. Handle stderr for logging

### Example Connection (Node.js)

```typescript
import { spawn } from 'child_process'

const mcpServer = spawn('node', ['dist/server.js'], {
  cwd: 'c:\\projects\\kids\\catalyst\\mcp-server',
  stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
})

// Send MCP messages to stdin
mcpServer.stdin.write(JSON.stringify(mcpMessage) + '\n')

// Receive responses from stdout
mcpServer.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString())
  // Handle response
})
```

## Domain-Based Tool Routing

The admin UI app performs simple keyword-based domain detection:

### Keyword Mapping

```javascript
const domainKeywords = {
  attendance: ['att', 'atd', 'present', 'absent', 'attendance'],
  students: ['stud', 'student', 'profile', 'pupil'],
  teachers: ['teach', 'teacher', 'staff', 'faculty'],
  classes: ['class', 'section', 'grade', 'room'],
  fees: ['fee', 'payment', 'paid', 'due'],
  wellbeing: ['well', 'wellbeing', 'emotion', 'mood', 'mental'],
  exams: ['exam', 'test', 'result', 'score', 'grade'],
  communication: ['email', 'notify', 'message', 'broadcast'],
}
```

### Tool Selection Flow

1. **User Input**: "Show me attendance for class 10-A"
2. **Domain Detection**: Keywords "attendance" and "class" → Select `attendanceTools` and `classTools`
3. **Send to Gemini**: Pass user message + relevant tool subset
4. **Gemini Selects Tool**: Chooses `getClassAttendance` from available tools
5. **Execute & Return**: MCP server executes tool and returns results

## Tool Discovery

Gemini 3 can discover all available tools:

### List Tools Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "getAdminDashboard",
        "description": "Get comprehensive dashboard overview...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "school_id": { "type": "string", "description": "School UUID" }
          },
          "required": ["school_id"]
        }
      },
      // ... more tools
    ]
  }
}
```

## Tool Execution

### Standard Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "searchStudents",
    "arguments": {
      "school_id": "123e4567-e89b-12d3-a456-426614174000",
      "search": "John",
      "page": 1,
      "limit": 20
    }
  }
}
```

### Standard Response

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"data\":{\"students\":[...],\"total\":15}}"
      }
    ]
  }
}
```

## Confirmation Workflow

### Write Operation Tool Call

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "updateStudentInfo",
    "arguments": {
      "student_id": "abc123",
      "email": "newemail@example.com"
    }
  }
}
```

### Confirmation Response

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"requiresConfirmation\":true,\"confirmationId\":\"confirm_1234567890_xyz\",\"message\":\"⚠️  CONFIRMATION REQUIRED\\n\\nAction: Update Student Information\\nTarget: Student ID: abc123\\n\\nChanges:\\n  • Email: old@example.com → newemail@example.com\\n\\nPlease reply with:\\n  • \\\"Accept\\\" to proceed\\n  • \\\"Decline\\\" to cancel\"}"
      }
    ]
  }
}
```

### Gemini Shows Confirmation to User

Gemini should:
1. Parse the confirmation message
2. Display it to the user
3. Wait for user response ("Accept" or "Decline")

### User Accepts

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "confirm",
    "arguments": {
      "confirmationId": "confirm_1234567890_xyz"
    }
  }
}
```

### Execution Response

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\":true,\"message\":\"✅ Successfully updated student information\",\"data\":{...}}"
      }
    ]
  }
}
```

## Error Handling

### Tool Not Found

```json
{
  "success": false,
  "error": "Tool 'unknownTool' not found"
}
```

### Validation Error

```json
{
  "success": false,
  "error": "Invalid school_id format: Expected UUID"
}
```

### API Error

```json
{
  "success": false,
  "error": "Failed to fetch students: Network error"
}
```

## Typo Handling

Gemini 3 handles typo correction automatically:

**User Input:** "show atendnce for today"
  ↓
**Gemini Understands:** "Show attendance for today"
  ↓
**Calls Tool:** `getTodayAttendance`

The app's keyword matching is forgiving:
- "att" → attendance domain
- "atendnce" → Gemini corrects → attendance tools selected

## Best Practices

### 1. School ID Context

Always maintain school_id in conversation context:

```typescript
const conversationContext = {
  school_id: userSchoolId, // Get from session
  user_role: 'admin',
}
```

Pass school_id to every tool call that requires it.

### 2. Error Display

Format errors nicely for users:

```typescript
if (!result.success) {
  displayToUser(`❌ Error: ${result.error}`)
} else {
  displayResults(result.data)
}
```

### 3. Confirmation UX

Show confirmations prominently:

```typescript
if (result.requiresConfirmation) {
  const userChoice = await showConfirmationDialog(
    result.message,
    ['Accept', 'Decline']
  )
  
  if (userChoice === 'Accept') {
    await callTool('confirm', {
      confirmationId: result.confirmationId
    })
  }
}
```

### 4. Loading States

Show loading indicators during tool execution:

```typescript
showLoading('Fetching students...')
const result = await callTool('searchStudents', args)
hideLoading()
```

## Example Conversations

### Example 1: Dashboard Overview

**User:** "Show me the dashboard"

**Gemini:**
1. Detects intent: dashboard overview
2. Calls `getAdminDashboard` with school_id
3. Formats response:
   ```
   📊 Dashboard Overview
   
   Students: 450
   Teachers: 32
   Active Today: 387
   Help Requests: 5
   
   Wellbeing:
   - Thriving: 315 (70%)  
   - Needs Support: 90 (20%)
   - At Risk: 45 (10%)
   ```

### Example 2: Search with Confirmation

**User:** "Find students named John and update John Smith's email to john.smith@school.com"

**Gemini:**
1. Calls `searchStudents` with search="John"
2. Shows results
3. Calls `updateStudentInfo` for John Smith
4. Shows confirmation dialog
5. User clicks "Accept"
6. Calls `confirm` with confirmationId
7. Shows success message

## Deployment

### Production Configuration

```env
CATALYST_API_URL=https://catalystwells.in/api
NODE_ENV=production
LOG_LEVEL=error
```

### Start Server

```bash
cd c:\projects\kids\catalyst\mcp-server
node dist/server.js
```

### Process Management

Use PM2 or similar for production:

```bash
pm2 start dist/server.js --name mcp-admin-server
pm2 save
```

## Troubleshooting

### Server Not Starting

Check:
- Node.js version >= 18.0.0
- Dependencies installed (`npm install`)
- .env file configured
- Port not already in use

### Tools Not Working

Check:
- API server running (localhost:3000)
- SUPABASE_SERVICE_ROLE_KEY set correctly
- school_id is valid UUID
- Network connectivity

### Confirmation Not Working

Check:
- confirmationId is being passed correctly
- Confirmation not expired (5 minute timeout)
- Using correct confirmation method (`confirm` or `accept`)

## Support

For issues or questions:
1. Check server logs (stderr output)
2. Test individual tools with MCP Inspector
3. Verify API endpoints are accessible
4. Review this integration guide
