'use client'

import * as React from "react"
import { Button, ButtonProps } from "./button"

/**
 * A client-side wrapper for the Button component to ensure it's always rendered on the client.
 * This helps resolve "Event handlers cannot be passed to Client Component props" errors.
 */
export const ClientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <Button {...props} ref={ref} />
  }
)

ClientButton.displayName = "ClientButton"

export { ClientButton as SafeButton }
