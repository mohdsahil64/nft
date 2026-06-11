const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initiateWithdrawal,
  verifyWithdrawalOTP,
  getWithdrawalHistory,
} = require('../controllers/withdrawalController');

router.use(protect);

router.post('/initiate', initiateWithdrawal);
router.post('/verify-otp', verifyWithdrawalOTP);
router.get('/history', getWithdrawalHistory);

module.exports = router;
