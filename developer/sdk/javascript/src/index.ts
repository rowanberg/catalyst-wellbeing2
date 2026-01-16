/**
 * CatalystWells JavaScript/TypeScript SDK
 * 
 * Official SDK for the CatalystWells Education Platform API
 * 
 * @version 1.0.0
 * @license MIT
 */

export interface CatalystWellsConfig {
    clientId: string
    clientSecret?: string
    redirectUri?: string
    environment?: 'sandbox' | 'production'
    baseUrl?: string
}

export interface TokenResponse {
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in: number
    scope: string
}

export interface Student {
    id: string
    enrollment_number: string
    name: string
    grade: string
    section: string
    roll_number?: number
    avatar_url?: string
    school?: {
        id: string
        name: string
        code: string
    }
}

export interface AttendanceRecord {
    date: string
    status: 'present' | 'absent' | 'late' | 'excused'
    check_in_time?: string
    check_out_time?: string
}

export interface MoodData {
    mood_level: number
    mood_emoji: string
    energy_level: number
    stress_level: number
    recorded_at: string
}

export class CatalystWellsError extends Error {
    constructor(
        public code: string,
        public description: string,
        public status: number
    ) {
        super(description)
        this.name = 'CatalystWellsError'
    }
}

export class CatalystWells {
    private config: CatalystWellsConfig
    private accessToken: string | null = null
    private refreshToken: string | null = null
    private tokenExpiry: Date | null = null
    private baseUrl: string

    constructor(config: CatalystWellsConfig) {
        this.config = config
        this.baseUrl = config.baseUrl ||
            (config.environment === 'production'
                ? 'https://developer.catalystwells.com'
                : 'https://sandbox.catalystwells.com')
    }

    // ==================== Authentication ====================

