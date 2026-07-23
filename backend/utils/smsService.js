const https = require('https');

const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_API_URL = process.env.SMS_API_URL || 'https://apihome.in/panel/api/bulksms';

/**
 * Send OTP via SMS using apihome.in API
 * @param {string} mobile - Mobile number (with or without country code)
 * @param {string} otp - 6-digit OTP
 */
const sendSMSOTP = async (mobile, otp) => {
  if (!SMS_API_KEY) {
    throw new Error('SMS API key not configured');
  }

  // Clean mobile number (remove +, spaces)
  const cleanMobile = mobile.replace(/[^0-9]/g, '');

  const url = `${SMS_API_URL}/?key=${SMS_API_KEY}&mobile=${cleanMobile}&otp=${otp}`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.status === 'Success') {
            console.log(`[SMS] OTP sent to ${cleanMobile} | RequestId: ${data.requestId}`);
            resolve(data);
          } else {
            console.error(`[SMS] Failed | Mobile: ${cleanMobile} | Response:`, body);
            reject(new Error(data.remark || 'SMS sending failed'));
          }
        } catch (e) {
          console.error(`[SMS] Parse error | Response: ${body}`);
          reject(new Error('SMS API returned invalid response'));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[SMS] Network error | Mobile: ${cleanMobile} | Error: ${err.message}`);
      reject(new Error('SMS sending failed (network error)'));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('SMS API timeout'));
    });
  });
};

module.exports = { sendSMSOTP };
