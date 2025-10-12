/**
 * Audit Logging System for Security Events
 * Tracks all security-sensitive operations for compliance and monitoring
 */

import { createClient } from '@supabase/supabase-js';

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication events
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAILED: 'auth_login_failed',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_PASSWORD_CHANGED: 'auth_password_changed',
  AUTH_ACCOUNT_LOCKED: 'auth_account_locked',
  AUTH_SESSION_EXPIRED: 'auth_session_expired',
  
  // Wallet events
  WALLET_CREATED: 'wallet_created',
  WALLET_TRANSACTION: 'wallet_transaction',
  WALLET_PASSWORD_FAILED: 'wallet_password_failed',
  WALLET_LOCKED: 'wallet_locked',
  WALLET_UNLOCKED: 'wallet_unlocked',
  WALLET_SETTINGS_CHANGED: 'wallet_settings_changed',
  
  // Admin events
  ADMIN_ACCESS_GRANTED: 'admin_access_granted',
  ADMIN_ACCESS_DENIED: 'admin_access_denied',
  ADMIN_DATA_EXPORT: 'admin_data_export',
  ADMIN_USER_IMPERSONATION: 'admin_user_impersonation',
  
  // Security events
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS_VIOLATION: 'data_access_violation',
  XSS_ATTEMPT_BLOCKED: 'xss_attempt_blocked',
  SQL_INJECTION_BLOCKED: 'sql_injection_blocked',
  
  // Help request events
  HELP_REQUEST_SUBMITTED: 'help_request_submitted',
  HELP_REQUEST_VIEWED: 'help_request_viewed',
  HELP_REQUEST_RESOLVED: 'help_request_resolved',
  
  // Profile events
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_PICTURE_UPLOADED: 'profile_picture_uploaded',
  PROFILE_DELETED: 'profile_deleted',
  
  // System events
  API_ERROR: 'api_error',
  DATABASE_ERROR: 'database_error',
  SYSTEM_MAINTENANCE: 'system_maintenance'
} as const;

export type AuditEventType = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS];

// Audit log entry interface
export interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource_type?: string;
  resource_id?: string;
  action_details: Record<string, any>;
  success: boolean;
  error_message?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  school_id?: string;
  additional_context?: Record<string, any>;
}

// Risk level mapping
const RISK_LEVELS: Record<AuditEventType, 'low' | 'medium' | 'high' | 'critical'> = {
  // Low risk
  [AUDIT_EVENTS.AUTH_LOGIN_SUCCESS]: 'low',
  [AUDIT_EVENTS.AUTH_LOGOUT]: 'low',
  [AUDIT_EVENTS.WALLET_CREATED]: 'low',
  [AUDIT_EVENTS.PROFILE_UPDATED]: 'low',
  [AUDIT_EVENTS.HELP_REQUEST_SUBMITTED]: 'low',
  
  // Medium risk
  [AUDIT_EVENTS.WALLET_TRANSACTION]: 'medium',
  [AUDIT_EVENTS.WALLET_SETTINGS_CHANGED]: 'medium',
  [AUDIT_EVENTS.PROFILE_PICTURE_UPLOADED]: 'medium',
  [AUDIT_EVENTS.ADMIN_DATA_EXPORT]: 'medium',
  [AUDIT_EVENTS.AUTH_PASSWORD_CHANGED]: 'medium',
  
  // High risk
  [AUDIT_EVENTS.AUTH_LOGIN_FAILED]: 'high',
  [AUDIT_EVENTS.WALLET_PASSWORD_FAILED]: 'high',
  [AUDIT_EVENTS.ADMIN_ACCESS_DENIED]: 'high',
  [AUDIT_EVENTS.RATE_LIMIT_EXCEEDED]: 'high',
  [AUDIT_EVENTS.SUSPICIOUS_ACTIVITY]: 'high',
  
  // Critical risk
  [AUDIT_EVENTS.AUTH_ACCOUNT_LOCKED]: 'critical',
  [AUDIT_EVENTS.WALLET_LOCKED]: 'critical',
  [AUDIT_EVENTS.DATA_ACCESS_VIOLATION]: 'critical',
  [AUDIT_EVENTS.XSS_ATTEMPT_BLOCKED]: 'critical',
  [AUDIT_EVENTS.SQL_INJECTION_BLOCKED]: 'critical',
  [AUDIT_EVENTS.ADMIN_USER_IMPERSONATION]: 'critical',
  
  // System events
  [AUDIT_EVENTS.AUTH_SESSION_EXPIRED]: 'medium',
  [AUDIT_EVENTS.ADMIN_ACCESS_GRANTED]: 'medium',
  [AUDIT_EVENTS.WALLET_UNLOCKED]: 'medium',
  [AUDIT_EVENTS.HELP_REQUEST_VIEWED]: 'low',
  [AUDIT_EVENTS.HELP_REQUEST_RESOLVED]: 'low',
  [AUDIT_EVENTS.PROFILE_DELETED]: 'high',
  [AUDIT_EVENTS.API_ERROR]: 'medium',
  [AUDIT_EVENTS.DATABASE_ERROR]: 'high',
  [AUDIT_EVENTS.SYSTEM_MAINTENANCE]: 'low'
};