    /**
     * Generate OAuth authorization URL
     */
    getAuthorizationUrl(scopes: string[], state?: string, codeChallenge?: string): string {
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri || '',
            response_type: 'code',
            scope: scopes.join(' '),
            state: state || this.generateState()
        })

        if (codeChallenge) {
            params.append('code_challenge', codeChallenge)
            params.append('code_challenge_method', 'S256')
        }

        return `${this.baseUrl}/api/oauth/authorize?${params.toString()}`
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string, codeVerifier?: string): Promise<TokenResponse> {
        const body: Record<string, string> = {
            grant_type: 'authorization_code',
            code,
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri || ''
        }

        if (this.config.clientSecret) {
            body.client_secret = this.config.clientSecret
        }
        if (codeVerifier) {
            body.code_verifier = codeVerifier
        }

        const response = await this.request('/api/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(body).toString()
        })

        this.setTokens(response)
        return response
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(): Promise<TokenResponse> {
        if (!this.refreshToken) {
            throw new CatalystWellsError('no_refresh_token', 'No refresh token available', 401)
        }

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            client_id: this.config.clientId
        })

        if (this.config.clientSecret) {
            body.append('client_secret', this.config.clientSecret)
        }

        const response = await this.request('/api/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        })

        this.setTokens(response)
        return response
    }

    /**
     * Set tokens manually (for server-side usage)
     */
    setTokens(tokens: TokenResponse): void {
        this.accessToken = tokens.access_token
        this.refreshToken = tokens.refresh_token || null
        this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)
    }

    /**
     * Revoke tokens
     */
    async revokeToken(token?: string): Promise<void> {
        await this.request('/api/oauth/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: token || this.accessToken || '',
                client_id: this.config.clientId
            }).toString()
        })

        if (!token || token === this.accessToken) {
            this.accessToken = null
            this.refreshToken = null
            this.tokenExpiry = null
        }
    }

    // ==================== Students API ====================

    /**
     * Get current student profile
     */
    async getCurrentStudent(): Promise<Student> {
        return this.authenticatedRequest('/api/v1/students/me')
    }

    /**
     * Get student by ID
     */
    async getStudent(studentId: string): Promise<Student> {
        return this.authenticatedRequest(`/api/v1/students/${studentId}`)
    }

    /**
     * Get student academic marks
     */
    async getStudentMarks(studentId: string, options?: {
        term?: string
        subject?: string
        academic_year?: string
    }): Promise<any> {
        const params = new URLSearchParams()
        if (options?.term) params.append('term', options.term)
        if (options?.subject) params.append('subject', options.subject)
        if (options?.academic_year) params.append('academic_year', options.academic_year)

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/students/${studentId}/marks${query}`)
    }

    // ==================== Attendance API ====================

    /**
     * Get student attendance
     */
    async getStudentAttendance(studentId: string, options?: {
        start_date?: string
        end_date?: string
        month?: string
        limit?: number
    }): Promise<{ summary: any; records: AttendanceRecord[] }> {
        const params = new URLSearchParams()
        if (options?.start_date) params.append('start_date', options.start_date)
        if (options?.end_date) params.append('end_date', options.end_date)
        if (options?.month) params.append('month', options.month)
        if (options?.limit) params.append('limit', String(options.limit))

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/attendance/student/${studentId}${query}`)
    }

    // ==================== Timetable API ====================

    /**
     * Get student timetable
     */
    async getStudentTimetable(studentId: string, day?: string): Promise<any> {
        const query = day ? `?day=${day}` : ''
        return this.authenticatedRequest(`/api/v1/timetable/student/${studentId}${query}`)
    }

    // ==================== Wellbeing API ====================

    /**
     * Get current mood (requires consent)
     */
    async getCurrentMood(studentId?: string, aggregated = false): Promise<MoodData | any> {
        const params = new URLSearchParams()
        if (studentId) params.append('student_id', studentId)
        if (aggregated) params.append('aggregated', 'true')

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/wellbeing/mood/current${query}`)
    }

    /**
     * Get mood history
     */
    async getMoodHistory(studentId: string, days = 30, limit = 50): Promise<any> {
        return this.authenticatedRequest(
            `/api/v1/wellbeing/mood/history?student_id=${studentId}&days=${days}&limit=${limit}`
        )
    }

    /**
     * Get behavior summary
     */
    async getBehaviorSummary(options?: {
        student_id?: string
        class_id?: string
        period?: 'week' | 'month' | 'term'
    }): Promise<any> {
        const params = new URLSearchParams()
        if (options?.student_id) params.append('student_id', options.student_id)
        if (options?.class_id) params.append('class_id', options.class_id)
        if (options?.period) params.append('period', options.period)

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/wellbeing/behavior/summary${query}`)
    }

    // ==================== Schools API ====================

    /**
     * Get school information
     */
    async getSchool(schoolId: string, include?: string[]): Promise<any> {
        const query = include ? `?include=${include.join(',')}` : ''
        return this.authenticatedRequest(`/api/v1/schools/${schoolId}${query}`)
    }

    // ==================== Classes API ====================

    /**
     * Get class information
     */
    async getClass(classId: string, include?: string[]): Promise<any> {
        const query = include ? `?include=${include.join(',')}` : ''
        return this.authenticatedRequest(`/api/v1/classes/${classId}${query}`)
    }

    // ==================== Assignments & Homework ====================

    /**
     * Get assignments
     */
    async getAssignments(options?: {
        student_id?: string
        class_id?: string
        subject_id?: string
        status?: 'pending' | 'submitted' | 'graded' | 'overdue'
        limit?: number
    }): Promise<any> {
        const params = new URLSearchParams()
        if (options?.student_id) params.append('student_id', options.student_id)
        if (options?.class_id) params.append('class_id', options.class_id)
        if (options?.subject_id) params.append('subject_id', options.subject_id)
        if (options?.status) params.append('status', options.status)
        if (options?.limit) params.append('limit', String(options.limit))

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/assignments${query}`)
    }

    /**
     * Get homework
     */
    async getHomework(options?: {
        student_id?: string
        class_id?: string
        upcoming?: boolean
        overdue?: boolean
        limit?: number
    }): Promise<any> {
        const params = new URLSearchParams()
        if (options?.student_id) params.append('student_id', options.student_id)
        if (options?.class_id) params.append('class_id', options.class_id)
        if (options?.upcoming) params.append('upcoming', 'true')
        if (options?.overdue) params.append('overdue', 'true')
        if (options?.limit) params.append('limit', String(options.limit))

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/homework${query}`)
    }

    // ==================== Notifications ====================

    /**
     * Send notification to user
     */
    async sendNotification(userId: string, options: {
        title: string
        message: string
        type?: 'info' | 'success' | 'warning' | 'error' | 'announcement'
        priority?: 'low' | 'normal' | 'high' | 'urgent'
        action_url?: string
        action_label?: string
        data?: Record<string, any>
    }): Promise<{ notification_id: string }> {
        return this.authenticatedRequest('/api/v1/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, ...options })
        })
    }

    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(userIds: string[], options: {
        title: string
        message: string
        type?: string
        priority?: string
    }): Promise<{ total_sent: number }> {
        return this.authenticatedRequest('/api/v1/notifications/send', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_ids: userIds, ...options })
        })
    }

    // ==================== Announcements ====================

    /**
     * Get announcements
     */
    async getAnnouncements(options?: {
        school_id?: string
        grade_id?: string
        class_id?: string
        category?: string
        limit?: number
    }): Promise<any> {
        const params = new URLSearchParams()
        if (options?.school_id) params.append('school_id', options.school_id)
        if (options?.grade_id) params.append('grade_id', options.grade_id)
        if (options?.class_id) params.append('class_id', options.class_id)
        if (options?.category) params.append('category', options.category)
        if (options?.limit) params.append('limit', String(options.limit))

        const query = params.toString() ? `?${params.toString()}` : ''
        return this.authenticatedRequest(`/api/v1/announcements${query}`)
    }

    /**
     * Create announcement
     */
    async createAnnouncement(options: {
        school_id: string
        grade_id?: string
        class_id?: string
        title: string
        content: string
        category?: string
        priority?: string
        expires_at?: string
    }): Promise<{ announcement_id: string }> {
        return this.authenticatedRequest('/api/v1/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        })
    }

    // ==================== Privacy ====================

    /**
     * Check consent status
     */
    async getConsentStatus(userId?: string): Promise<any> {
        const query = userId ? `?user_id=${userId}` : ''
        return this.authenticatedRequest(`/api/v1/privacy/consent${query}`)
    }

    /**
     * Request consent for data access
     */
    async requestConsent(userId: string, consentType: string, options?: {
        scope?: string[]
        purpose?: string
        expires_in_days?: number
    }): Promise<{ request_id: string }> {
        return this.authenticatedRequest('/api/v1/privacy/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                consent_type: consentType,
                ...options
            })
        })
    }

    // ==================== Helpers ====================

    private generateState(): string {
        const array = new Uint8Array(32)
        crypto.getRandomValues(array)
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    }

    private async request(path: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseUrl}${path}`
        const response = await fetch(url, options)

        const data = await response.json()

        if (!response.ok) {
            throw new CatalystWellsError(
                data.error || 'unknown_error',
                data.error_description || data.message || 'Unknown error',
                response.status
            )
        }

        return data
    }

    private async authenticatedRequest(path: string, options: RequestInit = {}): Promise<any> {
        // Auto-refresh if token is expired or about to expire
        if (this.tokenExpiry && this.tokenExpiry.getTime() < Date.now() + 60000) {
            if (this.refreshToken) {
                await this.refreshAccessToken()
            }
        }

        if (!this.accessToken) {
            throw new CatalystWellsError('not_authenticated', 'No access token available', 401)
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`
        }

        return this.request(path, { ...options, headers })
    }
}

// Export default instance factory
export function createClient(config: CatalystWellsConfig): CatalystWells {
    return new CatalystWells(config)
}

export default CatalystWells
