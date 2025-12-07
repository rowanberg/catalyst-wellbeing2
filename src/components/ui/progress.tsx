"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps {
  value?: number
  className?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full transition-colors",
          className
        )}
        style={{
          backgroundColor: 'color-mix(in srgb, var(--theme-highlight) 50%, transparent)'
        }}
        {...props}
      >
        <div
          className="h-full w-full flex-1 transition-all"
          style={{
            background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
            transform: `translateX(-${100 - (value || 0)}%)`
          }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
