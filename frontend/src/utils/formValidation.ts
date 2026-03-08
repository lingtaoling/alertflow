/**
 * Shared form validation utilities to prevent injection, XSS, and malformed input.
 */

/** Remove control chars, null bytes, and normalize whitespace */
function sanitizeText(value: string): string {
  return value
    .replace(/\0/g, "") // null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .replace(/\s+/g, " ")
    .trim();
}

/** Check for potentially dangerous patterns (script tags, event handlers, etc.) */
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript\s*:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /expression\s*\(/i, // CSS expression
  /vbscript\s*:/i,
];

function hasDangerousContent(value: string): boolean {
  return DANGEROUS_PATTERNS.some((p) => p.test(value));
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/** Allowed chars when special characters are not permitted: letters, numbers, spaces, . , - ' ! ? ( ) : / & */
const ALLOWED_TEXT_PATTERN = /^[a-zA-Z0-9\s.,\-'!?():/&]*$/;

/** Name pattern: letters, numbers, spaces, hyphen, apostrophe */
const NAME_PATTERN = /^[a-zA-Z0-9\s\-']*$/;

/** Extended pattern for descriptions: adds # _ @ %*/
const EXTENDED_TEXT_PATTERN = /^[a-zA-Z0-9\s.,\-'!?()%:/&@#_]*$/;

/** Validate and sanitize a generic text field */
export function validateText(
  value: string,
  options: {
    minLength?: number;
    maxLength: number;
    fieldName: string;
    required?: boolean;
    /** When true, allow # _ @ % (e.g. for description). Default: false */
    allowExtendedChars?: boolean;
    /** When true, use strict name pattern: letters, spaces, hyphen, apostrophe only. Default: false */
    forName?: boolean;
  },
): ValidationResult {
  const sanitized = sanitizeText(value);
  const {
    minLength = 0,
    maxLength,
    fieldName,
    required = true,
    allowExtendedChars = false,
    forName = false,
  } = options;

  if (required && !sanitized) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (!required && !sanitized) {
    return { valid: true, sanitized: "" };
  }
  if (sanitized.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }
  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} characters`,
    };
  }
  if (hasDangerousContent(sanitized)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  const pattern = forName
    ? NAME_PATTERN
    : allowExtendedChars
      ? EXTENDED_TEXT_PATTERN
      : ALLOWED_TEXT_PATTERN;
  if (!pattern.test(sanitized)) {
    return {
      valid: false,
      error: forName
        ? `${fieldName} may only contain letters, spaces, hyphen, and apostrophe`
        : allowExtendedChars
          ? `${fieldName} contains invalid characters`
          : `${fieldName} may only contain letters, numbers, spaces, and . , - ' ! ? ( ) : / &`,
    };
  }
  return { valid: true, sanitized };
}

/** Validate email format and content */
export function validateEmail(value: string): ValidationResult {
  const sanitized = sanitizeText(value).toLowerCase();
  if (!sanitized) {
    return { valid: false, error: "Email is required" };
  }
  if (sanitized.length > 255) {
    return { valid: false, error: "Email is too long" };
  }
  if (hasDangerousContent(sanitized)) {
    return { valid: false, error: "Email contains invalid characters" };
  }
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  return { valid: true, sanitized };
}

/** Validate password */
export function validatePassword(value: string): ValidationResult {
  if (!value) {
    return { valid: false, error: "Password is required" };
  }
  if (value.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (value.length > 100) {
    return { valid: false, error: "Password is too long" };
  }
  if (hasDangerousContent(value)) {
    return { valid: false, error: "Password contains invalid characters" };
  }
  return { valid: true };
}

/** Validate UUID (for orgId, etc.) */
export function validateUuid(value: string): ValidationResult {
  const sanitized = sanitizeText(value);
  if (!sanitized) {
    return { valid: false, error: "Organization is required" };
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sanitized)) {
    return { valid: false, error: "Invalid organization selected" };
  }
  return { valid: true, sanitized };
}
