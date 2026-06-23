const nodemailer = require('nodemailer');

// ─── Brevo HTTP API (Primary — works on Railway/cloud, no SMTP port needed) ──
const sendViaBrevo = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('Brevo API key not configured');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'FutureMint NFT',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@futuremintnft.site',
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Brevo API error: ${response.status}`);
  }
  return data;
};

// ─── Nodemailer SMTP (Fallback — works locally) ──────────────────────────────
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: false,
      debug: false,
      connectionTimeout: 60000,
      socketTimeout: 60000,
      greetingTimeout: 30000,
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

const sendViaSMTP = async ({ to, subject, html }) => {
  const transport = getTransporter();
  const info = await transport.sendMail({
    from: `"FutureMint NFT" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  return info;
};

/**
 * Send email — tries Brevo HTTP API first (works on Railway), falls back to SMTP (works locally)
 */
const sendEmail = async ({ to, subject, html }) => {
  // Try Brevo first (HTTP API — no port issues on cloud)
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({ to, subject, html });
    } catch (err) {
      console.error('Brevo email failed:', err.message, '— trying SMTP fallback');
    }
  }

  // Fallback to SMTP (works locally)
  return await sendViaSMTP({ to, subject, html });
};

/**
 * Get email template based on purpose
 */
const getEmailContent = (otp, purpose) => {
  const templates = {
    verification: {
      subject: `${otp} — Verify Your Account | FutureMint NFT`,
      heading: 'Welcome to FutureMint! 🎉',
      message: 'You\'re one step away from joining the future of NFT earning. Use the code below to verify your email and activate your account.',
      note: 'Once verified, you\'ll receive 100 free NFTs as a signup bonus.',
      color: '#6366f1',
    },
    login: {
      subject: `${otp} — Admin Login | FutureMint NFT`,
      heading: 'Admin Login Verification 🔐',
      message: 'Someone is trying to access the admin panel. If this is you, use the code below to complete login.',
      note: 'If you didn\'t request this, please secure your account immediately.',
      color: '#f59e0b',
    },
    withdrawal: {
      subject: `${otp} — Confirm Withdrawal | FutureMint NFT`,
      heading: 'Confirm Your Withdrawal 💰',
      message: 'You\'ve requested an NFT withdrawal. Use the code below to confirm this transaction.',
      note: 'Your NFTs will be processed for USDT conversion after confirmation.',
      color: '#10b981',
    },
  };

  return templates[purpose] || templates.verification;
};

/**
 * Send OTP email with clean modern design
 */
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  const content = getEmailContent(otp, purpose);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td><img src="${process.env.FRONTEND_URL || 'https://futuremintnft.vercel.app'}/assets/favicon/favicon-96x96.png" alt="FutureMint" width="40" height="40" style="border-radius:10px;display:block;" /></td>
                  <td style="padding-left:12px;font-size:18px;font-weight:700;color:#ffffff;">FutureMint NFT</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
              
              <!-- Color bar -->
              <div style="height:4px;background:${content.color};"></div>
              
              <!-- Content -->
              <td style="padding:36px 32px;">
                
                <!-- Heading -->
                <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">${content.heading}</p>
                
                <!-- Message -->
                <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.7;">${content.message}</p>
                
                <!-- OTP Code -->
                <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="margin:0 0 8px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Code</p>
                  <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#ffffff;font-family:'Courier New',monospace;">${otp}</p>
                </div>
                
                <!-- Note -->
                <p style="margin:0 0 20px;font-size:13px;color:#64748b;line-height:1.6;">${content.note}</p>
                
                <!-- Expiry -->
                <div style="background:rgba(${content.color === '#f59e0b' ? '245,158,11' : content.color === '#10b981' ? '16,185,129' : '99,102,241'},0.1);border-radius:8px;padding:12px 16px;">
                  <p style="margin:0;font-size:12px;color:#94a3b8;">⏱ This code expires in <strong style="color:#ffffff;">10 minutes</strong></p>
                </div>
              </td>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-size:12px;color:#475569;">FutureMint NFT — Earn, Grow, Withdraw</p>
              <p style="margin:0;font-size:11px;color:#334155;">Do not share this code with anyone.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({ to: email, subject: content.subject, html });
};

module.exports = { sendEmail, sendOTPEmail };
