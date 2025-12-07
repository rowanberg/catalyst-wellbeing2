import { Skeleton } from "@/components/ui/skeleton"

export function AttendanceSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="px-4 md:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-14 h-14 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-48 md:w-64 rounded-lg" />
                                <Skeleton className="h-4 w-32 md:w-48 rounded" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Skeleton className="hidden md:block h-9 w-40 rounded-xl" />
                            <Skeleton className="h-9 w-9 rounded-xl" />
                            <Skeleton className="hidden md:block h-9 w-24 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 space-y-6">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 w-full">
                                    <Skeleton className="h-4 w-24 rounded" />
                                    <Skeleton className="h-10 w-16 rounded-lg" />
                                    <Skeleton className="h-4 w-32 rounded" />
                                </div>
                                <Skeleton className="h-12 w-12 rounded-2xl" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Skeleton className="h-4 w-28 rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Calendar Heatmap Skeleton */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-32 rounded" />
                        </div>
                        <Skeleton className="h-8 w-64 rounded-2xl" />
                    </div>

                    <div className="space-y-4">
                        {/* Rows of cells */}
                        {[1, 2, 3, 4, 5].map((row) => (
                            <div key={row} className="flex items-center gap-2">
                                <Skeleton className="w-12 h-4 rounded" />
                                <div className="flex gap-2 flex-1">
                                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                                        <Skeleton key={col} className="w-10 h-10 rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <Skeleton className="h-8 w-16 rounded-lg" />
                                <Skeleton className="h-3 w-20 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Class Cards Section Skeleton */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <Skeleton className="h-6 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-32 rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200/60 dark:border-gray-700/60 shadow-sm">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-32 rounded-md" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-4 w-16 rounded" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-12 rounded-2xl" />
                                </div>

                                {/* Mini Heatmap */}
                                <div className="mb-4 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-3 w-16 rounded" />
                                        <Skeleton className="h-3 w-12 rounded" />
                                    </div>
                                    <div className="flex gap-1 h-12 items-end">
                                        {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                                            <Skeleton key={bar} className="flex-1 rounded-lg" style={{ height: `${Math.random() * 60 + 40}%` }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {[1, 2, 3, 4].map((stat) => (
                                        <div key={stat} className="flex flex-col items-center gap-1">
                                            <Skeleton className="h-6 w-8 rounded" />
                                            <Skeleton className="h-2 w-10 rounded" />
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <Skeleton className="h-4 w-32 rounded" />
                                    <Skeleton className="h-4 w-20 rounded" />
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
