'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react'

interface ConfirmationAction {
    id: string
    tool: string
    args: any
    timestamp: string
    description?: string
}

interface ConfirmationModalProps {
    action: ConfirmationAction | null
    isOpen: boolean
    onApprove: (id: string) => void
    onReject: (id: string) => void
    onClose: () => void
}

export function ConfirmationModal({
    action,
    isOpen,
    onApprove,
    onReject,
    onClose
}: ConfirmationModalProps) {
    console.log('🎨 ConfirmationModal render:', { isOpen, hasAction: !!action })

    if (!action) {
        console.log('🎨 No action provided, returning null')
        return null
    }

    console.log('🎨 Rendering modal with action:', action.tool)

    const getActionDetails = () => {
        const { tool, args } = action

        switch (tool) {
            case 'broadcastToSchool':
            case 'send_school_broadcast':
                return {
                    title: 'Send School-Wide Announcement',
                    description: `Send message to entire school (all students and staff)`,
                    details: args.content || args.message || JSON.stringify(args, null, 2),
                    impact: 'high',
                    icon: AlertTriangle
                }
            case 'send_class_broadcast':
                return {
                    title: 'Send Class Announcement',
                    description: `Send message to Class ${args.class_id}`,
                    details: args.message,
                    impact: 'medium',
                    icon: AlertCircle
                }
            case 'send_email':
                return {
                    title: 'Send Email',
                    description: `To: ${args.recipient_email}`,
                    details: `Subject: ${args.subject}\n\n${args.body}`,
                    impact: 'medium',
                    icon: AlertCircle
                }
            case 'send_push_notification':
                return {
                    title: 'Send Push Notification',
                    description: `To: ${args.user_id}`,
                    details: args.message,
                    impact: 'low',
                    icon: AlertCircle
                }
            case 'create_admin':
                return {
                    title: 'Create Admin Account',
                    description: `Email: ${args.email}`,
                    details: `Name: ${args.first_name} ${args.last_name}`,
                    impact: 'high',
                    icon: AlertTriangle
                }
            case 'update_student':
                return {
                    title: 'Update Student Record',
                    description: `Student ID: ${args.student_id}`,
                    details: JSON.stringify(args.updates, null, 2),
                    impact: 'medium',
                    icon: AlertCircle
                }
            case 'addStudent':
                return {
                    title: 'Create New Student',
                    description: `${args.first_name} ${args.last_name}`,
                    details: `Email: ${args.email}\nStudent Number: ${args.student_number || '(not provided)'}\n\nThis will create a new student account and send them a verification email.`,
                    impact: 'medium',
                    icon: AlertCircle
                }
            default:
                return {
                    title: `Confirm: ${tool}`,
                    description: 'This action requires confirmation',
                    details: JSON.stringify(args, null, 2),
                    impact: 'medium',
                    icon: AlertCircle
                }
        }
    }

    const details = getActionDetails()
    const ImpactIcon = details.icon

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={onClose}
                    />

                    {/* Modal - Centered */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200">
                                {/* Header */}
                                <div className={`px-6 py-4 border-b flex items-center justify-between ${details.impact === 'high' ? 'bg-red-50 border-red-200' :
                                    details.impact === 'medium' ? 'bg-amber-50 border-amber-200' :
                                        'bg-blue-50 border-blue-200'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${details.impact === 'high' ? 'bg-red-100' :
                                            details.impact === 'medium' ? 'bg-amber-100' :
                                                'bg-blue-100'
                                            }`}>
                                            <ImpactIcon className={`h-5 w-5 ${details.impact === 'high' ? 'text-red-600' :
                                                details.impact === 'medium' ? 'text-amber-600' :
                                                    'text-blue-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{details.title}</h3>
                                            <p className="text-sm text-slate-600">{details.description}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="hover:bg-white/50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Action Details:</p>
                                        <div className="bg-white rounded p-3 border border-slate-200">
                                            <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono">
                                                {details.details}
                                            </pre>
                                        </div>
                                    </div>

                                    {details.impact === 'high' && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-red-800">
                                                    <strong>High Impact Action:</strong> This will affect multiple users. Please review carefully before approving.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-6 py-4 bg-slate-50 rounded-b-2xl flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => onReject(action.id)}
                                        className="flex-1 border-slate-300 hover:bg-slate-100"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => onApprove(action.id)}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Execute
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
