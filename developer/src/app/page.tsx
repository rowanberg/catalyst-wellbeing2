'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
    Code2,
    Zap,
    Shield,
    BarChart3,
    Webhook,
    Key,
    ArrowRight,
    CheckCircle,
    Sparkles,
    Lock,
    Globe,
    Users,
    BookOpen,
    Terminal,
    Copy,
    Check,
    ChevronRight,
    GraduationCap,
    Building2,
    Github,
    Play,
    ExternalLink
} from 'lucide-react'

const codeExamples = {
    javascript: `import { CatalystWells } from '@catalystwells/sdk';

const client = new CatalystWells({
  clientId: 'your_client_id',
  environment: 'sandbox'
});

// Get authenticated student
const student = await client.students.get('me');
console.log(student.name, student.grade);

// Get attendance records
const attendance = await client.attendance.list({
  studentId: student.id,
  limit: 30
});`,
    python: `from catalystwells import CatalystWells

client = CatalystWells(
    client_id='your_client_id',
    environment='sandbox'
)

# Get authenticated student
student = client.students.get('me')
print(f"{student.name} - Grade {student.grade}")

# Get attendance records
attendance = client.attendance.list(
    student_id=student.id,
    limit=30
)`,
    flutter: `import 'package:catalystwells_sdk/catalystwells_sdk.dart';

final client = CatalystWells(
  clientId: 'your_client_id',
  environment: Environment.sandbox,
);

// Get authenticated student
final student = await client.students.get('me');
print('\${student.name} - Grade \${student.grade}');

// Get attendance records  
final attendance = await client.attendance.list(
  studentId: student.id,
  limit: 30,
);`
}

