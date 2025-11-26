'use client'

import { Trophy, Star, Flame, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShoutoutsStatsProps {
    totalShoutouts: number
    categoryBreakdown: { [key: string]: number }
    currentStreak: number
    thisWeek: number
}

const categoryIcons: { [key: string]: { icon: any, color: string, gradient: string } } = {
    academic: { icon: Star, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
    behavior: { icon: Trophy, color: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
    kindness: { icon: Award, color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
    effort: { icon: TrendingUp, color: 'text-orange-600', gradient: 'from-orange-500 to-amber-500' },
    leadership: { icon: Trophy, color: 'text-purple-600', gradient: 'from-purple-500 to-violet-500' },
    creativity: { icon: Star, color: 'text-yellow-600', gradient: 'from-yellow-500 to-amber-500' }
}

export function ShoutoutsStats({ totalShoutouts, categoryBreakdown, currentStreak, thisWeek }: ShoutoutsStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Total Shoutouts */}
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex-shrink-0">
                            <Trophy className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-3xl sm:text-2xl font-bold text-slate-900">{totalShoutouts}</p>
                            <p className="text-sm sm:text-xs text-slate-600 truncate">Total Shoutouts</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* This Week */}
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex-shrink-0">
                            <TrendingUp className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-3xl sm:text-2xl font-bold text-slate-900">{thisWeek}</p>
                            <p className="text-sm sm:text-xs text-slate-600">This Week</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Streak */}
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex-shrink-0">
                            <Flame className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-3xl sm:text-2xl font-bold text-slate-900">{currentStreak}</p>
                            <p className="text-sm sm:text-xs text-slate-600">Day Streak</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Most Common */}
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0">
                            <Star className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <p className="text-base sm:text-sm font-semibold text-slate-900 capitalize truncate">
                                {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'}
                            </p>
                            <p className="text-sm sm:text-xs text-slate-600">Top Category</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="col-span-1 sm:col-span-2 lg:col-span-4 bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-5 sm:p-4 sm:p-6">
                    <h3 className="text-base sm:text-sm font-semibold text-slate-900 mb-4">Recognition Breakdown</h3>
                    <div className="space-y-3">
                        {Object.entries(categoryBreakdown).map(([category, count]) => {
                            const config = categoryIcons[category] || categoryIcons.academic
                            const Icon = config.icon
                            const percentage = totalShoutouts > 0 ? (count / totalShoutouts) * 100 : 0

                            return (
                                <div key={category} className="flex items-center gap-3">
                                    <div className={`p-1.5 bg-gradient-to-r ${config.gradient} rounded-lg flex-shrink-0`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-slate-700 capitalize">{category}</span>
                                            <span className="text-sm font-semibold text-slate-900">{count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
