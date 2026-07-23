const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/adminAuth');
const {
  adminLogin,
  adminVerifyLoginOTP,
  getUsers,
  getUserById,
  blockUser,
  adjustNFTBalance,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getReferralTree,
  getReports,
  getSettings,
  updateSettings,
  getNetworkChangeRequests,
  handleNetworkChangeRequest,
  adminLogout,
  requestPasswordChange,
  confirmPasswordChange,
  requestEmailChange,
  confirmEmailChange,
  createTransferRequest,
  getTransfers,
  getUsersUsdtBalances,
  getTotalUsdt,
  getSwapHistory,
  getFMStats,
  setAnnouncement,
  getAnnouncement,
  getMaintenanceStatus,
  toggleMaintenance,
} = require('../controllers/adminController');

// Public admin routes
router.post('/login', adminLogin);
router.post('/verify-login-otp', adminVerifyLoginOTP);
router.post('/logout', adminLogout);

// Protected admin routes
router.use(adminProtect);

router.get('/users', getUsers);
router.post('/users/usdt-balances', getUsersUsdtBalances);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/nft-balance', adjustNFTBalance);

router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

router.get('/referral-tree/:userId', getReferralTree);

router.get('/reports', getReports);
router.get('/total-usdt', getTotalUsdt);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/network-change-requests', getNetworkChangeRequests);
router.put('/network-change-requests/:id', handleNetworkChangeRequest);

router.post('/transfer-request', createTransferRequest);
router.get('/transfers', getTransfers);
router.get('/swap-history', getSwapHistory);
router.get('/fm-stats', getFMStats);
router.post('/announcement', setAnnouncement);
router.get('/announcement', getAnnouncement);
router.get('/maintenance', getMaintenanceStatus);
router.post('/maintenance/toggle', toggleMaintenance);

router.put('/change-password', requestPasswordChange); // kept for backward compat
router.post('/request-password-change', requestPasswordChange);
router.post('/confirm-password-change', confirmPasswordChange);
router.post('/request-email-change', requestEmailChange);
router.post('/confirm-email-change', confirmEmailChange);

module.exports = router;
