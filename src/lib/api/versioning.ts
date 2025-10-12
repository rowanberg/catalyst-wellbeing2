/**
 * API Versioning System
 * Manages API versions and backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

// Supported API versions
export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
  LATEST: 'v2'
} as const;

export type APIVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

// Version compatibility matrix
const VERSION_COMPATIBILITY: Record<APIVersion, APIVersion[]> = {
  v1: ['v1'],
  v2: ['v1', 'v2']
};

// Deprecated versions and their sunset dates
const DEPRECATED_VERSIONS: Record<string, { 
  sunsetDate: string; 
  replacedBy: APIVersion;
  warningMessage: string;
}> = {
  v1: {
    sunsetDate: '2025-12-31',
    replacedBy: 'v2',
    warningMessage: 'API v1 is deprecated and will be removed on 2025-12-31. Please migrate to v2.'
  }
};

// Version-specific feature flags
const VERSION_FEATURES: Record<APIVersion, Record<string, boolean>> = {
  v1: {
    enhancedSecurity: false,
    auditLogging: false,
    advancedCaching: false,
    decimalArithmetic: false
  },
  v2: {
    enhancedSecurity: true,
    auditLogging: true,
    advancedCaching: true,
    decimalArithmetic: true
  }
};

/**
 * Extract API version from request
 */
export function extractAPIVersion(request: NextRequest): APIVersion {
  // Method 1: Check URL path (/api/v1/student/wallet)
  const pathMatch = request.nextUrl.pathname.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    const version = pathMatch[1] as APIVersion;
    if (isValidVersion(version)) {
      return version;
    }
  }

  // Method 2: Check Accept header (Accept: application/vnd.catalyst.v2+json)
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.catalyst\.(v\d+)\+json/);
    if (versionMatch) {
      const version = versionMatch[1] as APIVersion;
      if (isValidVersion(version)) {
        return version;
      }
    }
  }

  // Method 3: Check custom header (API-Version: v2)
  const versionHeader = request.headers.get('API-Version') as APIVersion;
  if (versionHeader && isValidVersion(versionHeader)) {
    return versionHeader;
  }

  // Method 4: Check query parameter (?version=v2)
  const versionParam = request.nextUrl.searchParams.get('version') as APIVersion;
  if (versionParam && isValidVersion(versionParam)) {
    return versionParam;
  }

  // Default to latest version
  return API_VERSIONS.LATEST;
}

/**
 * Check if version is valid
 */
function isValidVersion(version: string): version is APIVersion {
  return Object.values(API_VERSIONS).includes(version as APIVersion);
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: APIVersion): boolean {
  return version in DEPRECATED_VERSIONS;
}

/**
 * Get deprecation info for version
 */
export function getDeprecationInfo(version: APIVersion) {
  return DEPRECATED_VERSIONS[version] || null;
}

/**
 * Check if feature is enabled for version
 */
export function isFeatureEnabled(version: APIVersion, feature: string): boolean {
  return VERSION_FEATURES[version]?.[feature] || false;
}

/**
 * Version compatibility middleware
 */
export function withVersioning(
  handlers: Partial<Record<APIVersion, (request: NextRequest) => Promise<NextResponse>>>
) {
  return async function versionedHandler(request: NextRequest): Promise<NextResponse> {
    const requestedVersion = extractAPIVersion(request);
    
    // Check if we have a handler for this version
    let handler = handlers[requestedVersion];
    
    // If no handler for requested version, try compatible versions
    if (!handler) {
      const compatibleVersions = VERSION_COMPATIBILITY[requestedVersion] || [];
      for (const version of compatibleVersions) {
        if (handlers[version]) {
          handler = handlers[version];
          break;
        }
      }
    }

    // If still no handler, return version not supported
    if (!handler) {
      return NextResponse.json({
        error: 'API version not supported',
        requestedVersion,
        supportedVersions: Object.values(API_VERSIONS),
        code: 'VERSION_NOT_SUPPORTED'
      }, { status: 400 });
    }

    // Execute handler
    const response = await handler(request);

    // Add versioning headers
    response.headers.set('API-Version', requestedVersion);
    response.headers.set('API-Supported-Versions', Object.values(API_VERSIONS).join(', '));
    
    // Add deprecation warning if needed
    const deprecationInfo = getDeprecationInfo(requestedVersion);
    if (deprecationInfo) {
      response.headers.set('Warning', `299 - "${deprecationInfo.warningMessage}"`);
      response.headers.set('Sunset', deprecationInfo.sunsetDate);
      response.headers.set('Link', `</api/docs/migration>; rel="successor-version"`);
    }

    return response;
  };
}

