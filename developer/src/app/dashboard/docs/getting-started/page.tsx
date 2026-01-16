'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    CheckCircle,
    Circle,
    Code2,
    Copy,
    Check,
    ChevronRight,
    Zap,
    Key,
    Shield,
    Terminal,
    ArrowRight,
    ExternalLink,
    BookOpen,
    Sparkles
} from 'lucide-react'

const steps = [
    {
        id: 1,
        title: 'Create Your Developer Account',
        description: 'Sign up for free to access the developer portal and APIs.',
        code: null,
        action: { label: 'Sign Up', href: '/register' }
    },
    {
        id: 2,
        title: 'Register Your Application',
        description: 'Create an application to get your API credentials.',
        code: null,
        action: { label: 'Create App', href: '/dashboard/applications/create' }
    },
    {
        id: 3,
        title: 'Get Your API Credentials',
        description: 'Copy your Client ID and Client Secret from the application settings.',
        code: `// Your credentials will look like this:
Client ID: cw_app_abc123xyz
Client Secret: cw_secret_**********`,
        action: null
    },
    {
        id: 4,
        title: 'Install the SDK',
        description: 'Choose your preferred language and install the official SDK.',
        code: `# JavaScript/TypeScript
npm install @catalystwells/sdk

# Python
pip install catalystwells

# Flutter/Dart
flutter pub add catalystwells_sdk`,
        action: null
    },
    {
        id: 5,
        title: 'Initialize the Client',
        description: 'Configure the SDK with your credentials.',
        code: `import { CatalystWells } from '@catalystwells/sdk';

const client = new CatalystWells({
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret',
  environment: 'sandbox' // or 'production'
});`,
        action: null
    },
    {
        id: 6,
        title: 'Make Your First API Call',
        description: 'Try fetching student data or any other available endpoint.',
        code: `// Get current authenticated user
const user = await client.auth.getCurrentUser();
console.log(user);

// Get student profile
const student = await client.students.get('me');
console.log(student);

// Response:
// {
//   id: "stu_abc123",
//   name: "John Doe",
//   grade: "10",
//   section: "A"
// }`,
        action: { label: 'Try in Playground', href: '/dashboard/playground' }
    }
]

const features = [
    {
        icon: Zap,
        title: 'Sandbox Environment',
        description: 'Test with realistic sample data without affecting real users.'
    },
    {
        icon: Shield,
        title: 'OAuth 2.0 Security',
        description: 'Industry-standard authentication with granular scopes.'
    },
    {
        icon: Terminal,
        title: 'Multiple SDKs',
        description: 'Official SDKs for JavaScript, Python, and Flutter.'
    }
]

export default function GettingStartedPage() {
    const [copiedStep, setCopiedStep] = useState<number | null>(null)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])

    const copyCode = async (code: string, stepId: number) => {
        await navigator.clipboard.writeText(code)
        setCopiedStep(stepId)
        setTimeout(() => setCopiedStep(null), 2000)
    }

    const toggleStep = (stepId: number) => {
        setCompletedSteps(prev =>
            prev.includes(stepId)
                ? prev.filter(id => id !== stepId)
                : [...prev, stepId]
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-300 font-medium">New to CatalystWells?</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Getting Started</h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    Follow these steps to integrate CatalystWells APIs into your application.
                    You'll be up and running in under 10 minutes.
                </p>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors"
                    >
                        <feature.icon className="w-8 h-8 text-blue-400 mb-3" />
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                ))}
            </motion.div>

            {/* Steps */}
            <div className="space-y-6">
                {steps.map((step, idx) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => toggleStep(step.id)}
                                    className="flex-shrink-0 mt-1"
                                >
                                    {completedSteps.includes(step.id) ? (
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400 transition-colors" />
                                    )}
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                            STEP {step.id}
                                        </span>
                                        {completedSteps.includes(step.id) && (
                                            <span className="text-xs font-medium text-green-400">Completed</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                    <p className="text-slate-400">{step.description}</p>

                                    {step.code && (
                                        <div className="mt-4 relative">
                                            <div className="flex items-center justify-between p-3 bg-slate-900/80 border-b border-slate-700 rounded-t-xl">
                                                <span className="text-xs text-slate-500 font-mono">Code</span>
                                                <button
                                                    onClick={() => copyCode(step.code!, step.id)}
                                                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                                                >
                                                    {copiedStep === step.id ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                                            <span className="text-green-400">Copied!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-3.5 h-3.5" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <pre className="p-4 bg-slate-900/80 rounded-b-xl overflow-x-auto">
                                                <code className="text-sm text-slate-300 font-mono">{step.code}</code>
                                            </pre>
                                        </div>
                                    )}

                                    {step.action && (
                                        <Link
                                            href={step.action.href}
                                            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all"
                                        >
                                            {step.action.label}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Next Steps */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8"
            >
                <h2 className="text-2xl font-bold text-white mb-4">What's Next?</h2>
                <p className="text-slate-300 mb-6">
                    Now that you've made your first API call, explore these resources to build more:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        href="/dashboard/docs"
                        className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors group"
                    >
                        <BookOpen className="w-8 h-8 text-blue-400" />
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">API Reference</h3>
                            <p className="text-sm text-slate-400">Explore all available endpoints</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </Link>
                    <Link
                        href="/dashboard/playground"
                        className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors group"
                    >
                        <Terminal className="w-8 h-8 text-purple-400" />
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">API Playground</h3>
                            <p className="text-sm text-slate-400">Test APIs interactively</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </Link>
                    <Link
                        href="/dashboard/schools"
                        className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors group"
                    >
                        <Key className="w-8 h-8 text-emerald-400" />
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Connect Schools</h3>
                            <p className="text-sm text-slate-400">Request access to real data</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </Link>
                    <Link
                        href="/dashboard/webhooks"
                        className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600 transition-colors group"
                    >
                        <Zap className="w-8 h-8 text-yellow-400" />
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-yellow-400 transition-colors">Set Up Webhooks</h3>
                            <p className="text-sm text-slate-400">Receive real-time events</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500 ml-auto" />
                    </Link>
                </div>
            </motion.div>

            {/* Help */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center py-8"
            >
                <p className="text-slate-400 mb-4">Need help? We're here for you.</p>
                <div className="flex items-center justify-center gap-4">
                    <Link
                        href="/dashboard/support"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Contact Support
                    </Link>
                    <span className="text-slate-600">•</span>
                    <a
                        href="https://github.com/catalystwells"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors inline-flex items-center gap-1"
                    >
                        GitHub
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
