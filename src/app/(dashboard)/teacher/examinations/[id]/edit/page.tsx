'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAppSelector } from '@/lib/redux/hooks'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ExamCreator } from '@/components/examination/ExamCreator'
import { Card, CardContent } from '@/components/ui/card'

export default function EditExamPage() {
    const router = useRouter()
    const params = useParams()
    const examId = params.id as string

    const { user, profile } = useAppSelector((state) => state.auth)
    const [exam, setExam] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!user || profile?.role !== 'teacher') {
            router.push('/login')
            return
        }
        fetchExam()
    }, [user, profile, examId])

    const fetchExam = async () => {
        try {
            const response = await fetch(`/api/teacher/examinations/${examId}`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setExam(data.exam)
            } else {
                console.error('Failed to fetch exam')
                router.push('/teacher/examinations')
            }
        } catch (error) {
            console.error('Error fetching exam:', error)
            router.push('/teacher/examinations')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateExam = async (examData: any) => {
        setSaving(true)
        try {
            const response = await fetch(`/api/teacher/examinations/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(examData)
            })

            if (response.ok) {
                router.push('/teacher/examinations')
            } else {
                const error = await response.json()
                alert(`Failed to update exam: ${error.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error updating exam:', error)
            alert('Failed to update exam. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading exam...</p>
                </motion.div>
            </div>
        )
    }

    if (!exam) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
                        <p className="text-gray-600 mb-4">The exam you're trying to edit doesn't exist.</p>
                        <Button onClick={() => router.push('/teacher/examinations')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Examinations
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/teacher/examinations')}
                                className="hover:bg-gray-100"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    Edit Exam
                                </h1>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    Update exam details and questions
                                </p>
                            </div>
                        </div>
                        {saving && (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">Saving...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ExamCreator
                    onSave={handleUpdateExam}
                    initialData={exam}
                    onCancel={() => router.push('/teacher/examinations')}
                />
            </div>
        </div>
    )
}
