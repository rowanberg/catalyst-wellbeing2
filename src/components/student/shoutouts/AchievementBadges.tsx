'use client'

import { Trophy, Star, Heart, Zap, Crown, Sparkles, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AchievementBadge {
    id: string
    name: string
    description: string
    icon: any
    gradient: string
    requirement: number
    earned: boolean
    progress: number
}

interface AchievementBadgesProps {
    totalShoutouts: number
    categoryBreakdown: { [key: string]: number }
}

export function AchievementBadges({ totalShoutouts, categoryBreakdown }: AchievementBadgesProps) {
    const achievements: AchievementBadge[] = [
        {
            id: '5-shoutouts',
            name: 'Rising Star',
            description: 'Earn 5 shoutouts',
            icon: Star,
            gradient: 'from-amber-400 to-yellow-500',
            requirement: 5,
            earned: totalShoutouts >= 5,
            progress: Math.min((totalShoutouts / 5) * 100, 100)
        },
        {
            id: '10-shoutouts',
            name: 'Shining Star',
            description: 'Earn 10 shoutouts',
            icon: Sparkles,
            gradient: 'from-blue-400 to-cyan-500',
            requirement: 10,
            earned: totalShoutouts >= 10,
            progress: Math.min((totalShoutouts / 10) * 100, 100)
        },
        {
            id: '25-shoutouts',
            name: 'Super Star',
            description: 'Earn 25 shoutouts',
            icon: Trophy,
            gradient: 'from-purple-400 to-pink-500',
            requirement: 25,
            earned: totalShoutouts >= 25,
            progress: Math.min((totalShoutouts / 25) * 100, 100)
        },
        {
            id: '50-shoutouts',
            name: 'Champion',
            description: 'Earn 50 shoutouts',
            icon: Crown,
            gradient: 'from-orange-400 to-red-500',
            requirement: 50,
            earned: totalShoutouts >= 50,
            progress: Math.min((totalShoutouts / 50) * 100, 100)
        },
        {
            id: 'kindness-master',
            name: 'Kindness Master',
            description: '5 kindness shoutouts',
            icon: Heart,
            gradient: 'from-pink-400 to-rose-500',
            requirement: 5,
            earned: (categoryBreakdown.kindness || 0) >= 5,
            progress: Math.min(((categoryBreakdown.kindness || 0) / 5) * 100, 100)
        },
        {
            id: 'academic-ace',
            name: 'Academic Ace',
            description: '5 academic shoutouts',
            icon: Zap,
            gradient: 'from-indigo-400 to-blue-500',
            requirement: 5,
            earned: (categoryBreakdown.academic || 0) >= 5,
            progress: Math.min(((categoryBreakdown.academic || 0) / 5) * 100, 100)
        }
    ]

    const earnedCount = achievements.filter(a => a.earned).length

    return (
        <Card className="bg-white border border-slate-200 shadow-sm mb-6">
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">Achievements</h3>
                        <p className="text-sm text-slate-600">{earnedCount} of {achievements.length} unlocked</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        <Trophy className="h-3 w-3 mr-1" />
                        {earnedCount}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {achievements.map((achievement) => {
                        const Icon = achievement.icon
                        return (
                            <div key={achievement.id} className="relative group">
                                <div className={`
                                    aspect-square rounded-xl flex flex-col items-center justify-center p-4 sm:p-3 text-center transition-all
                                    ${achievement.earned
                                        ? `bg-gradient-to-br ${achievement.gradient} shadow-lg active:scale-95 sm:hover:scale-105`
                                        : 'bg-slate-100 active:bg-slate-200 sm:hover:bg-slate-200'
                                    }
                                `}>
                                    {achievement.earned ? (
                                        <>
                                            <Icon className="h-10 w-10 sm:h-8 sm:w-8 text-white mb-2" />
                                            <p className="text-xs font-bold text-white leading-tight">{achievement.name}</p>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-10 w-10 sm:h-8 sm:w-8 text-slate-400 mb-2" />
                                            <p className="text-xs font-medium text-slate-500 leading-tight">{achievement.name}</p>
                                            <div className="w-full bg-slate-300 h-1.5 sm:h-1 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-500 transition-all duration-500"
                                                    style={{ width: `${achievement.progress}%` }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Tooltip - mobile friendly */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity pointer-events-none z-10 hidden sm:block">
                                    {achievement.description}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
