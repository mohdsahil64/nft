const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: false,
      debug: false,
      connectionTimeout: 10000, // 10 sec timeout
      socketTimeout: 10000,
      greetingTimeout: 10000,
    });
  }
  return transporter;
};

/**
 * Send a generic email
 */
const sendEmail = async ({ to, subject, html }) => {
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
 * Send OTP email
 */
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  const purposeMap = {
    verification: 'Account Verification',
    login: 'Login Verification',
    withdrawal: 'Withdrawal Confirmation',
  };
  const label = purposeMap[purpose] || 'Verification';

  const purposeMsg = {
    verification: 'to verify your email and activate your FutureMint NFT account.',
    login: 'to securely log in to your FutureMint NFT account.',
    withdrawal: 'to confirm your NFT withdrawal request.',
  };
  const msg = purposeMsg[purpose] || 'for verification purposes.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${label} - FutureMint NFT</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">FutureMint NFT</h1>
                  <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Secure ${label}</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 16px; font-size: 15px; color: #334155; line-height: 1.6;">
                    Hi there,
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #334155; line-height: 1.6;">
                    Use the code below ${msg}
                  </p>

                  <!-- OTP Box -->
                  <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Your Verification Code</p>
                    <p style="margin: 0; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #4f46e5; font-family: 'Courier New', monospace;">${otp}</p>
                  </div>

                  <!-- Timer -->
                  <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                      ⏱️ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
                    If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">FutureMint NFT</p>
                        <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8;">Earn NFTs · Build Your Team · Withdraw USDT</p>
                        <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">
                          Support: futuremintnft@gmail.com | +91 9351727145
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- Sub-footer -->
            <p style="margin: 24px 0 0; font-size: 11px; color: #94a3b8; text-align: center;">
              This is an automated message from FutureMint NFT. Please do not reply.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject: `${otp} — ${label} | FutureMint NFT`, html });
};

module.exports = { sendEmail, sendOTPEmail };
