const express = require('express');
const router = express.Router();
const {
  register,
  verifyRegistrationOTP,
  verifyEmailOTP,
  verifyMobileOTP,
  login,
  loginVerifyOTP,
  logout,
  resendOTP,
  forgotPassword,
  resetPassword,
  checkWallet,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-otp', verifyRegistrationOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/verify-mobile-otp', verifyMobileOTP);
router.post('/login', login);
router.post('/login-verify-otp', loginVerifyOTP);
router.post('/logout', logout);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/check-wallet', checkWallet);
router.post('/reset-password', resetPassword);

module.exports = router;