export default function DeveloperPortalHome() {
    const router = useRouter()
    const [selectedLang, setSelectedLang] = useState<'javascript' | 'python' | 'flutter'>('javascript')
    const [copied, setCopied] = useState(false)

    const copyCode = async () => {
        await navigator.clipboard.writeText(codeExamples[selectedLang])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const features = [
        {
            icon: Code2,
            title: 'OAuth 2.0 Integration',
            description: 'Industry-standard authentication with PKCE support and automatic token refresh',
            color: 'from-blue-500 to-cyan-500',
            gradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            border: 'border-blue-500/20'
        },
        {
            icon: Zap,
            title: 'Lightning Fast APIs',
            description: 'Sub-100ms response times with 99.99% uptime SLA and global CDN',
            color: 'from-purple-500 to-pink-500',
            gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
            border: 'border-purple-500/20'
        },
        {
            icon: Shield,
            title: 'Enterprise Security',
            description: 'SOC 2 compliant with end-to-end encryption and advanced threat protection',
            color: 'from-emerald-500 to-green-500',
            gradient: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10',
            border: 'border-emerald-500/20'
        },
        {
            icon: BarChart3,
            title: 'Real-time Analytics',
            description: 'Comprehensive insights with custom dashboards and automated reporting',
            color: 'from-orange-500 to-red-500',
            gradient: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
            border: 'border-orange-500/20'
        },
        {
            icon: Webhook,
            title: 'Event Webhooks',
            description: 'Real-time event notifications with automatic retries and delivery tracking',
            color: 'from-indigo-500 to-purple-500',
            gradient: 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10',
            border: 'border-indigo-500/20'
        },
        {
            icon: Key,
            title: 'API Key Management',
            description: 'Secure key generation with granular scopes and usage monitoring',
            color: 'from-pink-500 to-rose-500',
            gradient: 'bg-gradient-to-br from-pink-500/10 to-rose-500/10',
            border: 'border-pink-500/20'
        }
    ]

    const stats = [
        { label: 'Active Developers', value: '1,200+', icon: Users },
        { label: 'API Requests/Month', value: '50M+', icon: Zap },
        { label: 'Uptime', value: '99.9%', icon: CheckCircle },
        { label: 'Countries', value: '45+', icon: Globe }
    ]

    const apiEndpoints = [
        { name: 'Students API', path: '/v1/students', methods: ['GET', 'LIST'], icon: GraduationCap },
        { name: 'Attendance API', path: '/v1/attendance', methods: ['GET', 'LIST', 'POST'], icon: CheckCircle },
        { name: 'Schools API', path: '/v1/schools', methods: ['GET', 'LIST'], icon: Building2 },
        { name: 'Webhooks API', path: '/v1/webhooks', methods: ['GET', 'CREATE'], icon: Webhook }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/90 border-b border-slate-800/50 shadow-lg shadow-black/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">CatalystWells</h1>
                                <p className="text-xs text-slate-400 font-medium">Developer Portal</p>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                            <Link href="/dashboard/docs" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Documentation
                            </Link>
                            <Link href="/dashboard/docs/api" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                API Reference
                            </Link>
                            <Link href="/dashboard/support" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                Support
                            </Link>
                            <a
                                href="https://github.com/catalystwells"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Github className="w-4 h-4" />
                                <span className="hidden lg:inline">GitHub</span>
                            </a>
                        </nav>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        {/* Left Column - Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-6 backdrop-blur-sm"
                            >
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-blue-300 font-semibold">Trusted by 1,200+ developers</span>
                            </motion.div>

                            {/* Main Heading */}
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                                Build the Future of
                                <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Education Technology
                                </span>
                            </h1>

                            {/* Subheading */}
                            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-xl">
                                Integrate with our secure, enterprise-grade API. Access student data, grades,
                                attendance, and wellbeing metrics through OAuth 2.0 authentication.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => router.push('/register')}
                                    className="group px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                                >
                                    Start Building Free
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <Link
                                    href="/dashboard/docs"
                                    className="px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl font-semibold transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    View Documentation
                                </Link>
                            </div>

                            {/* Trust Indicators */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>Free to start</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>No credit card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>Sandbox included</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column - Code Example */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
                                {/* Code Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(['javascript', 'python', 'flutter'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setSelectedLang(lang)}
                                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${selectedLang === lang
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                {lang === 'javascript' ? 'JS' : lang === 'python' ? 'Python' : 'Flutter'}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={copyCode}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                    >
                                        {copied ? (
                                            <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                                        ) : (
                                            <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                                        )}
                                    </button>
                                </div>
                                {/* Code Content */}
                                <pre className="p-5 overflow-x-auto text-sm">
                                    <code className="text-slate-300 font-mono leading-relaxed">{codeExamples[selectedLang]}</code>
                                </pre>
                            </div>

                            {/* Floating Badge */}
                            <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Try in Sandbox
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 border-y border-slate-800/50 bg-slate-900/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-slate-400">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* API Endpoints Preview */}
            <section className="py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Powerful Education APIs
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Access comprehensive student data with fine-grained permissions
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {apiEndpoints.map((endpoint, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all group cursor-pointer"
                                onClick={() => router.push('/dashboard/docs/api')}
                            >
                                <endpoint.icon className="w-8 h-8 text-blue-400 mb-3" />
                                <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                    {endpoint.name}
                                </h3>
                                <code className="text-xs text-slate-500 font-mono">{endpoint.path}</code>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {endpoint.methods.map((method) => (
                                        <span
                                            key={method}
                                            className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded"
                                        >
                                            {method}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <Link
                            href="/dashboard/docs/api"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
                        >
                            View all 50+ endpoints
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-20 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Everything You Need to Build
                        </h2>
                        <p className="text-lg text-slate-400">
                            Powerful tools and features for modern developers
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`group relative ${feature.gradient} backdrop-blur-xl border ${feature.border} hover:border-opacity-40 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SDK Section */}
            <section className="py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Official SDKs
                        </h2>
                        <p className="text-lg text-slate-400">
                            Get started quickly with our official client libraries
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <motion.a
                            href="https://www.npmjs.com/package/@catalystwells/sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Terminal className="w-6 h-6 text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                JavaScript / TypeScript
                            </h3>
                            <code className="text-sm text-slate-400 font-mono">npm i @catalystwells/sdk</code>
                            <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                <ExternalLink className="w-4 h-4" />
                                <span>View on npm</span>
                            </div>
                        </motion.a>

                        <motion.a
                            href="https://pypi.org/project/catalystwells"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Terminal className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                Python
                            </h3>
                            <code className="text-sm text-slate-400 font-mono">pip install catalystwells</code>
                            <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                <ExternalLink className="w-4 h-4" />
                                <span>View on PyPI</span>
                            </div>
                        </motion.a>

                        <motion.a
                            href="https://pub.dev/packages/catalystwells_sdk"
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Terminal className="w-6 h-6 text-cyan-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                Flutter / Dart
                            </h3>
                            <code className="text-sm text-slate-400 font-mono">flutter pub add catalystwells_sdk</code>
                            <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                                <ExternalLink className="w-4 h-4" />
                                <span>View on pub.dev</span>
                            </div>
                        </motion.a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                        <div className="relative">
                            <Lock className="w-12 sm:w-16 h-12 sm:h-16 text-white/80 mx-auto mb-6" />
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                Ready to Get Started?
                            </h2>
                            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-xl mx-auto">
                                Join thousands of developers building amazing education apps
                            </p>
                            <button
                                onClick={() => router.push('/register')}
                                className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold text-lg transition-all shadow-lg inline-flex items-center gap-2"
                            >
                                Create Free Account
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Code2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white font-bold">CatalystWells</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                Building the future of education technology, one API at a time.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><Link href="/dashboard/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                                <li><Link href="/dashboard/docs/api" className="hover:text-white transition-colors">API Reference</Link></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><Link href="/dashboard/docs/getting-started" className="hover:text-white transition-colors">Getting Started</Link></li>
                                <li><Link href="/dashboard/playground" className="hover:text-white transition-colors">API Playground</Link></li>
                                <li><Link href="/dashboard/support" className="hover:text-white transition-colors">Support</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-slate-400 text-sm">
                                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
                        <p>© 2026 CatalystWells. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com/catalystwells" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
