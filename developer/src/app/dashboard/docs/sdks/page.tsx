'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Terminal,
    Copy,
    Check,
    ExternalLink,
    ChevronRight,
    Package,
    Zap,
    Shield,
    RefreshCw,
    Code2,
    BookOpen,
    Github
} from 'lucide-react'

const sdks = [
    {
        id: 'javascript',
        name: 'JavaScript / TypeScript',
        package: '@catalystwells/sdk',
        install: 'npm install @catalystwells/sdk',
        link: 'https://www.npmjs.com/package/@catalystwells/sdk',
        github: 'https://github.com/catalystwells/sdk-javascript',
        color: 'from-yellow-500 to-amber-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-400',
        example: `import { CatalystWells } from '@catalystwells/sdk';

// Initialize the client
const client = new CatalystWells({
  clientId: process.env.CATALYSTWELLS_CLIENT_ID,
  clientSecret: process.env.CATALYSTWELLS_CLIENT_SECRET,
  environment: 'sandbox' // or 'production'
});

// OAuth: Get authorization URL
const authUrl = client.auth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['profile.read', 'student.profile.read'],
  state: 'random_state_string'
});

// Exchange code for tokens
const tokens = await client.auth.exchangeCode({
  code: authorizationCode,
  redirectUri: 'https://yourapp.com/callback'
});

// Make authenticated requests
const student = await client.students.get('me');
console.log(\`Hello, \${student.name}!\`);

// Get attendance
const attendance = await client.attendance.list({
  studentId: student.id,
  from: '2026-01-01',
  to: '2026-01-31'
});

// Webhooks
client.webhooks.on('attendance.updated', (event) => {
  console.log('Attendance updated:', event.data);
});`
    },
    {
        id: 'python',
        name: 'Python',
        package: 'catalystwells',
        install: 'pip install catalystwells',
        link: 'https://pypi.org/project/catalystwells',
        github: 'https://github.com/catalystwells/sdk-python',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-400',
        example: `from catalystwells import CatalystWells
import os

# Initialize the client
client = CatalystWells(
    client_id=os.environ['CATALYSTWELLS_CLIENT_ID'],
    client_secret=os.environ['CATALYSTWELLS_CLIENT_SECRET'],
    environment='sandbox'  # or 'production'
)

# OAuth: Get authorization URL
auth_url = client.auth.get_authorization_url(
    redirect_uri='https://yourapp.com/callback',
    scopes=['profile.read', 'student.profile.read'],
    state='random_state_string'
)

# Exchange code for tokens
tokens = client.auth.exchange_code(
    code=authorization_code,
    redirect_uri='https://yourapp.com/callback'
)

# Make authenticated requests
student = client.students.get('me')
print(f"Hello, {student.name}!")

# Get attendance
attendance = client.attendance.list(
    student_id=student.id,
    from_date='2026-01-01',
    to_date='2026-01-31'
)

# Async support
import asyncio
async def main():
    student = await client.students.get_async('me')
    print(student.name)`
    },
    {
        id: 'flutter',
        name: 'Flutter / Dart',
        package: 'catalystwells_sdk',
        install: 'flutter pub add catalystwells_sdk',
        link: 'https://pub.dev/packages/catalystwells_sdk',
        github: 'https://github.com/catalystwells/sdk-flutter',
        color: 'from-cyan-500 to-teal-500',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        textColor: 'text-cyan-400',
        example: `import 'package:catalystwells_sdk/catalystwells_sdk.dart';

// Initialize the client
final client = CatalystWells(
  clientId: 'your_client_id',
  environment: Environment.sandbox, // or Environment.production
);

// OAuth: Get authorization URL
final authUrl = client.auth.getAuthorizationUrl(
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['profile.read', 'student.profile.read'],
  state: 'random_state_string',
);

// Exchange code for tokens
final tokens = await client.auth.exchangeCode(
  code: authorizationCode,
  redirectUri: 'https://yourapp.com/callback',
);

// Make authenticated requests
final student = await client.students.get('me');
print('Hello, \${student.name}!');

// Get attendance with error handling
try {
  final attendance = await client.attendance.list(
    studentId: student.id,
    from: DateTime(2026, 1, 1),
    to: DateTime(2026, 1, 31),
  );
  print('Total records: \${attendance.length}');
} on CatalystWellsException catch (e) {
  print('Error: \${e.message}');
}`
    }
]

