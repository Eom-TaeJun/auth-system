import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('normalizeEmail', () => {
    it('normalizes casing and whitespace', () => {
      expect(normalizeEmail('  TeSt@Example.COM  ')).toBe('test@example.com');
    });
  });

  describe('validateEmail', () => {
    it('accepts valid email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('User.Name+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('no-at-symbol.com')).toBe(false);
      expect(validateEmail('@missing-local-part.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('returns valid for strong password', () => {
      const result = validatePassword('Test123!@#');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for weak password', () => {
      const result = validatePassword('short');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
