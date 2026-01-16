'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Code2,
    Zap,
    Clock,
    AlertCircle,
    CheckCircle,
    Book,
    Terminal,
    Braces,
    FileJson,
    ExternalLink,
    History,
    Loader2,
    Sparkles,
    Settings,
    RefreshCw
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface ApiEndpoint {
    id: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path: string
    description: string
    category: string
    scopes: string[]
    parameters?: Parameter[]
    requestBody?: any
    exampleResponse?: any
}

interface Parameter {
    name: string
    type: string
    required: boolean
    description: string
    example?: string
}

const apiEndpoints: ApiEndpoint[] = [
    // Student APIs
    {
        id: 'get-student-me',
        name: 'Get Current Student',
        method: 'GET',
        path: '/api/v1/students/me',
        description: 'Get the currently authenticated student profile',
        category: 'Students',
        scopes: ['student.profile.read'],
        exampleResponse: {
            id: 'stu_abc123',
            name: 'John Doe',
            email: 'john@school.edu',
            grade: '10',
            section: 'A',
            avatar_url: 'https://...',
            school: { id: 'sch_123', name: 'Demo High School' }
        }
    },
    {
        id: 'get-student-attendance',
        name: 'Get Student Attendance',
        method: 'GET',
        path: '/api/v1/attendance/student/{id}',
        description: 'Get attendance records for a specific student',
        category: 'Attendance',
        scopes: ['student.attendance.read'],
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Student ID', example: 'stu_abc123' },
            { name: 'start_date', type: 'date', required: false, description: 'Start date (YYYY-MM-DD)', example: '2024-01-01' },
            { name: 'end_date', type: 'date', required: false, description: 'End date (YYYY-MM-DD)', example: '2024-01-31' }
        ],
        exampleResponse: {
            student_id: 'stu_abc123',
            total_days: 20,
            present: 18,
            absent: 1,
            late: 1,
            attendance_rate: 0.95,
            records: [
                { date: '2024-01-15', status: 'present', arrival_time: '08:45' },
                { date: '2024-01-16', status: 'late', arrival_time: '09:15' }
            ]
        }
    },
    {
        id: 'get-student-grades',
        name: 'Get Student Grades',
        method: 'GET',
        path: '/api/v1/students/{id}/marks',
        description: 'Get academic grades and marks for a student',
        category: 'Academics',
        scopes: ['student.academic.read'],
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Student ID', example: 'stu_abc123' },
            { name: 'term', type: 'string', required: false, description: 'Academic term', example: 'Term 1' }
        ],
        exampleResponse: {
            student_id: 'stu_abc123',
            term: 'Term 1',
            gpa: 3.75,
            subjects: [
                { name: 'Mathematics', grade: 'A', marks: 92, max_marks: 100 },
                { name: 'Science', grade: 'A-', marks: 88, max_marks: 100 }
            ]
        }
    },
    {
        id: 'get-timetable-student',
        name: 'Get Student Timetable',
        method: 'GET',
        path: '/api/v1/timetable/student/{id}',
        description: 'Get the class schedule for a student',
        category: 'Timetable',
        scopes: ['student.timetable.read'],
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Student ID', example: 'stu_abc123' }
        ],
        exampleResponse: {
            student_id: 'stu_abc123',
            week: 'Monday-Friday',
            schedule: {
                monday: [
                    { period: 1, subject: 'Mathematics', time: '08:00-08:45', teacher: 'Ms. Smith' }
                ]
            }
        }
    },
    {
        id: 'get-teacher-me',
        name: 'Get Current Teacher',
        method: 'GET',
        path: '/api/v1/teachers/me',
        description: 'Get the currently authenticated teacher profile',
        category: 'Teachers',
        scopes: ['teacher.profile.read'],
        exampleResponse: {
            id: 'tch_xyz789',
            name: 'Jane Smith',
            email: 'jane.smith@school.edu',
            department: 'Mathematics',
            subjects: ['Algebra', 'Geometry'],
            classes: ['10-A', '10-B', '11-A']
        }
    },
    {
        id: 'get-parent-me',
        name: 'Get Current Parent',
        method: 'GET',
        path: '/api/v1/parents/me',
        description: 'Get the currently authenticated parent profile with children',
        category: 'Parents',
        scopes: ['parent.profile.read'],
        exampleResponse: {
            id: 'par_123',
            name: 'Robert Johnson',
            children: [
                { id: 'stu_456', name: 'Emma Johnson', grade: '8', relationship: 'father' }
            ]
        }
    },
    {
        id: 'get-school-structure',
        name: 'Get School Structure',
        method: 'GET',
        path: '/api/v1/schools/{id}',
        description: 'Get school details and organizational structure',
        category: 'Schools',
        scopes: ['school.structure.read'],
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'School ID', example: 'sch_123' }
        ],
        exampleResponse: {
            id: 'sch_123',
            name: 'Demo High School',
            type: 'high_school',
            address: '123 Education St',
            grades: ['9', '10', '11', '12'],
            student_count: 500
        }
    },
    {
        id: 'get-class-details',
        name: 'Get Class Details',
        method: 'GET',
        path: '/api/v1/classes/{id}',
        description: 'Get class details with optional includes for students, teachers, subjects',
        category: 'Classes',
        scopes: ['school.structure.read'],
        parameters: [
            { name: 'id', type: 'string', required: true, description: 'Class ID', example: 'cls_123' },
            { name: 'include', type: 'string', required: false, description: 'Comma-separated includes', example: 'students,teachers' }
        ],
        exampleResponse: {
            id: 'cls_123',
            name: '10-A',
            grade: '10',
            section: 'A',
            student_count: 35
        }
    },
    {
        id: 'get-mood-current',
        name: 'Get Current Mood',
        method: 'GET',
        path: '/api/v1/wellbeing/mood/current',
        description: 'Get current mood state (requires consent)',
        category: 'Wellbeing',
        scopes: ['wellbeing.mood.read'],
        parameters: [
            { name: 'student_id', type: 'string', required: false, description: 'Student ID (optional)', example: 'stu_abc123' },
            { name: 'aggregated', type: 'boolean', required: false, description: 'Return aggregated data', example: 'true' }
        ],
        exampleResponse: {
            data_type: 'aggregated',
            period: 'last_7_days',
            sample_size: 450,
            averages: { mood_level: 3.5, energy_level: 3.2, stress_level: 2.8 }
        }
    },
    {
        id: 'get-homework',
        name: 'Get Homework List',
        method: 'GET',
        path: '/api/v1/homework',
        description: 'Get homework assignments with filtering',
        category: 'Academics',
        scopes: ['student.academic.read'],
        parameters: [
            { name: 'student_id', type: 'string', required: false, description: 'Filter by student', example: 'stu_abc123' },
            { name: 'upcoming', type: 'boolean', required: false, description: 'Only upcoming', example: 'true' }
        ],
        exampleResponse: {
            total: 5,
            homework: [
                { id: 'hw_1', title: 'Math Problems Ch 5', due_date: '2024-01-20', status: 'pending' }
            ]
        }
    },
    {
        id: 'get-exams',
        name: 'Get Exams List',
        method: 'GET',
        path: '/api/v1/exams',
        description: 'Get upcoming and past exams',
        category: 'Academics',
        scopes: ['student.academic.read'],
        parameters: [
            { name: 'school_id', type: 'string', required: false, description: 'Filter by school', example: 'sch_123' },
            { name: 'upcoming', type: 'boolean', required: false, description: 'Only upcoming', example: 'true' }
        ],
        exampleResponse: {
            total: 3,
            exams: [
                { id: 'exam_1', name: 'Mid-Term Exam', date: '2024-02-15', status: 'scheduled' }
            ]
        }
    },
    {
        id: 'get-announcements',
        name: 'Get Announcements',
        method: 'GET',
        path: '/api/v1/announcements',
        description: 'Get school announcements',
        category: 'Communication',
        scopes: ['announcements.read'],
        parameters: [
            { name: 'school_id', type: 'string', required: false, description: 'Filter by school', example: 'sch_123' },
            { name: 'category', type: 'string', required: false, description: 'Category filter', example: 'general' }
        ],
        exampleResponse: {
            total: 10,
            announcements: [
                { id: 'ann_1', title: 'School Closed Friday', category: 'general', priority: 'high' }
            ]
        }
    },
    {
        id: 'send-notification',
        name: 'Send Notification',
        method: 'POST',
        path: '/api/v1/notifications/send',
        description: 'Send notification to a user',
        category: 'Notifications',
        scopes: ['notifications.send'],
        requestBody: {
            user_id: 'usr_123',
            title: 'Assignment Due',
            message: 'Your math assignment is due tomorrow',
            type: 'warning',
            priority: 'high'
        },
        exampleResponse: {
            notification_id: 'notif_abc',
            status: 'sent',
            sent_at: '2024-01-15T10:30:00Z'
        }
    },
    {
        id: 'get-consent-status',
        name: 'Get Consent Status',
        method: 'GET',
        path: '/api/v1/privacy/consent',
        description: 'Check user consent status for data access',
        category: 'Privacy',
        scopes: ['privacy.consent.read'],
        parameters: [
            { name: 'user_id', type: 'string', required: false, description: 'User ID to check', example: 'usr_123' }
        ],
        exampleResponse: {
            user_id: 'usr_123',
            consents: {
                academic_data: { granted: true, expires_at: '2025-01-01' },
                wellbeing_data: { granted: false }
            }
        }
    }
]

