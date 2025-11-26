'use client'

import { Trophy, TrendingUp, Medal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LeaderboardEntry {
    rank: number
    studentName: string
    shoutoutCount: number
    change: number // +1, -1, or 0
    isCurrentUser?: boolean
}

interface ShoutoutLeaderboardProps {
    leaderboard: LeaderboardEntry[]
}

export function ShoutoutLeaderboard({ leaderboard }: ShoutoutLeaderboardProps) {
    const getRankBadge = (rank: number) => {
        if (rank === 1) return { icon: Trophy, gradient: 'from-yellow-400 to-amber-500', label: '🥇' }
        if (rank === 2) return { icon: Medal, gradient: 'from-slate-300 to-slate-400', label: '🥈' }
        if (rank === 3) return { icon: Medal, gradient: 'from-orange-300 to-amber-600', label: '🥉' }
        return { icon: TrendingUp, gradient: 'from-blue-400 to-indigo-500', label: rank.toString() }
    }

    return (
        <Card className="bg-white border border-slate-200 shadow-sm mb-6">
            <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">Class Leaderboard</h3>
                            <p className="text-xs text-slate-600">Top performers this month</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry) => {
                        const rankConfig = getRankBadge(entry.rank)

                        return (
                            <div
                                key={entry.rank}
                                className={`
                                    flex items-center gap-2 sm:gap-3 p-3 rounded-lg transition-all
                                    ${entry.isCurrentUser
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
                                        : 'bg-slate-50 active:bg-slate-100 sm:hover:bg-slate-100'
                                    }
                                `}
                            >
                                {/* Rank Badge */}
                                <div className={`
                                    flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 rounded-lg font-bold text-white flex-shrink-0
                                    bg-gradient-to-br ${rankConfig.gradient}
                                `}>
                                    {entry.rank <= 3 ? (
                                        <span className="text-xl">{rankConfig.label}</span>
                                    ) : (
                                        <span className="text-base sm:text-sm">#{entry.rank}</span>
                                    )}
                                </div>

                                {/* Student Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-900 truncate text-base sm:text-base">
                                            {entry.studentName}
                                        </p>
                                        {entry.isCurrentUser && (
                                            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">You</Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Trophy className="h-3 w-3" />
                                        <span>{entry.shoutoutCount} shoutouts</span>
                                    </div>
                                </div>

                                {/* Change Indicator */}
                                <div className="flex-shrink-0" >
                                    {entry.change > 0 && (
                                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <TrendingUp className="h-3 w-3" />
                                            <span className="text-xs font-semibold">+{entry.change}</span>
                                        </div>
                                    )}
                                    {entry.change < 0 && (
                                        <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                            <TrendingUp className="h-3 w-3 rotate-180" />
                                            <span className="text-xs font-semibold">{entry.change}</span>
                                        </div>
                                    )}
                                    {entry.change === 0 && (
                                        <div className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                            <span className="text-xs font-semibold">-</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
