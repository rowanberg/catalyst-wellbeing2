export interface ConfirmationChange {
    field: string
    oldValue: string | number | boolean | null
    newValue: string | number | boolean | null
}

export interface ConfirmationRequest {
    action: string
    target: string
    changes: ConfirmationChange[]
    warning?: string
}

export interface ConfirmationResponse {
    requiresConfirmation: true
    confirmationMessage: string
    pendingAction: any
    request: ConfirmationRequest
}

/**
 * Generate a formatted confirmation message for write operations
 * This message will be shown to the user before executing destructive actions
 */
export function generateConfirmation(request: ConfirmationRequest): string {
    const lines: string[] = []

    lines.push('⚠️  CONFIRMATION REQUIRED')
    lines.push('')
    lines.push(`Action: ${request.action}`)
    lines.push(`Target: ${request.target}`)
    lines.push('')
    lines.push('Changes:')

    for (const change of request.changes) {
        const oldVal = formatValue(change.oldValue)
        const newVal = formatValue(change.newValue)
        lines.push(`  • ${change.field}: ${oldVal} → ${newVal}`)
    }

    if (request.warning) {
        lines.push('')
        lines.push(`⚠️  WARNING: ${request.warning}`)
    }

    lines.push('')
    lines.push('Please reply with:')
    lines.push('  • "Accept" to proceed with this action')
    lines.push('  • "Decline" to cancel')

    return lines.join('\n')
}

/**
 * Format values for display in confirmation messages
 */
function formatValue(value: string | number | boolean | null): string {
    if (value === null || value === undefined) {
        return '(empty)'
    }
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
    }
    if (typeof value === 'string' && value.length === 0) {
        return '(empty)'
    }
    return String(value)
}

/**
 * Create a confirmation response object for write operations
 */
export function createConfirmationResponse(
    request: ConfirmationRequest,
    pendingAction: any
): ConfirmationResponse {
    return {
        requiresConfirmation: true,
        confirmationMessage: generateConfirmation(request),
        pendingAction,
        request
    }
}

/**
 * Check if user response is an acceptance
 */
export function isAccepted(userResponse: string): boolean {
    const normalized = userResponse.trim().toLowerCase()
    return normalized === 'accept' || normalized === 'accepted' || normalized === 'yes'
}

/**
 * Check if user response is a decline
 */
export function isDeclined(userResponse: string): boolean {
    const normalized = userResponse.trim().toLowerCase()
    return normalized === 'decline' || normalized === 'declined' || normalized === 'no' || normalized === 'cancel'
}

/**
 * Generate a cancellation message
 */
export function generateCancellationMessage(action: string): string {
    return `❌ Action cancelled: ${action}`
}

/**
 * Generate a success message after confirmation
 */
export function generateSuccessMessage(action: string, target: string): string {
    return `✅ Successfully completed: ${action} for ${target}`
}
