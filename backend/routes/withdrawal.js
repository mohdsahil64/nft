const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  initiateWithdrawal,
  verifyMobileOTP,
  getWithdrawalHistory,
} = require('../controllers/withdrawalController');

router.use(protect);

router.post('/initiate', initiateWithdrawal);
router.post('/verify-mobile', verifyMobileOTP);
router.get('/history', getWithdrawalHistory);

module.exports = router;
