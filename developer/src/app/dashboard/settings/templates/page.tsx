'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    Copy,
    Check,
    Search,
    Filter,
    Globe,
    Tag,
    Code2,
    Eye,
    Loader2,
    MessageSquare,
    Bell,
    AlertTriangle,
    Info,
    CheckCircle,
    X
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface Template {
    id: string
    name: string
    description?: string
    title_template: string
    body_template: string
    category: string
    language: string
    variables: string[]
    default_type: string
    default_priority: string
    created_at: string
    updated_at: string
}

const categories = [
    { id: 'academic', label: 'Academic', icon: FileText },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'wellbeing', label: 'Wellbeing', icon: Bell },
    { id: 'general', label: 'General', icon: MessageSquare },
    { id: 'alert', label: 'Alerts', icon: AlertTriangle }
]

const notificationTypes = [
    { id: 'info', label: 'Info', color: 'text-blue-400 bg-blue-500/20' },
    { id: 'success', label: 'Success', color: 'text-green-400 bg-green-500/20' },
    { id: 'warning', label: 'Warning', color: 'text-yellow-400 bg-yellow-500/20' },
    { id: 'error', label: 'Error', color: 'text-red-400 bg-red-500/20' }
]

const priorities = ['low', 'normal', 'high', 'urgent']

const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
]

