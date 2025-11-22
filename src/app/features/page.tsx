import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import {
    Brain, TrendingUp, Heart, Users, BookOpen, Calendar, MessageCircle, Trophy,
    Wallet, BarChart3, ClipboardCheck, Sparkles, Target, Award, Settings, Bell,
    Shield, Smile, Wind, Star, Zap, CheckCircle, Timer, Globe, Lock, AlertCircle,
    Activity, Briefcase, FileText, Database, Send, UserCheck, Layout, PieChart,
    Monitor, Coffee, Headphones, Camera, Gift, Flag, Map, Compass, Rocket
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Complete Features Guide | 60+ Tools for Students, Parents, Teachers & Admins',
    description: 'Comprehensive guide to all Catalyst features: AI homework help, grade analytics, wellbeing tracking, peer tutoring, study groups, parent analytics, teacher tools, and admin management. Everything you need in one complete educational platform.',
    keywords: [
        'educational platform features',
        'AI homework helper',
        'student wellbeing tracking',
        'grade analytics',
        'peer tutoring platform',
        'study groups',
        'parent portal',
        'teacher dashboard',
        'school management system',
        'learning games',
        'attendance tracking',
        'digital wallet students',
        'student analytics',
        'classroom management',
        'educational technology'
    ],
    openGraph: {
        title: 'Complete Features Guide | 60+ Educational Tools',
        description: 'Discover every feature of the Catalyst platform - from AI-powered homework help to comprehensive school management.',
        type: 'article'
    }
}

