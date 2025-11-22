import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Brain, CheckCircle, Zap, Shield, Clock, Award } from 'lucide-react'
import { FeatureSchema } from '@/components/seo/FeatureSchema'

export const metadata: Metadata = {
    title: 'AI Homework Helper | Intelligent Tutoring for Students',
    description: 'Get instant, intelligent homework help powered by advanced AI. Available 24/7 for math, science, English, and more. Free AI tutoring for students with step-by-step explanations.',
    keywords: [
        'AI homework helper',
        'AI tutoring',
        'homework help AI',
        'student AI assistant',
        'math homework help',
        'science homework help',
        'free AI tutor',
        'intelligent tutoring system'
    ],
    openGraph: {
        title: 'AI Homework Helper | 24/7 Intelligent Tutoring',
        description: 'Get instant help with homework using advanced AI. Step-by-step explanations for math, science, English, and more.',
        type: 'article',
        images: ['/features/ai-homework-helper-og.png']
    }
}

export default function AIHomeworkHelperPage() {
    const benefits = [
        'Instant answers to homework questions 24/7',
        'Step-by-step explanations for better understanding',
        'Support for all subjects: Math, Science, English, History, and more',
        'Adaptive learning that adjusts to your level',
        'Safe and appropriate content for students',
        'Unlimited questions with no restrictions'
    ]

    const howToSteps = [
        {
            step: 'Ask Your Question',
            description: 'Type or speak your homework question. Include as much context as possible for best results.'
        },
        {
            step: 'Get Instant Answer',
            description: 'Receive a detailed, step-by-step explanation within seconds from our advanced AI.'
        },
        {
            step: 'Learn and Understand',
            description: 'Follow the explanation to understand the concept, not just the answer.'
        },
        {
            step: 'Ask Follow-ups',
            description: 'Need clarification? Ask follow-up questions to deepen your understanding.'
        }
    ]

    const faqs = [
        {
            question: 'How does the AI Homework Helper work?',
            answer: 'Our AI uses advanced natural language processing to understand your question and provide detailed, step-by-step explanations. It breaks down complex problems into manageable steps to help you learn the concept, not just get the answer.'
        },
        {
            question: 'What subjects does it support?',
            answer: 'The AI Homework Helper supports all major subjects including Mathematics, Science (Physics, Chemistry, Biology), English, History, Geography, and more. It can help with elementary through high school level questions.'
        },
        {
            question: 'Is the AI Homework Helper free?',
            answer: 'Yes! The AI Homework Helper is completely free for all Catalyst students. There are no limits on the number of questions you can ask.'
        },
        {
            question: 'Will it just give me the answers?',
            answer: 'No. Our AI is designed to help you learn, not cheat. It provides step-by-step explanations to help you understand the concept and solve similar problems on your own in the future.'
        },
        {
            question: 'Is it available 24/7?',
            answer: 'Yes! The AI Homework Helper is available anytime, anywhere. Get homework help even late at night or on weekends.'
        },
        {
            question: 'How accurate is the AI?',
            answer: 'Our AI uses state-of-the-art language models and is highly accurate. However, we always recommend double-checking important work and asking teachers if you\'re unsure.'
        }
    ]

    return (
        <>
            <FeatureSchema
                name="AI Homework Helper"
                description="Get instant, intelligent homework help powered by advanced AI. Available 24/7 for math, science, English, and more with step-by-step explanations."
                category="student"
                benefits={benefits}
                howToSteps={howToSteps}
                faqs={faqs}
                image="/features/ai-homework-helper.png"
            />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <Link href="/features" className="text-purple-200 hover:text-white transition-colors">
                                        Features
                                    </Link>
                                    <span className="text-purple-200">/</span>
                                    <span>AI Homework Helper</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                    AI Homework Helper
                                </h1>
                                <p className="text-xl text-purple-100 mb-8">
                                    Get instant, intelligent help with homework 24/7. Powered by advanced AI to provide step-by-step explanations for better understanding.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link
                                        href="/register"
                                        className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
                                    >
                                        Start Learning Free
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="px-8 py-4 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 transition-colors border-2 border-white/20"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Brain className="w-8 h-8" />
                                        <div className="flex-1">
                                            <div className="h-2 bg-white/30 rounded-full mb-2" />
                                            <div className="h-2 bg-white/20 rounded-full w-2/3" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-white/20 rounded-lg p-4">
                                            <p className="text-sm">How do I solve 2x + 5 = 15?</p>
                                        </div>
                                        <div className="bg-purple-500/50 rounded-lg p-4">
                                            <p className="text-sm font-medium mb-2">Let's solve step-by-step:</p>
                                            <ol className="text-sm space-y-1 list-decimal list-inside">
                                                <li>Subtract 5 from both sides</li>
                                                <li>2x = 10</li>
                                                <li>Divide both sides by 2</li>
                                                <li>x = 5</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Students Love AI Homework Helper</h2>
                            <p className="text-xl text-gray-600">Intelligent assistance that helps you learn, not just get answers</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Instant Answers</h3>
                                <p className="text-gray-600">Get help immediately, no waiting for office hours or tutors</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Step-by-Step Learning</h3>
                                <p className="text-gray-600">Understand the process, not just the final answer</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">24/7 Availability</h3>
                                <p className="text-gray-600">Get help anytime, anywhere, even late at night</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
                            <p className="text-xl text-gray-600">Get homework help in 4 simple steps</p>
                        </div>
                        <div className="grid md:grid-cols-4 gap-8">
                            {howToSteps.map((step, index) => (
                                <div key={index} className="relative">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-xl">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">{step.step}</h3>
                                        <p className="text-gray-600 text-sm">{step.description}</p>
                                    </div>
                                    {index < howToSteps.length - 1 && (
                                        <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                            <div className="w-8 h-0.5 bg-gradient-to-r from-purple-300 to-pink-300" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Key Features */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-3 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <p className="text-gray-700">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        </div>
                        <div className="space-y-6">
                            {faqs.map((faq, index) => (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                                    <p className="text-gray-600">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Related Features */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Features</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Link href="/features/student/ai-study-planner" className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                                <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">AI Study Planner</h3>
                                <p className="text-gray-600 text-sm">Personalized study plans powered by AI</p>
                            </Link>
                            <Link href="/features/student/peer-tutoring" className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                                <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">Peer Tutoring</h3>
                                <p className="text-gray-600 text-sm">Connect with peers for collaborative learning</p>
                            </Link>
                            <Link href="/features/student/grade-analytics" className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100">
                                <h3 className="text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors">Grade Analytics</h3>
                                <p className="text-gray-600 text-sm">Track and analyze your academic performance</p>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to Get Homework Help?
                        </h2>
                        <p className="text-xl text-purple-100 mb-8">
                            Join thousands of students already using AI to improve their grades
                        </p>
                        <Link
                            href="/register"
                            className="inline-block px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
                        >
                            Start Learning Free
                        </Link>
                    </div>
                </section>
            </div>
        </>
    )
}