export default function TemplatesPage() {
    const [loading, setLoading] = useState(true)
    const [templates, setTemplates] = useState<Template[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
    const [applications, setApplications] = useState<any[]>([])
    const [selectedApp, setSelectedApp] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
    const [copied, setCopied] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        title_template: '',
        body_template: '',
        category: 'general',
        language: 'en',
        default_type: 'info',
        default_priority: 'normal'
    })

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (selectedApp) {
            loadTemplates()
        }
    }, [selectedApp])

    useEffect(() => {
        filterTemplates()
    }, [templates, searchQuery, categoryFilter])

    const loadData = async () => {
        try {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) return

            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('id')
                .eq('auth_user_id', user.id)
                .single()

            if (!account) return

            const { data: apps } = await devSupabase
                .from('developer_applications')
                .select('id, name')
                .eq('developer_id', account.id)

            if (apps && apps.length > 0) {
                setApplications(apps)
                setSelectedApp(apps[0].id)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadTemplates = async () => {
        try {
            const response = await fetch(`/api/templates?application_id=${selectedApp}`)
            if (response.ok) {
                const data = await response.json()
                setTemplates(data.templates || [])
            } else {
                // Sample templates
                setTemplates([
                    {
                        id: 'tpl_001',
                        name: 'Assignment Due Reminder',
                        description: 'Sent to students when an assignment is due soon',
                        title_template: 'Assignment Due: {{assignment_name}}',
                        body_template: 'Hi {{student_name}}, your assignment "{{assignment_name}}" for {{subject}} is due on {{due_date}}. Please submit before the deadline.',
                        category: 'academic',
                        language: 'en',
                        variables: ['student_name', 'assignment_name', 'subject', 'due_date'],
                        default_type: 'warning',
                        default_priority: 'high',
                        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 'tpl_002',
                        name: 'Attendance Alert',
                        description: 'Alert for low attendance',
                        title_template: 'Attendance Alert: {{student_name}}',
                        body_template: 'Dear {{parent_name}}, your child {{student_name}} has attendance of {{attendance_percent}}% which is below the minimum requirement.',
                        category: 'attendance',
                        language: 'en',
                        variables: ['parent_name', 'student_name', 'attendance_percent'],
                        default_type: 'warning',
                        default_priority: 'high',
                        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 'tpl_003',
                        name: 'Grade Published',
                        description: 'Notification when exam grades are published',
                        title_template: '{{exam_name}} Results Available',
                        body_template: 'Hi {{student_name}}, the results for {{exam_name}} have been published. You scored {{score}}/{{max_score}} in {{subject}}.',
                        category: 'academic',
                        language: 'en',
                        variables: ['student_name', 'exam_name', 'score', 'max_score', 'subject'],
                        default_type: 'info',
                        default_priority: 'normal',
                        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ])
            }
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    const filterTemplates = () => {
        let filtered = templates

        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.title_template.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter)
        }

        setFilteredTemplates(filtered)
    }

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            title_template: '',
            body_template: '',
            category: 'general',
            language: 'en',
            default_type: 'info',
            default_priority: 'normal'
        })
        setEditingTemplate(null)
    }

    const handleEdit = (template: Template) => {
        setEditingTemplate(template)
        setForm({
            name: template.name,
            description: template.description || '',
            title_template: template.title_template,
            body_template: template.body_template,
            category: template.category,
            language: template.language,
            default_type: template.default_type,
            default_priority: template.default_priority
        })
        setShowCreateModal(true)
    }

    const handleSave = async () => {
        if (!form.name || !form.title_template || !form.body_template) return

        setSaving(true)
        try {
            const method = editingTemplate ? 'PUT' : 'POST'
            const response = await fetch('/api/templates', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    application_id: selectedApp,
                    id: editingTemplate?.id
                })
            })

            if (response.ok) {
                loadTemplates()
                setShowCreateModal(false)
                resetForm()
            }
        } catch (error) {
            console.error('Error saving template:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return

        try {
            await fetch(`/api/templates?id=${templateId}`, { method: 'DELETE' })
            setTemplates(templates.filter(t => t.id !== templateId))
        } catch (error) {
            console.error('Error deleting template:', error)
        }
    }

    const copyTemplate = async (template: Template) => {
        const code = `await client.notifications.send({
  user_id: "usr_123",
  template_id: "${template.id}",
  variables: {
${template.variables.map(v => `    ${v}: "value"`).join(',\n')}
  }
})`
        await navigator.clipboard.writeText(code)
        setCopied(template.id)
        setTimeout(() => setCopied(null), 2000)
    }

    const extractVariables = (text: string): string[] => {
        const matches = text.match(/\{\{(\w+)\}\}/g) || []
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
    }

    const renderPreview = (template: string, variables: Record<string, string>) => {
        let result = template
        Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        })
        return result
    }

    const getCategoryIcon = (category: string) => {
        const cat = categories.find(c => c.id === category)
        return cat ? cat.icon : MessageSquare
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-slate-400">Loading templates...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-cyan-400" />
                        Notification Templates
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Create reusable notification templates with variables
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {applications.length > 0 && (
                        <select
                            value={selectedApp}
                            onChange={(e) => setSelectedApp(e.target.value)}
                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {applications.map((app) => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={() => {
                            resetForm()
                            setShowCreateModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-semibold text-sm transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${categoryFilter === 'all' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${categoryFilter === cat.id ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        {searchQuery || categoryFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first notification template to get started'}
                    </p>
                    {!searchQuery && categoryFilter === 'all' && (
                        <button
                            onClick={() => {
                                resetForm()
                                setShowCreateModal(true)
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl font-semibold"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Template
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => {
                        const CategoryIcon = getCategoryIcon(template.category)
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                                            <CategoryIcon className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{template.name}</h3>
                                            <span className="text-xs text-slate-500 capitalize">{template.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setPreviewTemplate(template)
                                                setShowPreviewModal(true)
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {template.description && (
                                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                                        {template.description}
                                    </p>
                                )}

                                <div className="p-3 bg-slate-900/50 rounded-lg mb-3">
                                    <p className="text-xs text-slate-500 mb-1">Title:</p>
                                    <p className="text-sm text-white font-medium truncate">{template.title_template}</p>
                                </div>

                                <div className="mb-3">
                                    <p className="text-xs text-slate-500 mb-2">Variables:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {template.variables.slice(0, 4).map((v) => (
                                            <span key={v} className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded font-mono">
                                                {`{{${v}}}`}
                                            </span>
                                        ))}
                                        {template.variables.length > 4 && (
                                            <span className="text-xs text-slate-500">
                                                +{template.variables.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${notificationTypes.find(t => t.id === template.default_type)?.color || 'text-slate-400 bg-slate-500/20'
                                            }`}>
                                            {template.default_type}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {template.language.toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyTemplate(template)}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                                    >
                                        {copied === template.id ? (
                                            <>
                                                <Check className="w-3 h-3 text-green-400" />
                                                <span className="text-green-400">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Code2 className="w-3 h-3" />
                                                <span>Copy Code</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        {editingTemplate ? 'Edit Template' : 'Create Template'}
                                    </h2>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Use {"{{variable}}"} syntax for dynamic content
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Assignment Reminder"
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                    <input
                                        type="text"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description of when this template is used"
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Title Template *</label>
                                    <input
                                        type="text"
                                        value={form.title_template}
                                        onChange={(e) => setForm({ ...form, title_template: e.target.value })}
                                        placeholder="Assignment Due: {{assignment_name}}"
                                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Body Template *</label>
                                    <textarea
                                        value={form.body_template}
                                        onChange={(e) => setForm({ ...form, body_template: e.target.value })}
                                        rows={4}
                                        placeholder="Hi {{student_name}}, your assignment is due on {{due_date}}..."
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>

                                {/* Detected Variables */}
                                {(form.title_template || form.body_template) && (
                                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                        <p className="text-xs font-medium text-cyan-400 mb-2">Detected Variables:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {extractVariables(form.title_template + ' ' + form.body_template).map((v) => (
                                                <span key={v} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded font-mono">
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                                        <select
                                            value={form.default_type}
                                            onChange={(e) => setForm({ ...form, default_type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        >
                                            {notificationTypes.map((type) => (
                                                <option key={type.id} value={type.id}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                                        <select
                                            value={form.default_priority}
                                            onChange={(e) => setForm({ ...form, default_priority: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        >
                                            {priorities.map((p) => (
                                                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                                        <select
                                            value={form.language}
                                            onChange={(e) => setForm({ ...form, language: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                        >
                                            {languages.map((lang) => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.name || !form.title_template || !form.body_template}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold text-sm transition-all"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    <span>{saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreviewModal && previewTemplate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowPreviewModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-700">
                                <h2 className="text-xl font-semibold text-white">Template Preview</h2>
                            </div>

                            <div className="p-6">
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                                            <Bell className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">
                                                {renderPreview(previewTemplate.title_template, {
                                                    student_name: 'John Doe',
                                                    assignment_name: 'Math Homework',
                                                    subject: 'Mathematics',
                                                    due_date: 'Jan 20, 2024',
                                                    exam_name: 'Mid-Term Exam',
                                                    score: '85',
                                                    max_score: '100',
                                                    parent_name: 'Jane Doe',
                                                    attendance_percent: '72'
                                                })}
                                            </p>
                                            <p className="text-sm text-slate-300 mt-2">
                                                {renderPreview(previewTemplate.body_template, {
                                                    student_name: 'John Doe',
                                                    assignment_name: 'Math Homework',
                                                    subject: 'Mathematics',
                                                    due_date: 'Jan 20, 2024',
                                                    exam_name: 'Mid-Term Exam',
                                                    score: '85',
                                                    max_score: '100',
                                                    parent_name: 'Jane Doe',
                                                    attendance_percent: '72'
                                                })}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-3">Just now</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 mt-4 text-center">
                                    Variables are replaced with sample values for preview
                                </p>
                            </div>

                            <div className="p-4 border-t border-slate-700">
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="w-full py-2 text-center text-slate-400 hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
