import { z } from 'zod'

// ============================================
// Common Schemas
// ============================================

export const SchoolIdSchema = z.object({
    school_id: z.string().uuid('Invalid school ID format'),
})

export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const PaginationSchema = z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

// ============================================
// Student Schemas
// ============================================

export const StudentSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    first_name: z.string(),
    last_name: z.string(),
    student_number: z.string().optional(),
    xp: z.number().default(0),
    gems: z.number().default(0),
    level: z.number().default(1),
    role: z.literal('student'),
    school_id: z.string().uuid(),
})

export const SearchStudentsInputSchema = z.object({
    school_id: z.string().uuid(),
    search: z.string().optional(),
    grade: z.string().optional(),
    class_id: z.string().uuid().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export const UpdateStudentInputSchema = z.object({
    student_id: z.string().uuid(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    student_number: z.string().optional(),
})

export const AddStudentInputSchema = z.object({
    school_id: z.string().uuid(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    student_number: z.string().optional(),
    grade_level_id: z.string().uuid().optional(),
    class_id: z.string().uuid().optional(),
})

// ============================================
// Attendance Schemas
// ============================================

export const AttendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused'])

export const AttendanceRecordSchema = z.object({
    id: z.string().uuid(),
    student_id: z.string().uuid(),
    date: DateSchema,
    status: AttendanceStatusSchema,
    notes: z.string().optional(),
    teacher_id: z.string().uuid().optional(),
    created_at: z.string().datetime(),
})

export const GetAttendanceInputSchema = z.object({
    school_id: z.string().uuid(),
    date: DateSchema.optional(),
    class_id: z.string().uuid().optional(),
    student_id: z.string().uuid().optional(),
    status: AttendanceStatusSchema.optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export const UpdateAttendanceInputSchema = z.object({
    attendance_id: z.string().uuid(),
    status: AttendanceStatusSchema,
    notes: z.string().optional(),
})

export const MarkClassAttendanceInputSchema = z.object({
    school_id: z.string().uuid(),
    class_id: z.string().uuid(),
    date: DateSchema,
    attendance_records: z.array(z.object({
        student_id: z.string().uuid(),
        status: AttendanceStatusSchema,
        notes: z.string().optional(),
    })),
})

// ============================================
// Class Schemas
// ============================================

export const ClassSchema = z.object({
    id: z.string().uuid(),
    class_name: z.string(),
    class_code: z.string().optional(),
    grade_level_id: z.string().uuid().optional(),
    room_number: z.string().optional(),
    max_students: z.number().int().positive().default(25),
    current_students: z.number().int().nonnegative().default(0),
    is_active: z.boolean().default(true),
    school_id: z.string().uuid(),
})

export const CreateClassInputSchema = z.object({
    school_id: z.string().uuid(),
    grade_level_id: z.string().uuid(),
    class_name: z.string().min(1),
    room_number: z.string().optional(),
    max_students: z.number().int().positive().default(25),
})

export const UpdateClassInputSchema = z.object({
    class_id: z.string().uuid(),
    class_name: z.string().optional(),
    room_number: z.string().optional(),
    max_students: z.number().int().positive().optional(),
})

export const DeleteClassInputSchema = z.object({
    school_id: z.string().uuid(),
    class_id: z.string().uuid(),
})

// ============================================
// Teacher Schemas
// ============================================

export const TeacherSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    role: z.literal('teacher'),
    school_id: z.string().uuid(),
})

export const SearchTeachersInputSchema = z.object({
    school_id: z.string().uuid(),
    search: z.string().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
})

export const AddTeacherInputSchema = z.object({
    school_id: z.string().uuid(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
})

export const UpdateTeacherInputSchema = z.object({
    teacher_id: z.string().uuid(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email().optional(),
})

// ============================================
// Wellbeing Schemas
// ============================================

export const WellbeingRecordSchema = z.object({
    overall_wellbeing: z.number().int().min(0).max(100),
    gratitude_entries: z.number().int().nonnegative(),
    kindness_acts: z.number().int().nonnegative(),
    courage_entries: z.number().int().nonnegative(),
    average_streak: z.number().nonnegative(),
    avg_sleep_hours: z.number().nonnegative(),
    avg_water_glasses: z.number().nonnegative(),
})

export const AddWellbeingRecordInputSchema = z.object({
    school_id: z.string().uuid(),
    student_id: z.string().uuid(),
    mood_rating: z.number().int().min(1).max(10),
    notes: z.string().optional(),
})

// ============================================
// Communication Schemas
// ============================================

export const SendEmailInputSchema = z.object({
    school_id: z.string().uuid(),
    to: z.array(z.string().email()),
    subject: z.string().min(1),
    body: z.string().min(1),
    cc: z.array(z.string().email()).optional(),
})

export const SendNotificationInputSchema = z.object({
    school_id: z.string().uuid(),
    user_ids: z.array(z.string().uuid()),
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string()).optional(),
})

export const BroadcastMessageInputSchema = z.object({
    school_id: z.string().uuid(),
    class_id: z.string().uuid().optional(),
    message: z.string().min(1),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
})

// ============================================
// Admin/Security Schemas
// ============================================

export const AdminUserSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email().optional(),
    role: z.literal('admin'),
    school_id: z.string().uuid(),
})

export const CreateAdminInputSchema = z.object({
    school_id: z.string().uuid(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
})

// ============================================
// Response Schemas
// ============================================

export const SuccessResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(),
})

export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string().optional(),
    code: z.string().optional(),
})
