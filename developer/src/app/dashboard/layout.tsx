'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Code2,
    LayoutDashboard,
    AppWindow,
    BarChart3,
    BookOpen,
    Settings,
    HelpCircle,
    Bell,
    ChevronDown,
    LogOut,
    User,
    Menu,
    X,
    Plus,
    Webhook,
    Key,
    Users,
    Shield,
    Sparkles,
    ExternalLink,
    Building2,
    FileText
} from 'lucide-react'
import { devSupabase } from '@/lib/supabase'

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    badge?: string
    children?: { name: string; href: string }[]
}

const navigation: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    {
        name: 'Applications',
        href: '/dashboard/applications',
        icon: AppWindow,
        children: [
            { name: 'All Apps', href: '/dashboard/applications' },
            { name: 'Create New', href: '/dashboard/applications/create' }
        ]
    },
    { name: 'School Connections', href: '/dashboard/schools', icon: Building2 },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'API Playground', href: '/dashboard/playground', icon: Sparkles, badge: 'New' },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
    { name: 'Documentation', href: '/dashboard/docs', icon: BookOpen },
    { name: 'Support', href: '/dashboard/support', icon: HelpCircle }
]

const settingsNavigation: NavItem[] = [
    { name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Team Members', href: '/dashboard/settings/team', icon: Users },
    { name: 'Security', href: '/dashboard/settings/security', icon: Shield },
    { name: 'Templates', href: '/dashboard/settings/templates', icon: FileText }
]

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [developerAccount, setDeveloperAccount] = useState<any>(null)
    const [notifications, setNotifications] = useState<any[]>([])
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [expandedItems, setExpandedItems] = useState<string[]>([])

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await devSupabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)

            // Get developer account
            const { data: account } = await devSupabase
                .from('developer_accounts')
                .select('*')
                .eq('auth_user_id', user.id)
                .single()

            if (account) {
                setDeveloperAccount(account)

                // Get notifications
                const { data: notifs } = await devSupabase
                    .from('developer_notifications')
                    .select('*')
                    .eq('developer_id', account.id)
                    .eq('is_read', false)
                    .order('created_at', { ascending: false })
                    .limit(5)

                if (notifs) setNotifications(notifs)
            }
        }

        getUser()
    }, [router])

    const handleLogout = async () => {
        await devSupabase.auth.signOut()
        router.push('/login')
    }

    const toggleExpanded = (name: string) => {
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        )
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    const NavLink = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href)
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedItems.includes(item.name)

        return (
            <div>
                <Link
                    href={hasChildren ? '#' : item.href}
                    onClick={(e) => {
                        if (hasChildren) {
                            e.preventDefault()
                            toggleExpanded(item.name)
                        }
                        setSidebarOpen(false)
                    }}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                >
                    <item.icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                            {item.badge}
                        </span>
                    )}
                    {hasChildren && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                </Link>

                {hasChildren && isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-slate-700/50 space-y-1">
                        {item.children?.map((child) => (
                            <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`block px-4 py-2 rounded-lg text-sm transition-colors ${pathname === child.href
                                    ? 'text-blue-400 bg-blue-500/10'
                                    : 'text-slate-500 hover:text-white hover:bg-slate-800/30'
                                    }`}
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
                                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Code2 className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">CatalystWells</h1>
                                <p className="text-xs text-slate-400">Developer Console</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Create App Button */}
                    <div className="px-4 py-4">
                        <Link
                            href="/dashboard/applications/create"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New App</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto sidebar-scroll">
                        {navigation.map((item) => (
                            <NavLink key={item.name} item={item} />
                        ))}

                        <div className="pt-6 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Settings</p>
                        </div>

                        {settingsNavigation.map((item) => (
                            <NavLink key={item.name} item={item} />
                        ))}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {developerAccount?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'D'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {developerAccount?.full_name || 'Developer'}
                                </p>
                                <p className="text-xs text-slate-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-72">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Breadcrumb - Desktop */}
                        <div className="hidden lg:flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            {pathname !== '/dashboard' && (
                                <>
                                    <span className="text-slate-600">/</span>
                                    <span className="text-white font-medium">
                                        {pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3">
                            {/* Documentation Link */}
                            <a
                                href="https://developers.catalystwells.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                <span>Docs</span>
                                <ExternalLink className="w-3 h-3" />
                            </a>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                </button>

                                <AnimatePresence>
                                    {notificationsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-700">
                                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-slate-400 text-sm">
                                                        No new notifications
                                                    </div>
                                                ) : (
                                                    notifications.map((notif) => (
                                                        <div key={notif.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-700/30">
                                                            <p className="text-sm font-medium text-white">{notif.title}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-3 border-t border-slate-700">
                                                <Link
                                                    href="/dashboard/notifications"
                                                    className="block text-center text-sm text-blue-400 hover:text-blue-300"
                                                >
                                                    View all notifications
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                        {developerAccount?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'D'}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>

                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-700">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {developerAccount?.full_name || 'Developer'}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                            </div>
                                            <div className="p-2">
                                                <Link
                                                    href="/dashboard/settings"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span>Account Settings</span>
                                                </Link>
                                                <Link
                                                    href="/dashboard/settings/security"
                                                    className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                                >
                                                    <Key className="w-4 h-4" />
                                                    <span>API Keys</span>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
