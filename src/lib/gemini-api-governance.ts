/**
 * Gemini API Governance SDK
 * Client wrapper for the Gemini API governance service
 */

export interface GeminiApiGovernanceConfig {
    governanceUrl: string
    governanceKey: string
}

export type GeminiModel = 'gemini_3_pro' | 'gemini_2_5_pro' | 'gemini_2_5_flash'

export interface AvailableKeyResponse {
    api_key: string
    model: GeminiModel
    capacity_remaining: {
        rpm: number | null
        rpd: number | null
        tpm: number
    }
}

export interface LogUsageRequest {
    api_key: string
    model: GeminiModel
    tokens_used: number
    success: boolean
    error?: string
}

export class GeminiApiGovernance {
    private baseUrl: string
    private apiKey: string

    constructor(config: GeminiApiGovernanceConfig) {
        this.baseUrl = config.governanceUrl
        this.apiKey = config.governanceKey
    }

    /**
     * Get an available API key for the specified model
     */
    async getAvailableKey(
        model: GeminiModel,
        estimated_tokens: number = 100
    ): Promise<AvailableKeyResponse> {
        const response = await fetch(`${this.baseUrl}/functions/v1/get-available-key`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, estimated_tokens }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to get available key')
        }

        return await response.json()
    }

    /**
     * Log API usage after making a Gemini API call
     */
    async logUsage(request: LogUsageRequest): Promise<void> {
        const response = await fetch(`${this.baseUrl}/functions/v1/log-usage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to log usage')
        }
    }

    /**
     * Get usage statistics for all keys
     */
    async getKeyStats(model?: GeminiModel) {
        const url = model
            ? `${this.baseUrl}/functions/v1/get-key-stats?model=${model}`
            : `${this.baseUrl}/functions/v1/get-key-stats`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to get key stats')
        }

        return await response.json()
    }

    /**
     * Get aggregated model usage statistics
     */
    async getModelStats() {
        const response = await fetch(`${this.baseUrl}/functions/v1/get-model-stats`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to get model stats')
        }

        return await response.json()
    }

    /**
     * Manually rotate to next available key
     */
    async rotateKey(current_key: string, model: GeminiModel, reason: string = 'manual') {
        const response = await fetch(`${this.baseUrl}/functions/v1/rotate-key`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ current_key, model, reason }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to rotate  key')
        }

        return await response.json()
    }
}


/**
 * Example usage in CatalystWells:
 * 
 * const governance = new GeminiApiGovernance({
 *   governanceUrl: process.env.GEMINI_GOVERNANCE_URL!,
 *   governanceKey: process.env.GEMINI_GOVERNANCE_ANON_KEY!,
 * })
 * 
 * // Simple approach - manual logging
 * const {api_key} = await governance.getAvailableKey('gemini_2_5_pro', 100)
 * const geminiResponse = await callGemini(api_key, prompt)
 * await governance.logUsage({
 *   api_key,
 *   model: 'gemini_2_5_pro',
 *   tokens_used: geminiResponse.usageMetadata.totalTokens,
 *   success: true
 * })
 * 
 * // Or use helper method
 * const result = await governance.withGeminiKey(
 *   'gemini_2_5_pro',
 *   100,
 *   async (apiKey) => {
 *     const response = await callGemini(apiKey, prompt)
 *     return {
 *       result: response.text,
 *       tokensUsed: response.usageMetadata.totalTokens
 *     }
 *   }
 * )
 */
