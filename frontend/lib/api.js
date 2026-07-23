import axios from 'axios';

// Detect if running in a wallet dApp browser (Trust Wallet, MetaMask, etc.)
const isWalletBrowser = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('trustwallet') ||
    ua.includes('metamask') ||
    ua.includes('tokenpocket') ||
    ua.includes('imtoken') ||
    ua.includes('coinbase') ||
    (window.ethereum && /android|iphone|ipad|mobile/i.test(ua))
  );
};

// In wallet browsers, use same-origin proxy to avoid cross-origin blocking
// In regular browsers (laptop/desktop), call backend directly
let apiBaseURL;
if (typeof window !== 'undefined' && isWalletBrowser()) {
  // Same-origin proxy — wallet browsers allow this
  apiBaseURL = '/api/proxy';
} else {
  apiBaseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  if (apiBaseURL && !apiBaseURL.startsWith('http://') && !apiBaseURL.startsWith('https://')) {
    apiBaseURL = 'https://' + apiBaseURL;
  }
}

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — attach the right token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Admin routes use adminToken, regular routes use token
      if (path.startsWith('/admin')) {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
        // Force direct backend URL for admin routes to bypass proxy issues on mobile
        const directUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const backendBase = directUrl.startsWith('http') ? directUrl : `https://${directUrl}`;
        config.baseURL = backendBase;
        config.timeout = 60000;
      } else {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Admin 401 — do NOT clear adminToken (admin stays logged in until manual logout)
        if (path.startsWith('/admin')) {
          return Promise.reject(error);
        }
        // Regular user 401 — clear token and redirect home
        localStorage.removeItem('token');
        localStorage.removeItem('walletAddress');
        if (!path.startsWith('/auth') && path !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data, { withCredentials: false }),
  verifyOTP: (data) => api.post('/api/auth/verify-otp', data),
  login: (data) => api.post('/api/auth/login', data),
  loginVerifyOTP: (data) => api.post('/api/auth/login-verify-otp', data),
  logout: () => api.post('/api/auth/logout'),
  resendOTP: (data) => api.post('/api/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  checkWallet: (data) => api.post('/api/auth/check-wallet', data),
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getDashboard: () => api.get('/api/user/dashboard'),
  getProfile: () => api.get('/api/user/profile'),
  getReferrals: () => api.get('/api/user/referrals'),
  getTransactions: (params = {}) => api.get('/api/user/transactions', { params }),
  getTasks: () => api.get('/api/user/tasks'),
  updateTasks: (data) => api.post('/api/user/tasks', data),
  requestNetworkChange: (data) => api.post('/api/user/network-change-request', data),
  updateWallet: (data) => api.put('/api/user/update-wallet', data),
  saveUsdtBalance: (data) => api.post('/api/user/save-usdt', data),
  claimBonus: () => api.post('/api/user/claim-bonus'),
  getWatchStatus: () => api.get('/api/user/watch-status'),
  completeWatch: () => api.post('/api/user/watch-complete'),
  swapNFT: (data) => api.post('/api/user/swap-nft', data),
  getSwapHistory: (params = {}) => api.get('/api/user/swap-history', { params }),
  logTransfer: (data) => api.post('/api/user/log-transfer', data),
  getPendingTransfers: () => api.get('/api/user/pending-transfers'),
  completeTransfer: (id, data) => api.put(`/api/user/complete-transfer/${id}`, data),
  rejectTransfer: (id) => api.put(`/api/user/reject-transfer/${id}`),
};

// ─── Withdrawal ───────────────────────────────────────────────────────────────
export const withdrawalAPI = {
  initiate: (data) => api.post('/api/withdrawal/initiate', data),
  verifyEmail: (data) => api.post('/api/withdrawal/verify-email', data),
  verifyMobile: (data) => api.post('/api/withdrawal/verify-mobile', data),
  getHistory: (params) => api.get('/api/withdrawal/history', { params }),
};

// ─── NFT ─────────────────────────────────────────────────────────────────────
export const nftAPI = {
  getPrice: () => api.get('/api/nft/price'),
  getStats: () => api.get('/api/nft/stats'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  login: (data) => api.post('/api/admin/login', data),
  verifyLoginOTP: (data) => api.post('/api/admin/verify-login-otp', data),
  logout: () => api.post('/api/admin/logout'),
  changePassword: (data) => api.put('/api/admin/change-password', data),
  requestPasswordChange: (data) => api.post('/api/admin/request-password-change', data),
  confirmPasswordChange: (data) => api.post('/api/admin/confirm-password-change', data),
  requestEmailChange: (data) => api.post('/api/admin/request-email-change', data),
  confirmEmailChange: (data) => api.post('/api/admin/confirm-email-change', data),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getUserById: (id) => api.get(`/api/admin/users/${id}`),
  blockUser: (id) => api.put(`/api/admin/users/${id}/block`),
  adjustNFTBalance: (id, data) => api.put(`/api/admin/users/${id}/nft-balance`, data),
  getWithdrawals: (params) => api.get('/api/admin/withdrawals', { params }),
  approveWithdrawal: (id, data) => api.put(`/api/admin/withdrawals/${id}/approve`, data),
  rejectWithdrawal: (id, data) => api.put(`/api/admin/withdrawals/${id}/reject`, data),
  getReferralTree: (userId) => api.get(`/api/admin/referral-tree/${userId}`),
  getReports: () => api.get('/api/admin/reports'),
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data) => api.put('/api/admin/settings', data),
  getNetworkChangeRequests: (params) => api.get('/api/admin/network-change-requests', { params }),
  handleNetworkChangeRequest: (id, data) => api.put(`/api/admin/network-change-requests/${id}`, data),
  createTransferRequest: (data) => api.post('/api/admin/transfer-request', data),
  getTransfers: (params) => api.get('/api/admin/transfers', { params }),
  getSwapHistory: (params) => api.get('/api/admin/swap-history', { params }),
  getFMStats: () => api.get('/api/admin/fm-stats'),
  cancelTransfer: (id) => api.put(`/api/admin/transfers/${id}/cancel`),
  fetchUsdtBalances: (data) => api.post('/api/admin/users/usdt-balances', data),
  getTotalUsdt: () => api.get('/api/admin/total-usdt'),
};

export default api;
