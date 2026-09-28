import { AuditLog } from '../types';

/**
 * Sanitizes untrusted user strings to neutralize HTML and script tags (XSS guard)
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Creates an ISO-8601 UTC timestamp
 */
export function getUtcIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Formats a UTC ISO timestamp into a user's localized timezone display
 */
export function formatLocalizedDateTime(
  isoString: string,
  timeZone: string = 'UTC',
  locale: string = 'en-US'
): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat(locale, {
      timeZone: timeZone === 'UTC' ? 'UTC' : timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Creates a structured Audit Log payload
 */
export function createAuditLogEntry(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  module: AuditLog['module'],
  details: string,
  severity: AuditLog['severity'] = 'INFO'
): AuditLog {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: getUtcIsoTimestamp(),
    userId,
    userName,
    userRole,
    action,
    module,
    details,
    severity,
    ipAddress: '192.168.1.108 (VPN Gateway)',
  };
}
