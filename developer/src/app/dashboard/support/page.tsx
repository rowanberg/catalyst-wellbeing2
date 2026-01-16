'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
    HelpCircle,
    MessageCircle,
    Mail,
    Book,
    Search,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Send,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Ticket,
    Filter
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface FAQ {
    question: string
    answer: string
    category: string
}

interface SupportTicket {
    id: string
    subject: string
    status: string
    priority: string
    created_at: string
    last_updated_at: string
}

const faqs: FAQ[] = [
    {
        question: 'How do I get started with the CatalystWells API?',
        answer: 'First, create an account and register your application. You\'ll receive a client ID and secret. Then implement OAuth 2.0 authentication to get access tokens and start making API calls.',
        category: 'Getting Started'
    },
    {
        question: 'What scopes should I request for my application?',
        answer: 'Only request the scopes your application actually needs. For student data access, you might need student.profile.read, student.attendance.read, or student.academic.read depending on your use case.',
        category: 'Authentication'
    },
    {
        question: 'How long are access tokens valid?',
        answer: 'Access tokens are valid for 1 hour. Use the refresh token to get a new access token without requiring user interaction. Refresh tokens are valid for 30 days.',
        category: 'Authentication'
    },
    {
        question: 'What are the rate limits?',
        answer: 'Sandbox environment: 100 requests/minute. Production environment: 1000 requests/minute for approved apps. Rate limit headers are included in every response.',
        category: 'API Usage'
    },
    {
        question: 'How do I test my integration?',
        answer: 'Use the Sandbox environment with test data. The API Playground lets you test endpoints interactively. You can also use the provided test credentials during development.',
        category: 'Testing'
    },
    {
        question: 'How long does app review take?',
        answer: 'App reviews typically take 1-3 business days. Make sure your privacy policy and terms of service are accessible and your app description is complete.',
        category: 'App Review'
    },
    {
        question: 'What data privacy requirements do I need to follow?',
        answer: 'All apps must comply with FERPA, COPPA (for users under 13), and GDPR. You must have appropriate data handling policies and only collect data necessary for your app\'s functionality.',
        category: 'Privacy'
    },
    {
        question: 'How do webhooks work?',
        answer: 'Webhooks send real-time HTTP POST notifications to your specified endpoint when events occur. Configure webhook URLs in your app settings and we\'ll sign each payload for verification.',
        category: 'Webhooks'
    }
]

const faqCategories = [...new Set(faqs.map(f => f.category))]

export default function SupportPage() {
    const [loading, setLoading] = useState(true)
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
    const [showNewTicket, setShowNewTicket] = useState(false)
    const [ticketFilter, setTicketFilter] = useState('all')
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'general',
        priority: 'normal',
        description: ''
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const loadTickets = async () => {
            try {
                const { data: { user } } = await devSupabase.auth.getUser()
                if (!user) return

                const { data: account } = await devSupabase
                    .from('developer_accounts')
                    .select('id')
                    .eq('auth_user_id', user.id)
                    .single()

                if (!account) return

                const { data: ticketData } = await devSupabase
                    .from('support_tickets')
                    .select('*')
                    .eq('developer_id', account.id)
                    .order('created_at', { ascending: false })

                if (ticketData) setTickets(ticketData)
            } catch (error) {
                console.error('Error loading tickets:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTickets()
    }, [])

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredTickets = tickets.filter(ticket =>
        ticketFilter === 'all' || ticket.status === ticketFilter
    )

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'open':
                return { label: 'Open', color: 'bg-blue-500/20 text-blue-400', icon: AlertCircle }
            case 'in_progress':
                return { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock }
            case 'resolved':
                return { label: 'Resolved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle }
            case 'closed':
                return { label: 'Closed', color: 'bg-slate-500/20 text-slate-400', icon: XCircle }
            default:
                return { label: status, color: 'bg-slate-500/20 text-slate-400', icon: AlertCircle }
        }
    }

    const handleSubmitTicket = async () => {
        if (!newTicket.subject || !newTicket.description) return

        setSubmitting(true)
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) throw new Error('Account not found')

            const { data: ticket, error } = await devSupabase
                .from('support_tickets')
                .insert({
                    developer_id: account.id,
                    subject: newTicket.subject,
                    category: newTicket.category,
                    priority: newTicket.priority,
                    description: newTicket.description,
                    status: 'open'
                })
                .select()
                .single()

            if (error) throw error

            setTickets([ticket, ...tickets])
            setShowNewTicket(false)
            setNewTicket({ subject: '', category: 'general', priority: 'normal', description: '' })
        } catch (error) {
            console.error('Error creating ticket:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Support</h1>
                    <p className="text-slate-400 mt-1">
                        Get help with your integration and find answers
                    </p>
                </div>
                <button
                    onClick={() => setShowNewTicket(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Ticket</span>
                </button>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                    href="/dashboard/docs"
                    className="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors group"
                >
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Book className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Documentation</h3>
                        <p className="text-sm text-slate-400">Browse API guides</p>
                    </div>
                </Link>

                <a
                    href="https://status.catalystwells.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors group"
                >
                    <div className="p-3 bg-green-500/20 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors flex items-center gap-2">
                            System Status
                            <ExternalLink className="w-3 h-3" />
                        </h3>
                        <p className="text-sm text-slate-400">All systems operational</p>
                    </div>
                </a>

                <a
                    href="mailto:developers@catalystwells.com"
                    className="flex items-center gap-4 p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors group"
                >
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Mail className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Email Support</h3>
                        <p className="text-sm text-slate-400">developers@catalystwells.com</p>
                    </div>
                </a>
            </div>

            {/* FAQ Section */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search FAQs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-700/50">
                    {filteredFaqs.map((faq, index) => (
                        <div key={index} className="p-6">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                className="flex items-start justify-between w-full text-left"
                            >
                                <div className="flex-1">
                                    <span className="text-xs text-blue-400 font-medium mb-1 block">{faq.category}</span>
                                    <h3 className="text-white font-medium pr-4">{faq.question}</h3>
                                </div>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {expandedFaq === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Your Support Tickets</h2>
                    <select
                        value={ticketFilter}
                        onChange={(e) => setTicketFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-sm text-white focus:outline-none"
                    >
                        <option value="all">All Tickets</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center">
                        <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No support tickets</h3>
                        <p className="text-slate-400 mb-4">You haven't created any support tickets yet.</p>
                        <button
                            onClick={() => setShowNewTicket(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Create Ticket
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {filteredTickets.map((ticket) => {
                            const status = getStatusConfig(ticket.status)
                            const StatusIcon = status.icon

                            return (
                                <div key={ticket.id} className="p-6 hover:bg-slate-700/20 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-white font-medium">{ticket.subject}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                Created {new Date(ticket.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                            View
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* New Ticket Modal */}
            <AnimatePresence>
                {showNewTicket && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowNewTicket(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-xl font-semibold text-white">Create Support Ticket</h2>
                                <p className="text-sm text-slate-400 mt-1">Describe your issue and we'll help you out</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        placeholder="Brief description of your issue"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                                        <select
                                            value={newTicket.category}
                                            onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none"
                                        >
                                            <option value="general">General</option>
                                            <option value="authentication">Authentication</option>
                                            <option value="api">API Issues</option>
                                            <option value="billing">Billing</option>
                                            <option value="security">Security</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                                        <select
                                            value={newTicket.priority}
                                            onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="normal">Normal</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        rows={5}
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                        placeholder="Provide detailed information about your issue..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowNewTicket(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={submitting || !newTicket.subject || !newTicket.description}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
