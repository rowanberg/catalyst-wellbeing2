import { useState, useEffect, useCallback, useRef } from 'react'

interface ParentData {
    children: any[]
    profile: any
    notifications: any
}

interface UseParentDataReturn {
    data: ParentData | null
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
    updateChild: (childId: string) => void
    selectedChild: string | null
}

// In-memory cache with expiration
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const pendingRequests = new Map<string, Promise<any>>()

/**
 * Custom hook for managing parent data with intelligent caching
 * Implements SWR (stale-while-revalidate) pattern for optimal performance
 */
export function useParentData(parentId: string): UseParentDataReturn {
    const [data, setData] = useState<ParentData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [selectedChild, setSelectedChild] = useState<string | null>(null)
    const mountedRef = useRef(true)

    // Check cache first
    const getCachedData = useCallback((key: string) => {
        const cached = cache.get(key)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data
        }
        cache.delete(key)
        return null
    }, [])

    // Set cache
    const setCachedData = useCallback((key: string, data: any) => {
        cache.set(key, { data, timestamp: Date.now() })
    }, [])

    // Fetch data with request deduplication
    const fetchData = useCallback(async (skipCache = false) => {
        const cacheKey = `parent-${parentId}`

        // Return cached data if available and not skipping cache
        if (!skipCache) {
            const cachedData = getCachedData(cacheKey)
            if (cachedData) {
                setData(cachedData)
                setLoading(false)

                // Set first child as selected if not already set
                if (cachedData.children?.length > 0 && !selectedChild) {
                    setSelectedChild(cachedData.children[0].id)
                }
                return
            }
        }

        // Check if request is already pending (request deduplication)
        if (pendingRequests.has(cacheKey)) {
            try {
                const result = await pendingRequests.get(cacheKey)
                if (mountedRef.current) {
                    setData(result)
                    setLoading(false)
                    if (result.children?.length > 0 && !selectedChild) {
                        setSelectedChild(result.children[0].id)
                    }
                }
                return
            } catch (err) {
                // Handle error below
            }
        }

        // Create new request
        const requestPromise = (async () => {
            try {
                const response = await fetch(`/api/v1/parents/settings?parent_id=${parentId}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch parent data')
                }

                const result = await response.json()
                const parentData = {
                    children: result.data.children || [],
                    profile: result.data.profile || {},
                    notifications: result.data.notifications || {}
                }

                // Cache the result
                setCachedData(cacheKey, parentData)

                return parentData
            } finally {
                pendingRequests.delete(cacheKey)
            }
        })()

        pendingRequests.set(cacheKey, requestPromise)

        try {
            const result = await requestPromise

            if (mountedRef.current) {
                setData(result)
                setError(null)

                // Set first child as selected if not already set
                if (result.children?.length > 0 && !selectedChild) {
                    setSelectedChild(result.children[0].id)
                }
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err as Error)
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false)
            }
        }
    }, [parentId, getCachedData, setCachedData, selectedChild])

    // Refetch data (bypass cache)
    const refetch = useCallback(async () => {
        setLoading(true)
        await fetchData(true)
    }, [fetchData])

    // Update selected child (optimistic update)
    const updateChild = useCallback((childId: string) => {
        setSelectedChild(childId)
    }, [])

    // Initial fetch
    useEffect(() => {
        mountedRef.current = true
        fetchData()

        return () => {
            mountedRef.current = false
        }
    }, [fetchData])

    return {
        data,
        loading,
        error,
        refetch,
        updateChild,
        selectedChild
    }
}

// Hook for prefetching child data
export function usePrefetchChildData(parentId: string) {
    return useCallback(() => {
        const cacheKey = `parent-${parentId}`

        // Start prefetch if not in cache
        if (!cache.has(cacheKey)) {
            fetch(`/api/v1/parents/settings?parent_id=${parentId}`)
                .then(res => res.json())
                .then(result => {
                    cache.set(cacheKey, {
                        data: {
                            children: result.data.children || [],
                            profile: result.data.profile || {},
                            notifications: result.data.notifications || {}
                        },
                        timestamp: Date.now()
                    })
                })
                .catch(() => {
                    // Silently fail prefetch
                })
        }
    }, [parentId])
}