/**
 * Transform response based on API version
 */
export function transformResponse(data: any, version: APIVersion): any {
  switch (version) {
    case 'v1':
      return transformToV1(data);
    case 'v2':
      return transformToV2(data);
    default:
      return data;
  }
}

/**
 * Transform data to v1 format (backward compatibility)
 */
function transformToV1(data: any): any {
  if (data.wallet) {
    // v1 didn't have certain fields
    const { walletXp, trustScore, achievements, settings, ...v1Wallet } = data.wallet;
    return {
      ...data,
      wallet: {
        ...v1Wallet,
        // v1 used different field names
        gems: v1Wallet.mindGemsBalance,
        fluxon: v1Wallet.fluxonBalance
      }
    };
  }

  if (data.transaction) {
    // v1 had simpler transaction format
    const { metadata, auditTrail, ...v1Transaction } = data.transaction;
    return {
      ...data,
      transaction: v1Transaction
    };
  }

  return data;
}

/**
 * Transform data to v2 format (latest)
 */
function transformToV2(data: any): any {
  // v2 is the current format, no transformation needed
  return data;
}

/**
 * Validate request payload based on version
 */
export function validateRequestPayload(payload: any, version: APIVersion, endpoint: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Version-specific validation rules
  switch (version) {
    case 'v1':
      return validateV1Payload(payload, endpoint);
    case 'v2':
      return validateV2Payload(payload, endpoint);
    default:
      errors.push('Unknown API version');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * V1 payload validation (legacy)
 */
function validateV1Payload(payload: any, endpoint: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // V1 validation rules (simpler)
  if (endpoint === 'wallet/send') {
    if (!payload.amount || typeof payload.amount !== 'number') {
      errors.push('amount must be a number');
    }
    if (!payload.currency || !['gems', 'fluxon'].includes(payload.currency)) {
      errors.push('currency must be gems or fluxon');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * V2 payload validation (current)
 */
function validateV2Payload(payload: any, endpoint: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // V2 validation rules (enhanced)
  if (endpoint === 'wallet/send') {
    if (!payload.amount || (typeof payload.amount !== 'number' && typeof payload.amount !== 'string')) {
      errors.push('amount must be a number or string');
    }
    if (!payload.currencyType || !['mind_gems', 'fluxon'].includes(payload.currencyType)) {
      errors.push('currencyType must be mind_gems or fluxon');
    }
    if (payload.memo && typeof payload.memo !== 'string') {
      errors.push('memo must be a string');
    }
    if (payload.memo && payload.memo.length > 500) {
      errors.push('memo must be less than 500 characters');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Migration helper - generates migration guide
 */
export function generateMigrationGuide(fromVersion: APIVersion, toVersion: APIVersion): {
  breaking_changes: string[];
  new_features: string[];
  deprecated_fields: string[];
  migration_steps: string[];
} {
  const guides: Record<string, any> = {
    'v1_to_v2': {
      breaking_changes: [
        'Field names changed: gems -> mindGemsBalance, fluxon -> fluxonBalance',
        'Currency type field changed: currency -> currencyType',
        'Enhanced error responses with error codes',
        'Stricter input validation'
      ],
      new_features: [
        'Audit logging for all transactions',
        'Enhanced security with bcrypt password hashing',
        'Decimal arithmetic for precise calculations',
        'Advanced caching with TTL',
        'Rate limiting protection',
        'CSRF protection for state-changing operations'
      ],
      deprecated_fields: [
        'wallet.gems (use wallet.mindGemsBalance)',
        'wallet.fluxon (use wallet.fluxonBalance)',
        'transaction.currency (use transaction.currencyType)'
      ],
      migration_steps: [
        '1. Update field names in your client code',
        '2. Handle new error response format with codes',
        '3. Update currency type values',
        '4. Implement CSRF token handling',
        '5. Update request/response type definitions',
        '6. Test with new validation rules'
      ]
    }
  };

  const key = `${fromVersion}_to_${toVersion}`;
  return guides[key] || {
    breaking_changes: [],
    new_features: [],
    deprecated_fields: [],
    migration_steps: []
  };
}

// Export version utilities
export const versionUtils = {
  extractAPIVersion,
  isVersionDeprecated,
  getDeprecationInfo,
  isFeatureEnabled,
  transformResponse,
  validateRequestPayload,
  generateMigrationGuide
};
