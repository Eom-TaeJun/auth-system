import {
  type PasswordValidationResult,
  validatePasswordStrength,
} from './password';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalizes an email address for lookup and storage.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

/**
 * Validates password strength.
 */
export function validatePassword(password: string): PasswordValidationResult {
  return validatePasswordStrength(password);
}
