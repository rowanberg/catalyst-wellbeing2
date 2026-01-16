import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DailyTopic, ClassInfo } from '../lib/supabase'

interface DailyTopicsState {
    topics: DailyTopic[]
    classInfo: ClassInfo | null
    isLoading: boolean
    error: string | null
}

export function useDailyTopics(classId: string | undefined) {
    const [state, setState] = useState<DailyTopicsState>({
        topics: [],
        classInfo: null,
        isLoading: true,
        error: null,
    })

    const fetchDailyTopics = useCallback(async () => {
        if (!classId) {
            setState(prev => ({ ...prev, isLoading: false }))
            return
        }

        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }))

            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0]

            // Fetch today's topics for the student's class
            const { data: topics, error: topicsError } = await supabase
                .from('daily_topics')
                .select(`
          *,
          classes:class_id (
            class_name,
            subject
          ),
          profiles:teacher_id (
            first_name,
            last_name
          )
        `)
                .eq('class_id', classId)
                .eq('topic_date', today)
                .order('created_at', { ascending: false })

            if (topicsError) throw topicsError

            // Fetch class info
            const { data: classInfo, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classId)
                .single()

            if (classError) throw classError

            // Transform the data
            const transformedTopics: DailyTopic[] = (topics || []).map((topic: any) => ({
                ...topic,
                class_name: topic.classes?.class_name,
                subject: topic.classes?.subject,
                teacher_name: topic.profiles
                    ? `${topic.profiles.first_name} ${topic.profiles.last_name}`
                    : 'Unknown Teacher',
            }))

            setState({
                topics: transformedTopics,
                classInfo: classInfo as ClassInfo,
                isLoading: false,
                error: null,
            })
        } catch (error: any) {
            console.error('Error fetching daily topics:', error)
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message,
            }))
        }
    }, [classId])

    useEffect(() => {
        fetchDailyTopics()
    }, [fetchDailyTopics])

    return {
        ...state,
        refetch: fetchDailyTopics,
    }
}
