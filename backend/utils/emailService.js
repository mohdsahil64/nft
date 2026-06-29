const nodemailer = require('nodemailer');
const https = require('https');

// ─── Brevo HTTP API (Primary — works on Railway/cloud, no SMTP port needed) ──
const sendViaBrevo = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('Brevo API key not configured');

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@futuremintnft.site';

  // Diagnostic logging - shows exactly what we are sending
  console.log(`[Brevo] Preparing to send email | To: ${to} | Subject: ${subject} | Sender: ${senderEmail} | API Key (first 8): ${apiKey.substring(0, 8)}...`);

  const postData = JSON.stringify({
    sender: {
      name: 'FutureMint NFT',
      email: senderEmail,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log(`[Brevo] Response received | Status: ${res.statusCode} | StatusMessage: ${res.statusMessage}`);

        let data;
        try {
          data = JSON.parse(body);
        } catch (parseError) {
          console.error(`[Brevo] Failed to parse response JSON | Status: ${res.statusCode} | Error: ${parseError.message}`);
          return reject(new Error(`Brevo API returned non-JSON response: ${res.statusCode}`));
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`[Brevo] API returned error | Status: ${res.statusCode} | Response:`, JSON.stringify(data));
          return reject(new Error(data.message || `Brevo API error: ${res.statusCode}`));
        }

        console.log(`[Brevo] Email sent successfully | To: ${to} | MessageId: ${data.messageId || 'N/A'}`);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error(`[Brevo] https.request threw an error (network/DNS issue) | To: ${to} | Error: ${err.message}`);
      reject(new Error(`Brevo request failed (network error): ${err.message}`));
    });

    req.write(postData);
    req.end();
  });
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
 * Send email — In production, ONLY uses Brevo HTTP API (SMTP ports are blocked on Render/cloud).
 * In development, tries Brevo first then falls back to SMTP.
 */
const sendEmail = async ({ to, subject, html }) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: ONLY use Brevo HTTP API (port 443)
    // Render/cloud providers block SMTP ports (465, 587), so SMTP will never work
    if (!process.env.BREVO_API_KEY) {
      const errorMsg = '[CRITICAL] BREVO_API_KEY is not set in production environment. Emails cannot be sent. Please add BREVO_API_KEY to your Render environment variables.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const result = await sendViaBrevo({ to, subject, html });
      console.log(`[Email] Sent successfully via Brevo to ${to} | Subject: ${subject}`);
      return result;
    } catch (err) {
      console.error(`[Email] Brevo API failed in production | To: ${to} | Error: ${err.message}`);
      throw err; // Do NOT fallback to SMTP in production - it will never work
    }
  }

  // Development: Try Brevo first, fallback to SMTP
  if (process.env.BREVO_API_KEY) {
    try {
      const result = await sendViaBrevo({ to, subject, html });
      console.log(`[Email] Sent via Brevo to ${to}`);
      return result;
    } catch (err) {
      console.error('[Email] Brevo failed in dev:', err.message, '- trying SMTP fallback');
    }
  }

  // Fallback to SMTP (only works in development/local)
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
 * Send OTP email with clean simple design
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
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;border:1px solid #e0e0e0;">
          
          <!-- Header -->
          <tr>
            <td style="padding:30px 32px 20px;border-bottom:1px solid #f0f0f0;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">FutureMint NFT</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1a1a;">${content.heading}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555555;line-height:1.6;">${content.message}</p>
              
              <!-- OTP Code -->
              <div style="background:#f8f8fa;border:1px solid #e8e8e8;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:6px;color:#1a1a1a;font-family:'Courier New',monospace;">${otp}</p>
              </div>
              
              <p style="margin:0 0 16px;font-size:13px;color:#666666;line-height:1.5;">${content.note}</p>
              <p style="margin:0;font-size:13px;color:#999999;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f0f0f0;background:#fafafa;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#999999;">FutureMint NFT &mdash; futuremintnft.site</p>
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
