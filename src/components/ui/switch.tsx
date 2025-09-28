"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled = false, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 shadow-inner backdrop-blur-sm",
          checked 
            ? "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 shadow-blue-500/25" 
            : "bg-gray-300 hover:bg-gray-400 focus-visible:ring-gray-400 shadow-gray-500/25",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-all duration-200 transform",
            checked ? "translate-x-5 shadow-xl" : "translate-x-0 shadow-md"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
