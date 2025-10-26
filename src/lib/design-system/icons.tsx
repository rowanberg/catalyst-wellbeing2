/**
 * Premium Icon System for Catalyst Wells
 * 
 * Uses carefully selected Lucide icons that are:
 * - Professional and clear
 * - Semantically appropriate
 * - Visually consistent (stroke width, style)
 * - Not overused/generic
 */

import {
  // Navigation & Core
  LayoutDashboard,
  Sparkles,
  Heart,
  UserCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  
  // Actions & Interactions
  RefreshCcw,
  BellDot,
  Search,
  Filter,
  SlidersHorizontal,
  Share2,
  Download,
  Upload,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  
  // Progress & Analytics
  TrendingUp,
  BarChart3,
  LineChart,
  Activity,
  Target,
  Award,
  Zap,
  Flame,
  
  // Learning & Education
  BookOpen,
  GraduationCap,
  Lightbulb,
  Brain,
  Library,
  FileText,
  ClipboardList,
  Calendar,
  Clock,
  Timer,
  
  // Communication
  MessageSquare,
  Send,
  Mail,
  Inbox,
  Users2,
  UserPlus,
  
  // Status & Feedback
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  
  // Media & Content
  Image,
  Video,
  FileImage,
  FileVideo,
  Paperclip,
  Link2,
  ExternalLink,
  Eye,
  EyeOff,
  
  // Settings & Configuration
  Settings,
  Sliders,
  Lock,
  Unlock,
  Key,
  Shield,
  
  // Miscellaneous
  Star,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  Globe,
  MapPin,
  
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon size presets
export const iconSizes = {
  xs: 'w-4 h-4',      // 16px
  sm: 'w-5 h-5',      // 20px
  md: 'w-6 h-6',      // 24px
  lg: 'w-8 h-8',      // 32px
  xl: 'w-10 h-10',    // 40px
} as const

// Premium icon mappings by category
export const icons = {
  // Navigation
  nav: {
    dashboard: LayoutDashboard,
    growth: Sparkles,
    wellbeing: Heart,
    profile: UserCircle2,
    menu: PanelLeftOpen,
    close: PanelLeftClose,
  },
  
  // Actions
  action: {
    refresh: RefreshCcw,
    search: Search,
    filter: Filter,
    settings: SlidersHorizontal,
    share: Share2,
    download: Download,
    upload: Upload,
    add: Plus,
    confirm: Check,
    cancel: X,
    more: MoreHorizontal,
  },
  
  // Progress
  progress: {
    trending: TrendingUp,
    chart: BarChart3,
    line: LineChart,
    activity: Activity,
    target: Target,
    achievement: Award,
    energy: Zap,
    streak: Flame,
  },
  
  // Learning
  learning: {
    book: BookOpen,
    graduate: GraduationCap,
    idea: Lightbulb,
    brain: Brain,
    library: Library,
    document: FileText,
    task: ClipboardList,
    calendar: Calendar,
    time: Clock,
    timer: Timer,
  },
  
  // Communication
  communication: {
    message: MessageSquare,
    send: Send,
    email: Mail,
    inbox: Inbox,
    users: Users2,
    invite: UserPlus,
  },
  
  // Status
  status: {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    help: HelpCircle,
    alert: AlertTriangle,
    verified: ShieldCheck,
    notification: BellDot,
  },
  
  // Media
  media: {
    image: Image,
    video: Video,
    imageFile: FileImage,
    videoFile: FileVideo,
    attachment: Paperclip,
    link: Link2,
    external: ExternalLink,
    visible: Eye,
    hidden: EyeOff,
  },
  
  // Settings
  settings: {
    general: Settings,
    controls: Sliders,
    locked: Lock,
    unlocked: Unlock,
    key: Key,
    security: Shield,
  },
  
  // Engagement
  engagement: {
    favorite: Star,
    bookmark: Bookmark,
    flag: Flag,
    tag: Tag,
    hashtag: Hash,
    mention: AtSign,
    location: MapPin,
    world: Globe,
  },
  
  // Arrows & Navigation
  arrows: {
    right: ChevronRight,
    left: ChevronLeft,
    down: ChevronDown,
    up: ChevronUp,
  },
} as const

// Icon wrapper component for consistent styling
interface IconWrapperProps {
  icon: LucideIcon
  size?: keyof typeof iconSizes
  className?: string
  strokeWidth?: number
}

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  className,
  strokeWidth = 2
}: IconWrapperProps) {
  return (
    <IconComponent 
      className={cn(iconSizes[size], className)} 
      strokeWidth={strokeWidth}
    />
  )
}

// Animated icon wrapper with motion support
import { motion, type TargetAndTransition, type VariantLabels } from 'framer-motion'

interface AnimatedIconProps extends IconWrapperProps {
  animate?: TargetAndTransition | VariantLabels
  whileHover?: TargetAndTransition | VariantLabels
  whileTap?: TargetAndTransition | VariantLabels
}

export function AnimatedIcon({ 
  icon: IconComponent, 
  size = 'md', 
  className,
  strokeWidth = 2,
  animate,
  whileHover,
  whileTap,
}: AnimatedIconProps) {
  const MotionIcon = motion(IconComponent)
  
  return (
    <MotionIcon
      className={cn(iconSizes[size], className)}
      strokeWidth={strokeWidth}
      animate={animate}
      whileHover={whileHover}
      whileTap={whileTap}
    />
  )
}

// Type exports
export type IconCategory = keyof typeof icons
export type IconSize = keyof typeof iconSizes
