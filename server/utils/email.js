import nodemailer from 'nodemailer';

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

let etherealAccount = null;

const getEmailConfig = async () => {
  // If we have Resend or SMTP credentials, use those first
  const config = {
    resendApiKey: process.env.RESEND_API_KEY || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.PASSWORD_RESET_FROM_EMAIL || process.env.SUPPORT_EMAIL || 'Rehome <noreply@rehome.world>',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@rehome.world',
  };

  // If No Credentials, Auto-Provision an Ethereal Account for "Live" Testing
  if (!config.resendApiKey && !config.smtpHost && process.env.NODE_ENV !== 'production') {
    if (!etherealAccount) {
      try {
        etherealAccount = await nodemailer.createTestAccount();
        console.log('\n' + '⚡'.repeat(30));
        console.log('📬 AUTO-PROVISIONED ETHEREAL EMAIL ACTIVATED (ZERO CONFIG)');
        console.log('------------------------------------------------------------');
        console.log(`USER:     ${etherealAccount.user}`);
        console.log(`PASS:     ${etherealAccount.pass}`);
        console.log(`PREVIEW:  https://ethereal.email/login`);
        console.log('------------------------------------------------------------');
        console.log('Real emails will be "sent" to this virtual inbox for testing.');
        console.log('⚡'.repeat(30) + '\n');
      } catch (err) {
        console.error('[email] Failed to provision Ethereal account:', err);
      }
    }

    if (etherealAccount) {
      config.smtpHost = etherealAccount.smtp.host;
      config.smtpPort = etherealAccount.smtp.port;
      config.smtpUser = etherealAccount.user;
      config.smtpPass = etherealAccount.pass;
      config.fromEmail = `Rehome (Test) <${etherealAccount.user}>`;
    }
  }

  return config;
};

export const getPasswordResetEmailStatus = async () => {
  const config = await getEmailConfig();
  const configured = Boolean(config.resendApiKey || (config.smtpHost && config.smtpUser && config.smtpPass));
  return {
    configured,
    supportEmail: config.supportEmail,
    method: config.resendApiKey ? 'resend' : (config.smtpHost ? 'smtp' : 'preview_only'),
  };
};

export const sendPasswordResetEmail = async ({ to, resetUrl, expiresInMinutes = 30 }) => {
  const config = await getEmailConfig();
  const { configured } = await getPasswordResetEmailStatus();

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
          from: config.fromEmail,
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

  // 2. Try SMTP if configured
  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });

      return await transporter.sendMail({
        from: config.fromEmail,
        to,
        subject,
        html,
      });
    } catch (err) {
      console.error('[email] SMTP error:', err);
    }
  }

  // 3. Fallback: Always log a clear preview for the user
  console.log('\n' + '='.repeat(60));
  console.log('🚀 UNIFORM PASSWORD RESET DELIVERY PREVIEW');
  console.log('='.repeat(60));
  console.log(`TO:      ${to}`);
  console.log(`LINK:    ${resetUrl}`);
  console.log(`EXPIRES: ${expiresInMinutes} minutes`);
  console.log('='.repeat(60) + '\n');

  if (!configured) {
    console.warn('[email] Password reset email was LOGGED ABOVE but NOT SENT (delivery not configured).');
  }

  return { previewed: true, url: resetUrl };
};
