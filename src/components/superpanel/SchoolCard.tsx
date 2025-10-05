'use client'

import { motion } from 'framer-motion'
import { 
  Users, MapPin, Calendar, CreditCard, AlertTriangle, 
  CheckCircle, Clock, Eye, TrendingUp, Activity 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface School {
  id: string
  name: string
  city: string
  country: string
  logo_url?: string
  plan_type: 'free' | 'basic' | 'premium'
  current_users: number
  user_limit: number
  payment_status: 'active' | 'overdue' | 'suspended' | 'cancelled'
  payment_due_date?: string
  last_payment_date?: string
  monthly_fee: number
  created_at: string
  last_activity: string
  is_active: boolean
}

interface SchoolCardProps {
  school: School
  index: number
  darkMode: boolean
  onViewDetails: () => void
}

export function SchoolCard({ school, index, darkMode, onViewDetails }: SchoolCardProps) {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-500'
      case 'basic': return 'bg-blue-500'
      case 'premium': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'overdue': return 'text-red-400'
      case 'suspended': return 'text-orange-400'
      case 'cancelled': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'overdue': return AlertTriangle
      case 'suspended': return Clock
      case 'cancelled': return AlertTriangle
      default: return Clock
    }
  }

  const usagePercentage = (school.current_users / school.user_limit) * 100
  const isNearLimit = usagePercentage >= 80
  const isOverLimit = usagePercentage >= 100

  const PaymentIcon = getPaymentStatusIcon(school.payment_status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 shadow-2xl' 
          : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl'
      } ${isOverLimit ? 'ring-2 ring-red-500/50' : isNearLimit ? 'ring-2 ring-orange-500/50' : ''}`}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isOverLimit 
          ? 'bg-gradient-to-br from-red-500/10 to-pink-500/10' 
          : isNearLimit 
            ? 'bg-gradient-to-br from-orange-500/10 to-yellow-500/10'
            : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
      }`} />

      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* School Logo */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 ${
              darkMode ? 'bg-slate-700' : 'bg-gray-100'
            } flex items-center justify-center`}>
              {school.logo_url ? (
                <Image
                  src={school.logo_url}
                  alt={school.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md sm:rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {school.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 mr-2">
              <h3 className={`font-semibold text-sm sm:text-lg truncate ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {school.name}
              </h3>
              <div className={`flex items-center gap-1 text-xs sm:text-sm ${
                darkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{school.city}, {school.country}</span>
              </div>
            </div>
          </div>

          {/* Plan Badge */}
          <Badge className={`${getPlanColor(school.plan_type)} text-white capitalize text-xs flex-shrink-0`}>
            {school.plan_type}
          </Badge>
        </div>

        {/* Stats */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          {/* User Count */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Users</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`text-xs sm:text-sm font-medium ${
                isOverLimit ? 'text-red-400' : isNearLimit ? 'text-orange-400' : 
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {school.current_users}/{school.user_limit}
              </span>
              {(isNearLimit || isOverLimit) && (
                <AlertTriangle className={`w-4 h-4 ${
                  isOverLimit ? 'text-red-400' : 'text-orange-400'
                }`} />
              )}
            </div>
          </div>

          {/* Usage Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            darkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className={`h-full transition-colors duration-300 ${
                isOverLimit 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : isNearLimit 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
            />
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Payment</span>
            </div>
            <div className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
              getPaymentStatusColor(school.payment_status)
            }`}>
              <PaymentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="capitalize">{school.payment_status}</span>
            </div>
          </div>

          {/* Revenue */}
          {school.monthly_fee > 0 && (
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
                darkMode ? 'text-slate-300' : 'text-gray-700'
              }`}>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Monthly</span>
              </div>
              <span className={`text-xs sm:text-sm font-medium ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                ₹{school.monthly_fee.toLocaleString()}
              </span>
            </div>
          )}

          {/* Last Activity */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
              darkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Last Active</span>
            </div>
            <span className={`text-xs ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {new Date(school.last_activity).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onViewDetails}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 text-xs sm:text-sm py-2"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            View Details
          </Button>
        </div>

        {/* Registration Date */}
        <div className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t flex items-center gap-1.5 sm:gap-2 text-xs ${
          darkMode ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-500'
        }`}>
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span>Registered {new Date(school.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  )
}
