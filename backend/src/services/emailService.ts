import sgMail from '@sendgrid/mail';
import { config } from '../config/env';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Sends an email verification message.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = buildFrontendUrl('/verify-email', token);

  await sendEmail({
    to: email,
    subject: 'Verify your email',
    text: `Verify your account by visiting: ${verificationUrl}`,
    html: `<p>Verify your account:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
  });
}

/**
 * Sends a password reset message.
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = buildFrontendUrl('/reset-password', token);

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    text: `Reset your password by visiting: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  if (isSendGridConfigured()) {
    sgMail.setApiKey(config.email.sendgridApiKey);

    await sgMail.send({
      to: payload.to,
      from: config.email.fromEmail,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    return;
  }

  // Development fallback so local work is unblocked without external services.
  console.log('===== EMAIL (mock) =====');
  console.log(`To: ${payload.to}`);
  console.log(`From: ${config.email.fromEmail}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(payload.text);
  console.log('========================');
}

function isSendGridConfigured(): boolean {
  const key = config.email.sendgridApiKey;

  return Boolean(
    key &&
    key.trim().length > 0 &&
    !key.includes('your-sendgrid-api-key-here')
  );
}

function buildFrontendUrl(path: string, token: string): string {
  const baseUrl = config.app.frontendUrl.replace(/\/$/, '');
  const queryToken = encodeURIComponent(token);
  return `${baseUrl}${path}?token=${queryToken}`;
}
