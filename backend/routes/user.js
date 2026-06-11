const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboard,
  getReferrals,
  getTransactions,
  updateTasks,
  getTasks,
  requestNetworkChange,
  getProfile,
  updateWallet,
  saveUsdtBalance,
  claimSignupBonus,
  logUSDTTransfer,
} = require('../controllers/userController');

router.use(protect); // all user routes require auth

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.get('/referrals', getReferrals);
router.get('/transactions', getTransactions);
router.get('/tasks', getTasks);
router.post('/tasks', updateTasks);
router.post('/network-change-request', requestNetworkChange);
router.put('/update-wallet', updateWallet);
router.post('/save-usdt', saveUsdtBalance);
router.post('/claim-bonus', claimSignupBonus);
router.post('/log-transfer', logUSDTTransfer);

module.exports = router;