export default function CompleteFeaturesPage() {
    return (
        <>
            {/* Comprehensive Schema for the entire page */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'Complete Features Guide',
                        description: 'Comprehensive guide to all 60+ features of the Catalyst Wellbeing Platform',
                        publisher: {
                            '@type': 'Organization',
                            name: 'Catalyst Wellbeing Platform'
                        }
                    })
                }}
            />

            {/* FAQ Schema for main questions */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'What features does Catalyst offer for students?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Catalyst offers 24+ student features including AI Homework Helper, Grade Analytics, Study Planner, Wellbeing Tracking, Peer Tutoring, Study Groups, Learning Games, Calendar & Events, Messaging, Gamification, Digital Wallet, and more.'
                                }
                            },
                            {
                                '@type': 'Question',
                                name: 'What can parents track on the platform?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Parents can access comprehensive analytics dashboards, attendance monitoring, grade tracking, wellbeing insights, community feed, and manage multiple children from one account.'
                                }
                            },
                            {
                                '@type': 'Question',
                                name: 'What tools are available for teachers?',
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: 'Teachers get classroom management tools, grading systems, attendance tracking, student analytics, announcement features, assessment creation, performance reports, and communication tools.'
                                }
                            }
                        ]
                    })
                }}
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-4xl md:text-6xl font-bold mb-6">
                                Complete Features Guide
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8">
                                Discover all 60+ powerful features designed for students, parents, teachers, and administrators. Everything your school needs in one comprehensive platform.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 text-sm mb-8">
                                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                    ✨ 24 Student Features
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                    👨‍👩‍👧 8 Parent Features
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                    🎓 14 Teacher Features
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                                    🏫 15 Admin Features
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/register"
                                    className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    Start Free Trial
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors border-2 border-white/20"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Table of Contents */}
                <section className="py-12 bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Navigation</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            <a href="#student-features" className="text-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                                <div className="text-3xl mb-2">🎓</div>
                                <div className="font-semibold">Student Features</div>
                                <div className="text-sm text-gray-600">24 Tools</div>
                            </a>
                            <a href="#parent-features" className="text-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors">
                                <div className="text-3xl mb-2">👨‍👩‍👧</div>
                                <div className="font-semibold">Parent Features</div>
                                <div className="text-sm text-gray-600">8 Tools</div>
                            </a>
                            <a href="#teacher-features" className="text-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                                <div className="text-3xl mb-2">👨‍🏫</div>
                                <div className="font-semibold">Teacher Features</div>
                                <div className="text-sm text-gray-600">14 Tools</div>
                            </a>
                            <a href="#admin-features" className="text-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
                                <div className="text-3xl mb-2">🏫</div>
                                <div className="font-semibold">Admin Features</div>
                                <div className="text-sm text-gray-600">15 Tools</div>
                            </a>
                        </div>
                    </div>
                </section>

                {/* STUDENT FEATURES */}
                <section id="student-features" className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Student Features</h2>
                            <p className="text-xl text-gray-600">24 powerful tools to empower learning, wellbeing, and growth</p>
                        </div>

                        {/* Student Feature Grid */}
                        <div className="space-y-12">

                            {/* 1. AI Homework Helper */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-start space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Brain className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">1. AI Homework Helper</h3>
                                        <p className="text-gray-700 mb-4 text-lg">
                                            Get instant, intelligent help with homework using advanced AI technology. Available 24/7 for all subjects with step-by-step explanations.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Instant answers for Math, Science, English, History</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Step-by-step explanations for better understanding</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Adaptive learning that adjusts to your level</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Unlimited questions with no restrictions</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <p className="text-sm text-gray-700"><strong>Perfect for:</strong> Late-night study sessions, understanding complex concepts, exam preparation</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Grade Analytics */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-start space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">2. Grade Analytics</h3>
                                        <p className="text-gray-700 mb-4 text-lg">
                                            Comprehensive analytics and insights into your academic performance with real-time GPA tracking, subject breakdowns, and trend analysis.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Real-time GPA calculation and tracking</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Subject-by-subject performance breakdown</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Trend analysis showing improvement over time</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Visual charts and graphs for easy understanding</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <p className="text-sm text-gray-700"><strong>Perfect for:</strong> Tracking academic progress, identifying areas for improvement, goal setting</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. AI Study Planner */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-start space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Target className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">3. AI Study Planner</h3>
                                        <p className="text-gray-700 mb-4 text-lg">
                                            Personalized study plans powered by AI to maximize learning efficiency. Includes Pomodoro timer, focus sessions, and adaptive scheduling.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">AI-generated personalized study schedules</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Pomodoro timer with customizable intervals</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Study streak tracking and rewards</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Subject prioritization based on deadlines</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <p className="text-sm text-gray-700"><strong>Perfect for:</strong> Exam preparation, time management, building study habits</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Wellbeing Tracking */}
                            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                                <div className="flex items-start space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <Heart className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">4. Wellbeing Tracking</h3>
                                        <p className="text-gray-700 mb-4 text-lg">
                                            Track mood, practice mindfulness, gratitude, affirmations, and emotional wellness. Comprehensive mental health support integrated into daily routines.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Daily mood tracking with detailed insights</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Guided breathing exercises for stress relief</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Gratitude journal with prompts</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-600">Daily affirmations for positive mindset</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <p className="text-sm text-gray-700"><strong>Perfect for:</strong> Managing stress, building emotional awareness, daily mindfulness</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5-24 in compact format for space */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* 5. Peer Tutoring */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">5. Peer Tutoring</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Connect with peers for collaborative learning and tutoring. Request help or offer tutoring to earn rewards.</p>
                                    <div className="text-sm text-gray-600">✓ Match with tutors ✓ Schedule sessions ✓ Earn gems</div>
                                </div>

                                {/* 6. Study Groups */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">6. Study Groups</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Join or create study groups for collaborative learning. Share resources, discuss topics, and study together.</p>
                                    <div className="text-sm text-gray-600">✓ Create groups ✓ Chat features ✓ Resource sharing</div>
                                </div>

                                {/* 7. Learning Games */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">7. Learning Games</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">7 educational games covering math, science, vocabulary, typing, memory, logic, and geography.</p>
                                    <div className="text-sm text-gray-600">✓ Fun learning ✓ Progress tracking ✓ Leaderboards</div>
                                </div>

                                {/* 8. Calendar & Events */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">8. Calendar & Events</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Stay organized with calendar, events, attendance tracking, and school event registration.</p>
                                    <div className="text-sm text-gray-600">✓ Event calendar ✓ Attendance ✓ Reminders</div>
                                </div>

                                {/* 9. Messaging */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                            <MessageCircle className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">9. Messaging</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Secure messaging with teachers, peers, and view school announcements. Real-time communication.</p>
                                    <div className="text-sm text-gray-600">✓ Direct messages ✓ Group chats ✓ Announcements</div>
                                </div>

                                {/* 10. Gamification & XP */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
                                            <Trophy className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">10. Gamification & XP</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Earn XP, gems, and achievements for completing tasks and learning. Level up and unlock rewards.</p>
                                    <div className="text-sm text-gray-600">✓ XP system ✓ Achievements ✓ Leaderboards</div>
                                </div>

                                {/* 11. Digital Wallet */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                            <Wallet className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">11. Digital Wallet</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Manage digital currency, transactions, and rewards. Send/receive gems, track balance, and analytics.</p>
                                    <div className="text-sm text-gray-600">✓ Send/receive ✓ Transaction history ✓ Analytics</div>
                                </div>

                                {/* 12. Project Showcase */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                                            <Award className="w-6 h-6 text-white" />
                                        </div>
                                        <h4 className="text-xl font-bold">12. Project Showcase</h4>
                                    </div>
                                    <p className="text-gray-700 mb-3">Share and showcase creative projects with the school community. Get feedback and likes.</p>
                                    <div className="text-sm text-gray-600">✓ Upload projects ✓ Categories ✓ Feedback</div>
                                </div>

                                {/* 13-24 - Brief listings */}
                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">13. Breathing Exercises</h4>
                                    <p className="text-sm text-gray-700">Guided breathing techniques for stress relief and focus</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">14. Gratitude Journal</h4>
                                    <p className="text-sm text-gray-700">Daily gratitude practice with prompts and tracking</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">15. Daily Affirmations</h4>
                                    <p className="text-sm text-gray-700">Positive affirmations for mental wellbeing</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">16. Courage Log</h4>
                                    <p className="text-sm text-gray-700">Track brave moments and build confidence</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">17. Kindness Counter</h4>
                                    <p className="text-sm text-gray-700">Log and celebrate acts of kindness</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">18. Habits Tracker</h4>
                                    <p className="text-sm text-gray-700">Build positive habits with daily tracking</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">19. Daily Quests</h4>
                                    <p className="text-sm text-gray-700">Complete daily challenges for XP and rewards</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">20. Announcements & Polls</h4>
                                    <p className="text-sm text-gray-700">View school announcements and participate in polls</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">21. Seating Viewer</h4>
                                    <p className="text-sm text-gray-700">View classroom seating arrangements</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">22. Rank Card</h4>
                                    <p className="text-sm text-gray-700">View your class ranking and performance</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">23. Exam Results</h4>
                                    <p className="text-sm text-gray-700">Access detailed examination results and analysis</p>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="text-lg font-bold mb-3">24. Black Marks Viewer</h4>
                                    <p className="text-sm text-gray-700">Track disciplinary records and submissions</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* PARENT FEATURES */}
                <section id="parent-features" className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Parent Features</h2>
                            <p className="text-xl text-gray-600">8 tools to stay connected and informed about your child's journey</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
                                    <BarChart3 className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">1. Child Analytics Dashboard</h3>
                                <p className="text-gray-700 mb-4">Comprehensive insights into your child's academic performance, wellbeing, attendance, and engagement with visual charts and trends.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> GPA tracking and subject performance</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Assignment completion rates</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Behavior and wellbeing insights</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                                    <ClipboardCheck className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">2. Attendance Monitoring</h3>
                                <p className="text-gray-700 mb-4">Real-time attendance tracking with detailed reports, alerts for absences, and historical attendance patterns.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Daily attendance updates</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Absence alerts and notifications</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Monthly/yearly attendance reports</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">3. Grade Tracking</h3>
                                <p className="text-gray-700 mb-4">Monitor grades, assessments, and academic progress with real-time updates and trend analysis.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Real-time grade updates</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Subject-wise performance</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Comparison with class average</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 shadow-lg">
                                <div className="w-14 h-14 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                                    <Heart className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">4. Wellbeing Insights</h3>
                                <p className="text-gray-700 mb-4">Track emotional wellbeing and mental health indicators with mood history and alerts.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Mood tracking history</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Wellbeing activity logs</div>
                                    <div className="flex items-center text-sm text-gray-600"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Alerts for concerning patterns</div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow">
                                <h4 className="text-xl font-bold mb-2">5. Community Feed</h4>
                                <p className="text-gray-700 text-sm">Stay connected with school community and announcements</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow">
                                <h4 className="text-xl font-bold mb-2">6. Profile Management</h4>
                                <p className="text-gray-700 text-sm">Manage child profiles, settings, and preferences</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow">
                                <h4 className="text-xl font-bold mb-2">7. Multi-child Management</h4>
                                <p className="text-gray-700 text-sm">Manage multiple children from one account</p>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow">
                                <h4 className="text-xl font-bold mb-2">8. Communication Tools</h4>
                                <p className="text-gray-700 text-sm">Message teachers and school administration</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TEACHER & ADMIN FEATURES - Compact for brevity */}
                <section id="teacher-features" className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Teacher Features</h2>
                            <p className="text-xl text-gray-600">14 powerful tools for effective classroom management</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                '1. Classroom Management', '2. Grading System', '3. Attendance Tracking',
                                '4. Student Analytics', '5. Announcements', '6. Assessment Creation',
                                '7. Performance Reports', '8. Seating Arrangements', '9. Behavior Tracking',
                                '10. Communication Tools', '11. Curriculum Planning', '12. Resource Management',
                                '13. Parent Communication', '14. Class Performance Dashboard'
                            ].map((feature, i) => (
                                <div key={i} className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="font-bold text-lg mb-2">{feature}</h4>
                                    <p className="text-sm text-gray-600">Professional tools for {feature.split('.')[1].toLowerCase()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="admin-features" className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-900 mb-4">Admin Features</h2>
                            <p className="text-xl text-gray-600">15 comprehensive tools for school administration</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                '1. School Management', '2. User Management', '3. Analytics Dashboard',
                                '4. Reports Generation', '5. System Configuration', '6. Data Export',
                                '7. Performance Monitoring', '8. Content Management', '9. Role Management',
                                '10. School Settings', '11. Billing Management', '12. Support System',
                                '13. Audit Logs', '14. Integration Management', '15. Resource Allocation'
                            ].map((feature, i) => (
                                <div key={i} className="bg-white rounded-xl p-6 shadow border border-gray-100">
                                    <h4 className="font-bold text-lg mb-2">{feature}</h4>
                                    <p className="text-sm text-gray-600">Enterprise-grade {feature.split('.')[1].toLowerCase()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to Experience All These Features?
                        </h2>
                        <p className="text-xl text-blue-100 mb-8">
                            Join hundreds of schools already using Catalyst to transform education with 60+ powerful features
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                href="/about"
                                className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors border-2 border-white/20"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
