'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Webhook,
    Copy,
    Check,
    Shield,
    Zap,
    RefreshCw,
    Clock,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    Code2,
    Bell,
    Lock,
    ExternalLink
} from 'lucide-react'

const eventTypes = [
    {
        category: 'Student Events',
        events: [
            { name: 'student.created', description: 'A new student was added' },
            { name: 'student.updated', description: 'Student profile was modified' },
            { name: 'student.deleted', description: 'Student was removed from the system' }
        ]
    },
    {
        category: 'Attendance Events',
        events: [
            { name: 'attendance.marked', description: 'Attendance was marked for a student' },
            { name: 'attendance.updated', description: 'Attendance record was modified' },
            { name: 'attendance.bulk_marked', description: 'Bulk attendance was processed' }
        ]
    },
    {
        category: 'Academic Events',
        events: [
            { name: 'grade.published', description: 'New grades were published' },
            { name: 'grade.updated', description: 'Grade was modified' },
            { name: 'report.generated', description: 'Report card was generated' }
        ]
    },
    {
        category: 'Wellbeing Events',
        events: [
            { name: 'wellbeing.alert', description: 'Wellbeing alert was triggered' },
            { name: 'mood.logged', description: 'Student logged their mood' },
            { name: 'behavior.recorded', description: 'Behavior note was added' }
        ]
    },
    {
        category: 'Authorization Events',
        events: [
            { name: 'consent.granted', description: 'User granted consent to your app' },
            { name: 'consent.revoked', description: 'User revoked consent' },
            { name: 'token.refreshed', description: 'Access token was refreshed' }
        ]
    }
]

const features = [
    {
        icon: Zap,
        title: 'Real-time Delivery',
        description: 'Events are delivered within seconds of occurrence'
    },
    {
        icon: RefreshCw,
        title: 'Automatic Retries',
        description: 'Failed deliveries are retried with exponential backoff'
    },
    {
        icon: Shield,
        title: 'Signature Verification',
        description: 'All payloads are signed for authenticity'
    },
    {
        icon: Clock,
        title: 'Event History',
        description: '30-day history of all webhook deliveries'
    }
]

