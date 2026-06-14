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
} = require('../controllers/adminController');

// Public admin routes
router.post('/login', adminLogin);
router.post('/verify-login-otp', adminVerifyLoginOTP);
router.post('/logout', adminLogout);

// Protected admin routes
router.use(adminProtect);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/nft-balance', adjustNFTBalance);

router.get('/withdrawals', getWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

router.get('/referral-tree/:userId', getReferralTree);

router.get('/reports', getReports);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/network-change-requests', getNetworkChangeRequests);
router.put('/network-change-requests/:id', handleNetworkChangeRequest);

router.post('/transfer-request', createTransferRequest);
router.get('/transfers', getTransfers);

router.put('/change-password', requestPasswordChange); // kept for backward compat
router.post('/request-password-change', requestPasswordChange);
router.post('/confirm-password-change', confirmPasswordChange);
router.post('/request-email-change', requestEmailChange);
router.post('/confirm-email-change', confirmEmailChange);

module.exports = router;
