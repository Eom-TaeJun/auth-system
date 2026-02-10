import {
  comparePassword,
  hashPassword,
  validatePasswordStrength,
} from '../../src/utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('hashes a password with bcrypt', async () => {
      const hash = await hashPassword('Test123!@#');

      expect(hash).toBeTruthy();
      expect(hash).not.toBe('Test123!@#');
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('returns true for matching password and hash', async () => {
      const hash = await hashPassword('Test123!@#');
      const matches = await comparePassword('Test123!@#', hash);

      expect(matches).toBe(true);
    });

    it('returns false for mismatched password and hash', async () => {
      const hash = await hashPassword('Test123!@#');
      const matches = await comparePassword('Wrong123!@#', hash);

      expect(matches).toBe(false);
    });

    it('returns false when hash is empty', async () => {
      const matches = await comparePassword('Test123!@#', '');
      expect(matches).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('accepts a strong password', () => {
      const result = validatePasswordStrength('Strong123!@#');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns validation errors for weak passwords', () => {
      const result = validatePasswordStrength('weak');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain uppercase letter');
      expect(result.errors).toContain('Password must contain number');
      expect(result.errors).toContain('Password must contain special character');
    });

    it('requires lowercase letters', () => {
      const result = validatePasswordStrength('STRONG123!@#');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain lowercase letter');
    });
  });
});