const categories = [...new Set(apiEndpoints.map(e => e.category))]

export default function PlaygroundPage() {
    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(apiEndpoints[0])
    const [expandedCategories, setExpandedCategories] = useState<string[]>(categories)
    const [parameters, setParameters] = useState<Record<string, string>>({})
    const [requestBody, setRequestBody] = useState<string>('')
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [responseTime, setResponseTime] = useState<number | null>(null)
    const [responseStatus, setResponseStatus] = useState<number | null>(null)
    const [copied, setCopied] = useState<string | null>(null)
    const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python'>('curl')
    const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox')
    const [applications, setApplications] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<string>('')
    const [history, setHistory] = useState<any[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [tips, setTips] = useState<string[]>([])

    useEffect(() => {
        loadApplications()
        loadHistory()
    }, [])

    useEffect(() => {
        if (selectedEndpoint.requestBody) {
            setRequestBody(JSON.stringify(selectedEndpoint.requestBody, null, 2))
        } else {
            setRequestBody('')
        }
    }, [selectedEndpoint])

    const loadApplications = async () => {
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) return

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) return

            const { data: apps } = await devSupabase
                .from('developer_applications')
                .select('id, name, environment')
                .eq('developer_id', account.id)

            if (apps && apps.length > 0) {
                setApplications(apps)
                setSelectedApp(apps[0].id)
            }
        } catch (error) {
            console.error('Error loading applications:', error)
        }
    }

    const loadHistory = async () => {
        try {
            const res = await fetch('/api/playground/execute')
            if (res.ok) {
                const data = await res.json()
                setHistory(data.requests || [])
            }
        } catch (error) {
            console.error('Error loading history:', error)
        }
    }

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    const updateParameter = (name: string, value: string) => {
        setParameters(prev => ({ ...prev, [name]: value }))
    }

    const buildUrl = () => {
        let url = selectedEndpoint.path
        selectedEndpoint.parameters?.forEach(param => {
            if (parameters[param.name]) {
                url = url.replace(`{${param.name}}`, parameters[param.name])
            }
        })

        // Add query parameters
        const queryParams = selectedEndpoint.parameters?.filter(p =>
            !selectedEndpoint.path.includes(`{${p.name}}`) && parameters[p.name]
        )
        if (queryParams && queryParams.length > 0) {
            const query = queryParams.map(p => `${p.name}=${encodeURIComponent(parameters[p.name])}`).join('&')
            url += `?${query}`
        }

        return url
    }

    const executeRequest = async () => {
        setLoading(true)
        setError(null)
        setResponse(null)
        setTips([])

        try {
            const endpoint = buildUrl()
            let body = null

            if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
                try {
                    body = JSON.parse(requestBody)
                } catch {
                    setError('Invalid JSON in request body')
                    setLoading(false)
                    return
                }
            }

            const res = await fetch('/api/playground/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    application_id: selectedApp,
                    method: selectedEndpoint.method,
                    endpoint,
                    body,
                    use_sandbox: environment === 'sandbox'
                })
            })

            const data = await res.json()

            if (data.response) {
                setResponse(data.response.body)
                setResponseTime(data.response.time_ms)
                setResponseStatus(data.response.status)
            }

            if (data.tips) {
                setTips(data.tips)
            }

            if (data.error) {
                setError(data.error)
            }

            // Refresh history
            loadHistory()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const getCodeExample = () => {
        const baseUrl = environment === 'sandbox'
            ? 'https://sandbox.catalystwells.com'
            : 'https://api.catalystwells.com'
        const url = `${baseUrl}${buildUrl()}`

        switch (codeLanguage) {
            case 'curl':
                let curlCmd = `curl -X ${selectedEndpoint.method} "${url}" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`
                if (requestBody && ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method)) {
                    curlCmd += ` \\
  -d '${requestBody.replace(/\n/g, '')}'`
                }
                return curlCmd

            case 'javascript':
                return `import { CatalystWells } from '@catalystwells/sdk'

const client = new CatalystWells({
  clientId: 'YOUR_CLIENT_ID',
  environment: '${environment}'
})

// Set your access token
client.setTokens({ access_token: 'YOUR_ACCESS_TOKEN', expires_in: 3600 })

// Make the request
const response = await fetch("${url}", {
  method: "${selectedEndpoint.method}",
  headers: {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
  }${requestBody ? `,
  body: ${requestBody}` : ''}
})

const data = await response.json()
console.log(data)`

            case 'python':
                return `from catalystwells import CatalystWells, Environment

client = CatalystWells(
    client_id="YOUR_CLIENT_ID",
    environment=Environment.${environment.toUpperCase()}
)

# Or use requests directly
import requests

response = requests.${selectedEndpoint.method.toLowerCase()}(
    "${url}",
    headers={
        "Authorization": "Bearer YOUR_ACCESS_TOKEN",
        "Content-Type": "application/json"
    }${requestBody ? `,
    json=${requestBody}` : ''}
)

data = response.json()
print(data)`

            default:
                return ''
        }
    }

    const copyCode = async () => {
        await navigator.clipboard.writeText(getCodeExample())
        setCopied('code')
        setTimeout(() => setCopied(null), 2000)
    }

    const copyResponse = async () => {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2))
        setCopied('response')
        setTimeout(() => setCopied(null), 2000)
    }

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'GET': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'PUT': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'PATCH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30'
            default: return 'bg-slate-500/20 text-slate-400'
        }
    }

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400'
        if (status >= 400 && status < 500) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-purple-400" />
                        API Playground
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Test API endpoints interactively with live responses
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {applications.length > 0 && (
                        <select
                            value={selectedApp}
                            onChange={(e) => setSelectedApp(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {applications.map((app) => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value as 'sandbox' | 'production')}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="sandbox">🧪 Sandbox</option>
                        <option value="production">🚀 Production</option>
                    </select>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2 rounded-xl border transition-colors ${showHistory
                                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                    >
                        <History className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Endpoints */}
                <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-semibold text-white">Endpoints</h3>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                            {apiEndpoints.length} APIs
                        </span>
                    </div>
                    <div className="p-2 max-h-[600px] overflow-y-auto">
                        {categories.map((category) => (
                            <div key={category} className="mb-1">
                                <button
                                    onClick={() => toggleCategory(category)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-700/50"
                                >
                                    <span>{category}</span>
                                    {expandedCategories.includes(category) ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                                <AnimatePresence>
                                    {expandedCategories.includes(category) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            {apiEndpoints
                                                .filter(e => e.category === category)
                                                .map((endpoint) => (
                                                    <button
                                                        key={endpoint.id}
                                                        onClick={() => {
                                                            setSelectedEndpoint(endpoint)
                                                            setParameters({})
                                                            setResponse(null)
                                                            setError(null)
                                                            setTips([])
                                                        }}
                                                        className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg transition-colors ${selectedEndpoint.id === endpoint.id
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                                                            }`}
                                                    >
                                                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${getMethodColor(endpoint.method)}`}>
                                                            {endpoint.method}
                                                        </span>
                                                        <span className="truncate">{endpoint.name}</span>
                                                    </button>
                                                ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Endpoint Info */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-sm font-mono px-2.5 py-1 rounded border ${getMethodColor(selectedEndpoint.method)}`}>
                                        {selectedEndpoint.method}
                                    </span>
                                    <h2 className="text-xl font-semibold text-white">{selectedEndpoint.name}</h2>
                                </div>
                                <code className="text-sm text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg inline-block">
                                    {buildUrl()}
                                </code>
                            </div>
                            <button
                                onClick={executeRequest}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                <span>{loading ? 'Sending...' : 'Send Request'}</span>
                            </button>
                        </div>

                        <p className="text-slate-400 mb-4">{selectedEndpoint.description}</p>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500">Required scopes:</span>
                            {selectedEndpoint.scopes.map((scope) => (
                                <span key={scope} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded border border-slate-600">
                                    {scope}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Parameters */}
                    {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-slate-400" />
                                Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedEndpoint.parameters.map((param) => (
                                    <div key={param.name}>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                                            <span>{param.name}</span>
                                            <span className="text-xs text-slate-500">({param.type})</span>
                                            {param.required && (
                                                <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">required</span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            value={parameters[param.name] || ''}
                                            onChange={(e) => updateParameter(param.name, e.target.value)}
                                            placeholder={param.example || param.description}
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Request Body */}
                    {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Braces className="w-5 h-5 text-slate-400" />
                                Request Body
                            </h3>
                            <textarea
                                value={requestBody}
                                onChange={(e) => setRequestBody(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-300 font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder='{"key": "value"}'
                            />
                        </div>
                    )}

                    {/* Code Example */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <div className="flex items-center gap-1 bg-slate-700/50 p-1 rounded-lg">
                                {(['curl', 'javascript', 'python'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setCodeLanguage(lang)}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${codeLanguage === lang
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JS/TS' : 'Python'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={copyCode}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors bg-slate-700/50 rounded-lg"
                            >
                                {copied === 'code' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                <span>{copied === 'code' ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        <pre className="p-4 text-sm text-slate-300 overflow-x-auto max-h-64">
                            <code>{getCodeExample()}</code>
                        </pre>
                    </div>

                    {/* Response */}
                    {(response || error) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-700">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-white">Response</h3>
                                    {responseStatus && (
                                        <span className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(responseStatus)}`}>
                                            {responseStatus >= 200 && responseStatus < 300 ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4" />
                                            )}
                                            {responseStatus}
                                        </span>
                                    )}
                                    {responseTime && (
                                        <span className="flex items-center gap-1 text-sm text-slate-400">
                                            <Clock className="w-4 h-4" />
                                            {responseTime}ms
                                        </span>
                                    )}
                                </div>
                                {response && (
                                    <button
                                        onClick={copyResponse}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors bg-slate-700/50 rounded-lg"
                                    >
                                        {copied === 'response' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                            <pre className="p-4 text-sm overflow-x-auto max-h-96">
                                <code className={error ? 'text-red-400' : 'text-slate-300'}>
                                    {error ? error : JSON.stringify(response, null, 2)}
                                </code>
                            </pre>

                            {/* Tips */}
                            {tips.length > 0 && (
                                <div className="p-4 border-t border-slate-700 bg-slate-900/30">
                                    <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Tips
                                    </p>
                                    <ul className="space-y-1">
                                        {tips.map((tip, i) => (
                                            <li key={i} className="text-sm text-slate-300">• {tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* History Panel */}
            <AnimatePresence>
                {showHistory && history.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-slate-400" />
                                Request History
                            </h3>
                            <button
                                onClick={loadHistory}
                                className="p-1.5 text-slate-400 hover:text-white transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                {history.slice(0, 10).map((req) => (
                                    <div
                                        key={req.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
                                    >
                                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getMethodColor(req.method)}`}>
                                            {req.method}
                                        </span>
                                        <code className="text-sm text-slate-300 flex-1 truncate">{req.endpoint}</code>
                                        <span className={`text-sm ${getStatusColor(req.status)}`}>{req.status}</span>
                                        <span className="text-xs text-slate-500">{req.time_ms}ms</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