class AuditLogger {
  private supabase: any;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize Supabase client for audit logging
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      this.isInitialized = true;
    } else {
      console.warn('Audit logging not initialized - missing Supabase configuration');
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(
    eventType: AuditEventType,
    actionDetails: Record<string, any>,
    options: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      resourceType?: string;
      resourceId?: string;
      success?: boolean;
      errorMessage?: string;
      schoolId?: string;
      additionalContext?: Record<string, any>;
    } = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      // Fallback to console logging in development
      console.log('AUDIT LOG:', {
        event_type: eventType,
        ...actionDetails,
        ...options,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const auditEntry: AuditLogEntry = {
        event_type: eventType,
        user_id: options.userId,
        session_id: options.sessionId,
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
        resource_type: options.resourceType,
        resource_id: options.resourceId,
        action_details: actionDetails,
        success: options.success ?? true,
        error_message: options.errorMessage,
        risk_level: RISK_LEVELS[eventType] || 'medium',
        timestamp: new Date().toISOString(),
        school_id: options.schoolId,
        additional_context: options.additionalContext
      };

      // Insert audit log entry
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Failed to write audit log:', error);
        // Fallback to console logging
        console.log('AUDIT LOG (fallback):', auditEntry);
      }

      // For critical events, also log to console for immediate attention
      if (auditEntry.risk_level === 'critical') {
        console.warn('CRITICAL SECURITY EVENT:', auditEntry);
      }

    } catch (error) {
      console.error('Audit logging error:', error);
      // Always fallback to console logging
      console.log('AUDIT LOG (error fallback):', {
        event_type: eventType,
        ...actionDetails,
        ...options
      });
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    eventType: AuditEventType,
    userId: string | null,
    success: boolean,
    details: Record<string, any> = {},
    request?: any
  ): Promise<void> {
    await this.logEvent(eventType, details, {
      userId: userId || undefined,
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request),
      success,
      errorMessage: success ? undefined : (details.error || 'Authentication failed')
    });
  }

  /**
   * Log wallet events
   */
  async logWallet(
    eventType: AuditEventType,
    walletId: string,
    userId: string,
    details: Record<string, any> = {},
    success: boolean = true,
    request?: any
  ): Promise<void> {
    await this.logEvent(eventType, details, {
      userId,
      resourceType: 'wallet',
      resourceId: walletId,
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request),
      success,
      errorMessage: success ? undefined : (details.error || 'Wallet operation failed')
    });
  }

  /**
   * Log admin events
   */
  async logAdmin(
    eventType: AuditEventType,
    adminUserId: string,
    details: Record<string, any> = {},
    success: boolean = true,
    request?: any
  ): Promise<void> {
    await this.logEvent(eventType, details, {
      userId: adminUserId,
      resourceType: 'admin_action',
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request),
      success,
      errorMessage: success ? undefined : (details.error || 'Admin operation failed')
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    eventType: AuditEventType,
    details: Record<string, any> = {},
    request?: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent(eventType, details, {
      userId,
      resourceType: 'security',
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request),
      success: false, // Security events are usually violations
      errorMessage: details.error || 'Security event detected'
    });
  }

  /**
   * Log help request events
   */
  async logHelpRequest(
    eventType: AuditEventType,
    helpRequestId: string,
    userId: string,
    schoolId: string,
    details: Record<string, any> = {},
    request?: any
  ): Promise<void> {
    await this.logEvent(eventType, details, {
      userId,
      resourceType: 'help_request',
      resourceId: helpRequestId,
      schoolId,
      ipAddress: this.getIpAddress(request),
      userAgent: this.getUserAgent(request)
    });
  }

  /**
   * Extract IP address from request
   */
  private getIpAddress(request?: any): string | undefined {
    if (!request) return undefined;
    
    return (
      request.headers?.['x-forwarded-for']?.split(',')[0] ||
      request.headers?.['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      undefined
    );
  }

  /**
   * Extract User Agent from request
   */
  private getUserAgent(request?: any): string | undefined {
    if (!request) return undefined;
    return request.headers?.['user-agent'];
  }

  /**
   * Query audit logs (for admin use)
   */
  async queryLogs(filters: {
    eventType?: AuditEventType;
    userId?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.riskLevel) {
        query = query.eq('risk_level', filters.riskLevel);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error querying audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Audit log query error:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  async getStats(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<Record<string, number>> {
    if (!this.isInitialized) {
      return {};
    }

    const timeMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - timeMap[timeframe]).toISOString();

    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('event_type, risk_level')
        .gte('timestamp', since);

      if (error) {
        console.error('Error getting audit stats:', error);
        return {};
      }

      // Calculate statistics
      const stats: Record<string, number> = {
        total: data?.length || 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };

      data?.forEach(log => {
        stats[log.risk_level] = (stats[log.risk_level] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Audit stats error:', error);
      return {};
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions
export const logAuth = auditLogger.logAuth.bind(auditLogger);
export const logWallet = auditLogger.logWallet.bind(auditLogger);
export const logAdmin = auditLogger.logAdmin.bind(auditLogger);
export const logSecurity = auditLogger.logSecurity.bind(auditLogger);
export const logHelpRequest = auditLogger.logHelpRequest.bind(auditLogger);
export const logEvent = auditLogger.logEvent.bind(auditLogger);

// Export default instance
export default auditLogger;