const features = [
    {
        icon: Zap,
        title: 'Type-Safe',
        description: 'Full TypeScript/Dart type definitions for better development experience'
    },
    {
        icon: RefreshCw,
        title: 'Auto Token Refresh',
        description: 'Automatically refreshes expired tokens without intervention'
    },
    {
        icon: Shield,
        title: 'Secure by Default',
        description: 'Built-in best practices for secure credential handling'
    },
    {
        icon: Package,
        title: 'Lightweight',
        description: 'Minimal dependencies with small bundle sizes'
    }
]

export default function SDKsPage() {
    const [selectedSDK, setSelectedSDK] = useState(sdks[0])
    const [copiedSection, setCopiedSection] = useState<string | null>(null)

    const copyCode = async (code: string, section: string) => {
        await navigator.clipboard.writeText(code)
        setCopiedSection(section)
        setTimeout(() => setCopiedSection(null), 2000)
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Official SDKs</h1>
                <p className="text-lg text-slate-400 max-w-3xl">
                    Get started quickly with our official client libraries. Each SDK provides full API coverage
                    with type safety, automatic token management, and comprehensive documentation.
                </p>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4"
                    >
                        <feature.icon className="w-6 h-6 text-blue-400 mb-2" />
                        <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                    </div>
                ))}
            </motion.div>

            {/* SDK Selector */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid md:grid-cols-3 gap-4"
            >
                {sdks.map((sdk) => (
                    <button
                        key={sdk.id}
                        onClick={() => setSelectedSDK(sdk)}
                        className={`p-5 rounded-xl border text-left transition-all ${selectedSDK.id === sdk.id
                                ? `${sdk.bgColor} ${sdk.borderColor.replace('20', '40')}`
                                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                            }`}
                    >
                        <div className={`w-10 h-10 ${sdk.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                            <Terminal className={`w-5 h-5 ${sdk.textColor}`} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">{sdk.name}</h3>
                        <code className="text-xs text-slate-400 font-mono">{sdk.package}</code>
                    </button>
                ))}
            </motion.div>

            {/* Selected SDK Details */}
            <motion.div
                key={selectedSDK.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Installation */}
                <div className={`${selectedSDK.bgColor} border ${selectedSDK.borderColor} rounded-2xl p-6`}>
                    <h2 className="text-xl font-semibold text-white mb-4">Installation</h2>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-900/80 rounded-xl px-4 py-3 font-mono text-sm">
                            <code className="text-slate-300">{selectedSDK.install}</code>
                        </div>
                        <button
                            onClick={() => copyCode(selectedSDK.install, 'install')}
                            className={`p-3 rounded-xl transition-colors ${selectedSDK.bgColor} ${selectedSDK.borderColor.replace('20', '40')} border hover:opacity-80`}
                        >
                            {copiedSection === 'install' ? (
                                <Check className="w-5 h-5 text-green-400" />
                            ) : (
                                <Copy className={`w-5 h-5 ${selectedSDK.textColor}`} />
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                        <a
                            href={selectedSDK.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-sm ${selectedSDK.textColor} hover:opacity-80 flex items-center gap-1`}
                        >
                            View Package
                            <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                            href={selectedSDK.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                    </div>
                </div>

                {/* Code Example */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <Code2 className={`w-5 h-5 ${selectedSDK.textColor}`} />
                            <h3 className="font-semibold text-white">Quick Start Example</h3>
                        </div>
                        <button
                            onClick={() => copyCode(selectedSDK.example, 'example')}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            {copiedSection === 'example' ? (
                                <><Check className="w-4 h-4 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-4 h-4" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-6 overflow-x-auto max-h-[500px] overflow-y-auto sidebar-scroll">
                        <code className="text-sm text-slate-300 font-mono leading-relaxed">{selectedSDK.example}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Additional Resources */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid md:grid-cols-2 gap-6"
            >
                <Link
                    href="/dashboard/docs/api"
                    className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all group"
                >
                    <BookOpen className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400">API Reference</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Complete documentation for all API endpoints, parameters, and responses.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-blue-400">
                        View Reference <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>

                <Link
                    href="/dashboard/playground"
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all group"
                >
                    <Terminal className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400">API Playground</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Test API endpoints interactively with our sandbox environment.
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-purple-400">
                        Try Playground <ChevronRight className="w-4 h-4" />
                    </span>
                </Link>
            </motion.div>

            {/* Support */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center py-6"
            >
                <p className="text-slate-400 mb-4">
                    Need help with SDK integration? We're here for you.
                </p>
                <div className="flex items-center justify-center gap-6">
                    <Link
                        href="/dashboard/support"
                        className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                        Contact Support
                    </Link>
                    <a
                        href="https://github.com/catalystwells"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white flex items-center gap-1"
                    >
                        <Github className="w-4 h-4" />
                        Report Issues
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
