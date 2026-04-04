/* Vercel Stability Refresh - Nodemailer Removed */
const SITE_NAME = 'Rehome';
const SITE_URL = (process.env.NODE_ENV === 'production' || process.env.VERCEL)
  ? 'https://www.rehome.world'
  : 'http://localhost:5173';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const getEmailConfig = () => {
  return {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.PASSWORD_RESET_FROM_EMAIL || 'support@rehome.world',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@rehome.world',
  };
};

export const getPasswordResetEmailStatus = async () => {
  const config = getEmailConfig();
  const configured = Boolean(config.resendApiKey);
  return {
    configured,
    supportEmail: config.supportEmail,
    method: config.resendApiKey ? 'resend' : 'console_only',
  };
};

export const sendPasswordResetEmail = async ({ to, resetUrl, expiresInMinutes = 30 }) => {
  const config = getEmailConfig();
  const escapedResetUrl = escapeHtml(resetUrl);
  const escapedTo = escapeHtml(to);
  const subject = 'Reset your Rehome password';
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h1 style="margin: 0 0 12px; font-size: 24px; color: #10b981;">Reset your password</h1>
      <p style="margin: 0 0 16px;">We received a request to reset the password for <strong>${escapedTo}</strong>.</p>
      <p style="margin: 0 0 16px;">This link expires in ${expiresInMinutes} minutes.</p>
      <div style="margin: 32px 0;">
        <a href="${escapedResetUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          Reset Password
        </a>
      </div>
      <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">If you did not request this, you can ignore this email. Your password will remain unchanged.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #10b981;">${SITE_NAME}</p>
      <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">${SITE_URL}</p>
    </div>
  `;

  // 1. Try Resend if configured
  if (config.resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Rehome Support <support@rehome.world>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (response.ok) return response.json();
      const errorText = await response.text();
      console.error(`[email] Resend delivery failed: ${errorText}`);
    } catch (err) {
      console.error('[email] Resend error:', err);
    }
  }

  // 2. Fallback: Always log a clear preview for local dev / errors
  console.log('\n' + '='.repeat(60));
  console.log('🚀 UNIFORM PASSWORD RESET DELIVERY PREVIEW');
  console.log('='.repeat(60));
  console.log(`TO:      ${to}`);
  console.log(`LINK:    ${resetUrl}`);
  console.log(`EXPIRES: ${expiresInMinutes} minutes`);
  console.log('='.repeat(60) + '\n');

  return { previewed: true, url: resetUrl };
};
