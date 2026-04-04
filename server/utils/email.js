const RESEND_API_URL = 'https://api.resend.com/emails';
const SITE_NAME = 'Rehome';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getEmailConfig = () => ({
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.PASSWORD_RESET_FROM_EMAIL || process.env.SUPPORT_EMAIL || '',
  replyTo: process.env.PASSWORD_RESET_REPLY_TO || process.env.SUPPORT_EMAIL || '',
  supportEmail: process.env.SUPPORT_EMAIL || '',
});

export const getPasswordResetEmailStatus = () => {
  const config = getEmailConfig();
  return {
    configured: Boolean(config.resendApiKey && config.fromEmail),
    supportEmail: config.supportEmail || null,
  };
};

export const sendPasswordResetEmail = async ({ to, resetUrl, expiresInMinutes = 30 }) => {
  const { resendApiKey, fromEmail, replyTo } = getEmailConfig();

  if (!resendApiKey || !fromEmail) {
    throw new Error('Password reset email delivery is not configured.');
  }

  const escapedResetUrl = escapeHtml(resetUrl);
  const escapedTo = escapeHtml(to);

  const subject = 'Reset your Rehome password';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6; padding: 24px;">
      <h1 style="margin: 0 0 12px; font-size: 24px;">Reset your password</h1>
      <p style="margin: 0 0 16px;">We received a request to reset the password for <strong>${escapedTo}</strong>.</p>
      <p style="margin: 0 0 16px;">This link expires in ${expiresInMinutes} minutes.</p>
      <p style="margin: 24px 0;">
        <a href="${escapedResetUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 12px;">If you did not request this, you can ignore this email.</p>
      <p style="margin: 0; color: #64748b;">${SITE_NAME}</p>
    </div>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email delivery failed (${response.status}): ${errorText}`);
  }

  return response.json();
};
