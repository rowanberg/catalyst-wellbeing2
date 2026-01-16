'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    ClipboardCheck, Clock, TrendingUp, TrendingDown, Minus,
    ChevronRight, CheckCircle2, Calendar, Star, X, Mic,
    ArrowRight, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SurveyData {
    completed: boolean
    score: number | null
    trend: 'up' | 'down' | 'stable'
    weekNumber?: number
    monthNumber?: number
}

interface WellbeingSurveysProps {
    className?: string
}

// Weekly survey questions
const weeklyQuestions = [
    {
        id: 'overall_feeling',
        question: 'How did this week feel for you?',
        type: 'emoji',
        options: [
            { value: 5, emoji: '😄', label: 'Great' },
            { value: 4, emoji: '🙂', label: 'Good' },
            { value: 3, emoji: '😐', label: 'Okay' },
            { value: 2, emoji: '😟', label: 'Hard' },
            { value: 1, emoji: '😞', label: 'Very Hard' }
        ]
    },
    {
        id: 'stress_level',
        question: 'How stressful was school this week?',
        type: 'scale',
        options: [
            { value: 1, label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 2, label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { value: 3, label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 4, label: 'Too Much', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'sleep_quality',
        question: 'How was your sleep this week?',
        type: 'scale',
        options: [
            { value: 4, label: 'Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Okay', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Poor', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Very Poor', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'workload_balance',
        question: 'Did you feel overloaded with work?',
        type: 'scale',
        options: [
            { value: 4, label: 'No', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Sometimes', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { value: 2, label: 'Often', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Always', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'support_feeling',
        question: 'Did you feel supported by teachers/friends?',
        type: 'scale',
        options: [
            { value: 4, label: 'Yes', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Mostly', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'A little', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { value: 1, label: 'Not at all', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'open_check',
        question: 'Anything you want us to know?',
        type: 'text',
        optional: true
    }
]

// Monthly survey questions
const monthlyQuestions = [
    {
        id: 'overall_feeling',
        question: 'How was this month for you?',
        type: 'emoji',
        options: [
            { value: 5, emoji: '🌟', label: 'Great' },
            { value: 4, emoji: '👍', label: 'Good' },
            { value: 3, emoji: '😐', label: 'Okay' },
            { value: 2, emoji: '😟', label: 'Hard' },
            { value: 1, emoji: '😞', label: 'Very Hard' }
        ]
    },
    {
        id: 'stress_frequency',
        question: 'How often did you feel stressed this month?',
        type: 'scale',
        options: [
            { value: 4, label: 'Rarely', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Sometimes', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { value: 2, label: 'Often', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Almost Always', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'sleep_consistency',
        question: 'How consistent was your sleep?',
        type: 'scale',
        options: [
            { value: 4, label: 'Very Consistent', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Mostly', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Not Consistent', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Very Poor', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'energy_levels',
        question: 'How energetic did you feel during school days?',
        type: 'scale',
        options: [
            { value: 4, label: 'High', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Low', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Very Low', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'academic_pressure',
        question: 'Which caused most stress?',
        type: 'choice',
        options: [
            { value: 'homework', label: '📚 Homework' },
            { value: 'exams', label: '📝 Exams' },
            { value: 'projects', label: '🎨 Projects' },
            { value: 'time_pressure', label: '⏰ Time' },
            { value: 'none', label: '✨ None' }
        ]
    },
    {
        id: 'emotional_safety',
        question: 'Did you feel safe to express your feelings at school?',
        type: 'scale',
        options: [
            { value: 4, label: 'Yes', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Mostly', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Not Much', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'No', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'social_wellbeing',
        question: 'How were your friendships this month?',
        type: 'scale',
        options: [
            { value: 4, label: 'Very Good', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Okay', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Difficult', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'Very Difficult', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'teacher_support',
        question: 'Did teachers understand your difficulties?',
        type: 'scale',
        options: [
            { value: 4, label: 'Yes', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'Sometimes', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Rarely', color: 'bg-orange-100 text-orange-700 border-orange-200' },
            { value: 1, label: 'No', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'personal_growth',
        question: 'Did you feel you improved in anything?',
        type: 'scale',
        options: [
            { value: 4, label: 'Yes', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { value: 3, label: 'A little', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 2, label: 'Not sure', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            { value: 1, label: 'No', color: 'bg-red-100 text-red-700 border-red-200' }
        ]
    },
    {
        id: 'positive_reflection',
        question: 'One thing that went well this month?',
        type: 'text',
        optional: false
    },
    {
        id: 'improvement_suggestion',
        question: 'One thing we can improve at school?',
        type: 'text',
        optional: true
    }
]

export function WellbeingSurveys({ className }: WellbeingSurveysProps) {
    const [loading, setLoading] = useState(true)
    const [surveyData, setSurveyData] = useState<{
        weekly: SurveyData
        monthly: SurveyData
        history: any[]
    } | null>(null)
    const [activeSurvey, setActiveSurvey] = useState<'weekly' | 'monthly' | null>(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [submitting, setSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Fetch survey data
    const fetchSurveys = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/student/wellbeing-surveys')
            if (res.ok) {
                const data = await res.json()
                setSurveyData(data)
            }
        } catch (error) {
            console.error('Failed to fetch surveys:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSurveys()
    }, [fetchSurveys])

    const questions = activeSurvey === 'weekly' ? weeklyQuestions : monthlyQuestions
    const currentQuestion = questions[currentStep]
    const progress = ((currentStep + 1) / questions.length) * 100

    const handleAnswer = (value: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))

        // Auto-advance for non-text questions
        if (currentQuestion.type !== 'text') {
            setTimeout(() => {
                if (currentStep < questions.length - 1) {
                    setCurrentStep(prev => prev + 1)
                }
            }, 300)
        }
    }

    const handleSubmit = async () => {
        if (!activeSurvey) return

        setSubmitting(true)
        try {
            const res = await fetch('/api/student/wellbeing-surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    survey_type: activeSurvey,
                    ...answers
                })
            })

            if (res.ok) {
                setShowSuccess(true)
                setTimeout(() => {
                    setShowSuccess(false)
                    setActiveSurvey(null)
                    setCurrentStep(0)
                    setAnswers({})
                    fetchSurveys()
                }, 2500)
            }
        } catch (error) {
            console.error('Failed to submit survey:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const closeSurvey = () => {
        setActiveSurvey(null)
        setCurrentStep(0)
        setAnswers({})
    }

    const TrendIcon = ({ trend }: { trend: string }) => {
        if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />
        if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
        return <Minus className="h-4 w-4 text-slate-400" />
    }

    if (loading) {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
                {[1, 2].map(i => (
                    <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
        )
    }

    // Survey Modal
    if (activeSurvey) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => e.target === e.currentTarget && closeSurvey()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                    >
                        {/* Success State */}
                        {showSuccess ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center"
                                >
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Thank You! 🎉</h3>
                                <p className="text-slate-600">Your response has been saved. Keep taking care of yourself!</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-4 border-b bg-gradient-to-r from-violet-50 to-purple-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                                                <ClipboardCheck className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800">
                                                    {activeSurvey === 'weekly' ? 'Weekly Check-in' : 'Monthly Reflection'}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Question {currentStep + 1} of {questions.length}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={closeSurvey}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            <X className="h-5 w-5 text-slate-400" />
                                        </button>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>

                                {/* Question */}
                                <div className="p-6">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentStep}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <h4 className="text-lg font-semibold text-slate-800 mb-4">
                                                {currentQuestion.question}
                                                {currentQuestion.optional && (
                                                    <span className="text-sm font-normal text-slate-400 ml-2">(Optional)</span>
                                                )}
                                            </h4>

                                            {/* Emoji Options */}
                                            {currentQuestion.type === 'emoji' && (
                                                <div className="grid grid-cols-5 gap-2">
                                                    {currentQuestion.options?.map((opt: any) => (
                                                        <motion.button
                                                            key={opt.value}
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleAnswer(opt.value)}
                                                            className={cn(
                                                                "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                                answers[currentQuestion.id] === opt.value
                                                                    ? "border-violet-500 bg-violet-50 shadow-md"
                                                                    : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <span className="text-3xl">{opt.emoji}</span>
                                                            <span className="text-xs font-medium text-slate-600">{opt.label}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Scale Options */}
                                            {currentQuestion.type === 'scale' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentQuestion.options?.map((opt: any) => (
                                                        <motion.button
                                                            key={opt.value}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleAnswer(opt.value)}
                                                            className={cn(
                                                                "p-3 rounded-xl border-2 transition-all text-center font-medium",
                                                                answers[currentQuestion.id] === opt.value
                                                                    ? "border-violet-500 bg-violet-50 shadow-md"
                                                                    : `border-transparent ${opt.color}`
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Choice Options */}
                                            {currentQuestion.type === 'choice' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentQuestion.options?.map((opt: any) => (
                                                        <motion.button
                                                            key={opt.value}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => handleAnswer(opt.value)}
                                                            className={cn(
                                                                "p-3 rounded-xl border-2 transition-all text-left",
                                                                answers[currentQuestion.id] === opt.value
                                                                    ? "border-violet-500 bg-violet-50 shadow-md"
                                                                    : "border-slate-200 bg-slate-50 hover:border-violet-300"
                                                            )}
                                                        >
                                                            {opt.label}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Text Input */}
                                            {currentQuestion.type === 'text' && (
                                                <div className="space-y-3">
                                                    <textarea
                                                        placeholder={currentQuestion.optional ? "Share if you'd like..." : "Share your thoughts..."}
                                                        value={answers[currentQuestion.id] || ''}
                                                        onChange={(e) => setAnswers(prev => ({
                                                            ...prev,
                                                            [currentQuestion.id]: e.target.value
                                                        }))}
                                                        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:ring-0 min-h-[100px] resize-none transition-colors"
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Footer */}
                                <div className="p-4 border-t bg-slate-50 flex justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                        disabled={currentStep === 0}
                                    >
                                        Back
                                    </Button>

                                    {currentStep === questions.length - 1 ? (
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                        >
                                            {submitting ? (
                                                <span className="flex items-center gap-2">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 1 }}
                                                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                    Saving...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Submit <Sparkles className="h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                            disabled={!currentQuestion.optional && !answers[currentQuestion.id]}
                                            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                                        >
                                            Next <ArrowRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        )
    }

    return (
        <Card className={cn("border-0 shadow-lg overflow-hidden", className)}>
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md">
                        <ClipboardCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Well-being Surveys</CardTitle>
                        <p className="text-sm text-slate-600 mt-0.5">Quick check-ins to help track how you're doing</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Weekly Survey Card */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !surveyData?.weekly.completed && setActiveSurvey('weekly')}
                        className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                            surveyData?.weekly.completed
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-white border-violet-200 hover:border-violet-400 hover:shadow-md"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-violet-500" />
                                <h4 className="font-semibold text-slate-800">Weekly Check-in</h4>
                            </div>
                            {surveyData?.weekly.completed ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Done
                                </Badge>
                            ) : (
                                <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                                    ~2 min
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                            {surveyData?.weekly.completed
                                ? "Thanks for checking in this week!"
                                : "6 quick questions about your week"}
                        </p>

                        {surveyData?.weekly.completed && surveyData?.weekly.score !== null && (
                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600">Your score:</span>
                                    <span className="text-lg font-bold text-emerald-600">{surveyData.weekly.score}</span>
                                </div>
                                <TrendIcon trend={surveyData.weekly.trend} />
                            </div>
                        )}

                        {!surveyData?.weekly.completed && (
                            <div className="flex items-center text-violet-600 text-sm font-medium pt-2">
                                Start now <ChevronRight className="h-4 w-4 ml-1" />
                            </div>
                        )}
                    </motion.div>

                    {/* Monthly Survey Card */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !surveyData?.monthly.completed && setActiveSurvey('monthly')}
                        className={cn(
                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                            surveyData?.monthly.completed
                                ? "bg-emerald-50 border-emerald-200"
                                : "bg-white border-purple-200 hover:border-purple-400 hover:shadow-md"
                        )}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-purple-500" />
                                <h4 className="font-semibold text-slate-800">Monthly Reflection</h4>
                            </div>
                            {surveyData?.monthly.completed ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Done
                                </Badge>
                            ) : (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                    ~5 min
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-slate-600 mb-3">
                            {surveyData?.monthly.completed
                                ? "Great job reflecting on your month!"
                                : "Reflect on the past month"}
                        </p>

                        {surveyData?.monthly.completed && surveyData?.monthly.score !== null && (
                            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600">Your score:</span>
                                    <span className="text-lg font-bold text-emerald-600">{surveyData.monthly.score}</span>
                                </div>
                                <TrendIcon trend={surveyData.monthly.trend} />
                            </div>
                        )}

                        {!surveyData?.monthly.completed && (
                            <div className="flex items-center text-purple-600 text-sm font-medium pt-2">
                                Start now <ChevronRight className="h-4 w-4 ml-1" />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Score Legend */}
                <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-violet-50 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            Scores help you track your well-being over time
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-500" /> Improving</span>
                            <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Declining</span>
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
