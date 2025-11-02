import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for debouncing values
 * Delays updating the value until after a specified delay
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *   // Only calls API after user stops typing for 500ms
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timeout to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup function - clears timeout if value changes before delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay]) // Re-run if value or delay changes

  return debouncedValue
}

/**
 * Custom hook for debouncing callback functions
 * Prevents function from being called too frequently
 * 
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced callback function
 * 
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToServer(data)
 * }, 1000)
 * 
 * // Only saves once after user stops typing for 1 second
 * <input onChange={(e) => debouncedSave(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      // Clear previous timeout
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Set new timeout
      timerRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}
