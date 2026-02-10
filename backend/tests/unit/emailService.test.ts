jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

import sgMail from '@sendgrid/mail';
import { config } from '../../src/config/env';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../../src/services/emailService';

describe('Email service', () => {
  const originalKey = config.email.sendgridApiKey;
  const originalFrom = config.email.fromEmail;

  beforeEach(() => {
    jest.clearAllMocks();
    config.email.fromEmail = 'noreply@test.com';
  });

  afterAll(() => {
    config.email.sendgridApiKey = originalKey;
    config.email.fromEmail = originalFrom;
  });

  it('uses console fallback when sendgrid key is not configured', async () => {
    config.email.sendgridApiKey = 'your-sendgrid-api-key-here';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await sendVerificationEmail('user@example.com', 'verify-token');

    expect(logSpy).toHaveBeenCalled();
    expect(sgMail.send).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('calls SendGrid when API key is configured', async () => {
    config.email.sendgridApiKey = 'SG.real-test-key';
    (sgMail.send as jest.Mock).mockResolvedValue(undefined);

    await sendPasswordResetEmail('user@example.com', 'reset-token');

    expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.real-test-key');
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'noreply@test.com',
        subject: 'Reset your password',
      })
    );
  });
});