export default function WebhooksDocPage() {
    const [copiedSection, setCopiedSection] = useState<string | null>(null)

    const copyCode = async (code: string, section: string) => {
        await navigator.clipboard.writeText(code)
        setCopiedSection(section)
        setTimeout(() => setCopiedSection(null), 2000)
    }

    const payloadExample = `{
  "id": "evt_abc123xyz",
  "type": "attendance.marked",
  "created": "2026-01-16T10:30:00Z",
  "data": {
    "student_id": "stu_123",
    "student_name": "John Doe",
    "class_id": "cls_456",
    "date": "2026-01-16",
    "status": "present",
    "marked_by": "teacher_789",
    "marked_at": "2026-01-16T10:30:00Z"
  },
  "school": {
    "id": "sch_001",
    "name": "Demo High School"
  }
}`

    const verificationCode = `import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expectedSignature}\`)
  );
}

// In your webhook handler
app.post('/webhooks', (req, res) => {
  const signature = req.headers['x-catalystwells-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  const event = req.body;
  console.log(\`Received event: \${event.type}\`);
  
  // Acknowledge receipt
  res.status(200).send('OK');
});`

    const pythonExample = `import hmac
import hashlib
from flask import Flask, request

app = Flask(__name__)
WEBHOOK_SECRET = 'your_webhook_secret'

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f'sha256={expected}', signature)

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-CatalystWells-Signature')
    payload = request.get_data(as_text=True)
    
    if not verify_signature(payload, signature, WEBHOOK_SECRET):
        return 'Invalid signature', 401
    
    event = request.get_json()
    print(f"Received event: {event['type']}")
    
    return 'OK', 200`

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl">
                        <Webhook className="w-6 h-6 text-purple-400" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">Webhooks</h1>
                </div>
                <p className="text-lg text-slate-400 max-w-3xl">
                    Receive real-time notifications when events occur in connected schools.
                    Webhooks enable you to build reactive integrations without polling.
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
                        <feature.icon className="w-6 h-6 text-purple-400 mb-2" />
                        <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                    </div>
                ))}
            </motion.div>

            {/* Quick Start */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-4">Quick Setup</h2>
                <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                        <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <div>
                            <p className="text-white font-medium">Create an endpoint</p>
                            <p className="text-sm text-slate-400">Set up a publicly accessible HTTPS URL to receive webhooks</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <div>
                            <p className="text-white font-medium">Register your webhook</p>
                            <p className="text-sm text-slate-400">Add your endpoint URL in the dashboard and select events</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <div>
                            <p className="text-white font-medium">Verify signatures</p>
                            <p className="text-sm text-slate-400">Use your webhook secret to verify payload authenticity</p>
                        </div>
                    </li>
                </ol>
                <Link
                    href="/dashboard/webhooks"
                    className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                    <Bell className="w-4 h-4" />
                    Configure Webhooks
                </Link>
            </motion.div>

            {/* Event Types */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
            >
                <h2 className="text-2xl font-semibold text-white">Event Types</h2>
                <div className="space-y-4">
                    {eventTypes.map((category, idx) => (
                        <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-700/50">
                                <h3 className="font-semibold text-white">{category.category}</h3>
                            </div>
                            <div className="divide-y divide-slate-700/30">
                                {category.events.map((event, eventIdx) => (
                                    <div key={eventIdx} className="px-5 py-3 flex items-center justify-between hover:bg-slate-700/20">
                                        <code className="text-sm text-purple-400 font-mono">{event.name}</code>
                                        <span className="text-sm text-slate-400">{event.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Payload Example */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-4"
            >
                <h2 className="text-2xl font-semibold text-white">Payload Structure</h2>
                <p className="text-slate-400">
                    All webhook payloads follow a consistent structure with event metadata and data.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400 font-mono">Example Payload</span>
                        <button
                            onClick={() => copyCode(payloadExample, 'payload')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'payload' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-5 overflow-x-auto">
                        <code className="text-sm text-slate-300 font-mono">{payloadExample}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Signature Verification */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
            >
                <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-green-400" />
                    <h2 className="text-2xl font-semibold text-white">Signature Verification</h2>
                </div>
                <p className="text-slate-400">
                    Every webhook request includes a signature in the <code className="text-blue-400">X-CatalystWells-Signature</code> header.
                    Always verify this signature before processing events.
                </p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-amber-300 font-medium">Security Warning</p>
                        <p className="text-sm text-amber-200/80 mt-1">
                            Never skip signature verification in production. Unverified webhooks can lead to security vulnerabilities.
                        </p>
                    </div>
                </div>

                {/* JavaScript Example */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">JavaScript / Node.js</span>
                        <button
                            onClick={() => copyCode(verificationCode, 'js-verify')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'js-verify' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-5 overflow-x-auto max-h-96 sidebar-scroll">
                        <code className="text-sm text-slate-300 font-mono">{verificationCode}</code>
                    </pre>
                </div>

                {/* Python Example */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-700/50">
                        <span className="text-sm text-slate-400">Python / Flask</span>
                        <button
                            onClick={() => copyCode(pythonExample, 'py-verify')}
                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                        >
                            {copiedSection === 'py-verify' ? (
                                <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
                            )}
                        </button>
                    </div>
                    <pre className="p-5 overflow-x-auto max-h-80 sidebar-scroll">
                        <code className="text-sm text-slate-300 font-mono">{pythonExample}</code>
                    </pre>
                </div>
            </motion.div>

            {/* Best Practices */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
                <h2 className="text-xl font-semibold text-white mb-4">Best Practices</h2>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Respond quickly</p>
                            <p className="text-sm text-slate-400">Return a 2xx response within 30 seconds. Process events asynchronously.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Handle duplicates</p>
                            <p className="text-sm text-slate-400">Events may be delivered multiple times. Use the event ID for idempotency.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Use HTTPS</p>
                            <p className="text-sm text-slate-400">Webhook endpoints must use HTTPS with a valid SSL certificate.</p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium">Monitor deliveries</p>
                            <p className="text-sm text-slate-400">Check the webhook logs dashboard to debug delivery issues.</p>
                        </div>
                    </li>
                </ul>
            </motion.div>

            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between pt-6 border-t border-slate-700/50"
            >
                <Link
                    href="/dashboard/docs/authentication"
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    ← Authentication
                </Link>
                <Link
                    href="/dashboard/docs/scopes"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                    OAuth Scopes <ChevronRight className="w-4 h-4" />
                </Link>
            </motion.div>
        </div>
    )
}
