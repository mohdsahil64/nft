'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import { loginSuccess } from '../../../store/slices/userSlice';
import { disconnectWallet } from '../../../store/slices/walletSlice';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import OTPInput from '../../../components/shared/OTPInput';
import { getWalletProvider } from '../../../lib/walletProvider';
import { RiUserLine, RiMailLine, RiLockLine, RiGiftLine, RiPhoneLine } from 'react-icons/ri';
import { Eye, EyeOff, Shield, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function AuthContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated } = useSelector((s) => s.user);

  // Determine initial tab from URL or wallet status
  const modeParam = searchParams.get('mode');
  const refParam = searchParams.get('ref');
  const [walletRegistered, setWalletRegistered] = useState(null); // null=checking, true/false
  const [activeTab, setActiveTab] = useState(modeParam === 'login' ? 'login' : 'register');

  // Register steps: 1=form, 2=smart-contract, 3=otp, 4=success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    referralCode: refParam || '',
    network: 'BSC',
    walletAddress: address || '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  // Redirect if no wallet connected
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && !window.ethereum?.selectedAddress) {
        toast('Please connect your wallet first', { icon: '👆' });
        router.push('/');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  // Check if wallet is registered — lock tab accordingly + redirect immediately
  useEffect(() => {
    if (isConnected && address) {
      authAPI.checkWallet({ walletAddress: address }).then((res) => {
        setWalletRegistered(res.data.exists);
        // Immediately lock to correct tab based on this wallet
        if (res.data.exists) {
          setActiveTab('login');
        } else {
          setActiveTab('register');
        }
      }).catch(() => {
        setWalletRegistered(false);
        setActiveTab('register');
      });
    }
  }, [isConnected, address]); // Re-runs whenever address changes (wallet switch)

  // Save referral code from URL
  useEffect(() => {
    if (refParam) localStorage.setItem('pendingReferralCode', refParam.toUpperCase());
  }, [refParam]);

  // Load saved referral code
  useEffect(() => {
    if (!form.referralCode) {
      const saved = localStorage.getItem('pendingReferralCode');
      if (saved) setForm((f) => ({ ...f, referralCode: saved }));
    }
  }, []);

  // Sync wallet address
  useEffect(() => {
    setForm((f) => ({ ...f, walletAddress: address || '' }));
  }, [address]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Country code state (UI only — not sent to backend)
  const [countryCode, setCountryCode] = useState('+91');
  const countryCodes = [
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+1', country: 'US', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'AE', flag: '🇦🇪' },
    { code: '+966', country: 'SA', flag: '🇸🇦' },
    { code: '+92', country: 'PK', flag: '🇵🇰' },
    { code: '+880', country: 'BD', flag: '🇧🇩' },
    { code: '+977', country: 'NP', flag: '🇳🇵' },
    { code: '+61', country: 'AU', flag: '🇦🇺' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+7', country: 'RU', flag: '🇷🇺' },
    { code: '+55', country: 'BR', flag: '🇧🇷' },
    { code: '+234', country: 'NG', flag: '🇳🇬' },
    { code: '+27', country: 'ZA', flag: '🇿🇦' },
    { code: '+62', country: 'ID', flag: '🇮🇩' },
    { code: '+60', country: 'MY', flag: '🇲🇾' },
    { code: '+63', country: 'PH', flag: '🇵🇭' },
    { code: '+84', country: 'VN', flag: '🇻🇳' },
    { code: '+66', country: 'TH', flag: '🇹🇭' },
    { code: '+82', country: 'KR', flag: '🇰🇷' },
    { code: '+39', country: 'IT', flag: '🇮🇹' },
    { code: '+34', country: 'ES', flag: '🇪🇸' },
    { code: '+31', country: 'NL', flag: '🇳🇱' },
    { code: '+90', country: 'TR', flag: '🇹🇷' },
    { code: '+20', country: 'EG', flag: '🇪🇬' },
    { code: '+254', country: 'KE', flag: '🇰🇪' },
    { code: '+233', country: 'GH', flag: '🇬🇭' },
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─── LOGIN HANDLER ───
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await authAPI.login({ ...loginForm, walletAddress: address });
      const { user, token } = res.data.data;
      if (token) sessionStorage.setItem('token', token);
      dispatch(loginSuccess({ user, token }));
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── REGISTER: Step 1 → Step 2 ───
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!form.name || !form.email || !form.mobile) { toast.error('Please fill all required fields'); return; }
    if (!form.walletAddress || !form.walletAddress.startsWith('0x') || form.walletAddress.length !== 42) {
      toast.error('Wallet not connected'); router.push('/'); return;
    }
    setStep(2);
  };

  // ─── REGISTER: Step 2 — Smart Contract ───
  const handleSmartContract = async () => {
    setLoading(true);
    try {
      const { ethers } = await import('ethers');
      const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../../lib/web3');
      const injectedProvider = getWalletProvider();
      if (!injectedProvider) { toast.error('Wallet app not detected.'); setLoading(false); return; }

      const network = form.network;
      const web3Provider = new ethers.BrowserProvider(injectedProvider);
      const targetChainId = network === 'BSC' ? '0x38' : '0x89';
      const targetChainName = network === 'BSC' ? 'BNB Smart Chain' : 'Polygon';

      try {
        await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          const chainConfig = network === 'BSC'
            ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
            : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
          try { await web3Provider.send('wallet_addEthereumChain', [chainConfig]); }
          catch (_) { toast.error(`Please add ${targetChainName} manually.`); setLoading(false); return; }
        } else if (switchErr.code === 4001) { toast.error(`Please switch to ${targetChainName}.`); setLoading(false); return; }
        else { toast.error(`Switch to ${targetChainName} manually.`); setLoading(false); return; }
      }

      const freshProvider = new ethers.BrowserProvider(injectedProvider);
      let alreadyApproved = false;
      try {
        const userAddr = ethers.getAddress(form.walletAddress.toLowerCase());
        alreadyApproved = await checkUSDTAllowance(userAddr, network);
      } catch (_) {}

      if (alreadyApproved === true) {
        toast.success('Already approved! Sending OTP...');
        await sendRegistrationOTP();
        return;
      }

      toast.loading('Please confirm in your app...', { id: 'sc-approve' });
      await approveUSDTForAdmin(freshProvider, network);
      toast.success('Approved! Sending OTP...', { id: 'sc-approve' });
      await sendRegistrationOTP();
    } catch (err) {
      toast.dismiss('sc-approve');
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        toast.error('You must confirm to proceed.');
      } else if (err.message?.includes('insufficient funds')) {
        toast.error(`Insufficient ${form.network === 'BSC' ? 'BNB' : 'MATIC'} for gas.`);
      } else {
        toast.error('Smart contract failed. Registration cancelled.');
      }
      setStep(1); // Go back to form on failure
    } finally {
      setLoading(false);
    }
  };

  // ─── Send OTP after contract approval ───
  const sendRegistrationOTP = async () => {
    try {
      toast.loading('Sending OTP...', { id: 'send-otp' });
      await authAPI.register(form);
      toast.success('OTP sent to your email!', { id: 'send-otp' });
      setStep(3);
      setResendCooldown(60);
    } catch (err) {
      toast.dismiss('send-otp');
      toast.error(err.response?.data?.message || 'Failed to send OTP');
      if (err.response?.status === 400 || err.response?.status === 409) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Verify OTP ───
  const handleOTPComplete = async (otp) => {
    setOtpLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email: form.email.toLowerCase(), otp });
      const { user, token } = res.data.data;
      if (token) sessionStorage.setItem('token', token);
      localStorage.removeItem('pendingReferralCode');
      dispatch(loginSuccess({ user, token }));
      toast.success('Account created!');
      setStep(4);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await authAPI.resendOTP({ email: form.email.toLowerCase(), purpose: 'verification' });
      toast.success('OTP resent!');
      setResendCooldown(60);
    } catch (_) { toast.error('Failed to resend.'); }
  };

  // ─── Step 4: Success ───
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to FutureMint!</h2>
          <p className="text-slate-400 mb-2">Your account is ready.</p>
          <p className="text-emerald-400 font-semibold">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Step 3: OTP Verification ───
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-dark-900/80 border border-dark-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                <Shield className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Verify Email</h2>
              <p className="text-slate-400 text-sm">
                Code sent to <span className="text-cyan-400">{form.email}</span>
              </p>
            </div>
            <OTPInput length={6} onComplete={handleOTPComplete} disabled={otpLoading} />
            {otpLoading && <div className="flex justify-center mt-4"><LoadingSpinner /></div>}
            <div className="mt-5 text-center">
              <button onClick={handleResendOTP} disabled={resendCooldown > 0}
                className="text-sm text-slate-400 hover:text-cyan-400 disabled:opacity-50 flex items-center gap-1.5 mx-auto">
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
            <p className="text-xs text-slate-600 text-center mt-3">Expires in 10 min. Check spam.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: Smart Contract Approval ───
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-dark-900/80 border border-dark-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Confirm Account</h2>
              <p className="text-slate-400 text-sm">
                One-time approval on <span className="text-cyan-400 font-medium">{form.network}</span>
              </p>
            </div>
            <div className="bg-dark-800 rounded-xl border border-dark-600 p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Network</span>
                <span className="text-white font-medium">{form.network === 'BSC' ? 'BNB Smart Chain' : 'Polygon'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Address</span>
                <span className="text-white font-mono text-xs">{form.walletAddress?.slice(0, 8)}...{form.walletAddress?.slice(-6)}</span>
              </div>
            </div>
            <button onClick={handleSmartContract} disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.2)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</> : <><Shield className="w-5 h-5" /> Confirm & Continue</>}
            </button>
            <button onClick={() => setStep(1)} disabled={loading}
              className="w-full mt-3 text-sm text-slate-400 hover:text-white text-center transition-colors">
              ← Back
            </button>
            <p className="text-xs text-slate-600 text-center mt-3">
              Small gas fee ({form.network === 'BSC' ? 'BNB' : 'MATIC'}) required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN: Login / Register Tabs ───
  return (
    <div className="min-h-screen bg-[#070714] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome to
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            <span className="text-purple-400">FutureMint</span>{' '}
            <span className="text-white">NFT</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">Watch &bull; Earn &bull; Own The Future</p>
        </div>

        {/* NFT Badge */}
        <div className="relative w-[100px] h-[100px] mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
          <svg viewBox="0 0 200 200" className="relative w-full h-full" style={{ filter: 'drop-shadow(0 0 12px rgba(0,210,255,0.35)) drop-shadow(0 0 30px rgba(124,58,237,0.15))' }}>
            <defs>
              <linearGradient id="authHexGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="authHexFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#080828" />
                <stop offset="50%" stopColor="#12124a" />
                <stop offset="100%" stopColor="#080828" />
              </linearGradient>
              <filter id="authGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <polygon points="100,15 175,57 175,143 100,185 25,143 25,57" fill="url(#authHexFill)" stroke="url(#authHexGlow)" strokeWidth="3" filter="url(#authGlow)" />
            <polygon points="100,28 163,63 163,137 100,172 37,137 37,63" fill="none" stroke="url(#authHexGlow)" strokeWidth="0.7" opacity="0.3" />
            <text x="100" y="108" textAnchor="middle" fill="white" fontSize="34" fontWeight="bold" fontFamily="system-ui, sans-serif" style={{ textShadow: '0 0 10px rgba(0,210,255,0.5)' }}>NFT</text>
          </svg>
        </div>

        {/* Card with Tabs */}
        <div className="w-full max-w-sm bg-dark-900/80 border border-dark-700 rounded-2xl backdrop-blur-sm overflow-hidden">
          {/* Tab Switcher — strictly locked */}
          <div className="flex border-b border-dark-700">
            <div
              className={`flex-1 py-3.5 text-sm font-semibold text-center transition-all ${
                activeTab === 'login'
                  ? 'text-white border-b-2 border-cyan-400 bg-dark-800/50'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              Login
            </div>
            <div
              className={`flex-1 py-3.5 text-sm font-semibold text-center transition-all ${
                activeTab === 'register'
                  ? 'text-white border-b-2 border-cyan-400 bg-dark-800/50'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              Register
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {/* ─── LOGIN TAB ─── */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div className="relative">
                  <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    autoComplete="email" />
                </div>
                <div className="relative">
                  <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Password"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-12 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="submit" disabled={loginLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.2)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loginLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'SIGN IN'}
                </button>
                {/* Forgot Password */}
                <div className="text-center pt-1">
                  <Link href="/auth/forgot-password"
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors border-b border-slate-600 hover:border-cyan-400 pb-0.5">
                    Forgot Password?
                  </Link>
                </div>
              </form>
            )}

            {/* ─── REGISTER TAB ─── */}
            {activeTab === 'register' && (
              <form onSubmit={handleFormSubmit} noValidate className="space-y-3.5">
                <div className="relative">
                  <RiUserLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="name" required value={form.name} onChange={handleChange}
                    placeholder="Enter Full Name"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                </div>
                <div className="relative">
                  <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" name="email" required value={form.email} onChange={handleChange}
                    placeholder="Email Address"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                </div>
                <div className="relative flex gap-0">
                  <div className="relative flex-shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="h-full bg-dark-800 border border-dark-600 border-r-0 rounded-l-xl py-3 pl-3 pr-1 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                      style={{ width: '80px' }}
                    >
                      {countryCodes.map(({ code, country, flag }) => (
                        <option key={code} value={code}>{flag} {code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <input type="tel" name="mobile" required value={form.mobile} onChange={handleChange}
                      placeholder={`${countryCode} Mobile Number`}
                      className="w-full bg-dark-800 border border-dark-600 border-l-0 rounded-r-xl py-3 pl-3 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                </div>
                <div className="relative">
                  <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} name="password" required minLength={8}
                    value={form.password} onChange={handleChange}
                    placeholder="Create Password"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-12 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="relative">
                  <RiGiftLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" name="referralCode" value={form.referralCode} onChange={handleChange}
                    placeholder="Referral Code (Optional)"
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors uppercase"
                    style={{ textTransform: 'uppercase' }} />
                </div>
                {/* Network selector */}
                <select name="network" value={form.network} onChange={handleChange}
                  className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors">
                  <option value="BSC">BSC (BEP-20 USDT)</option>
                  <option value="Polygon">Polygon (USDT)</option>
                </select>
                {/* Wallet address (readonly) */}
                <div className="relative opacity-70">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs">🔗</span>
                  <input type="text" value={form.walletAddress} readOnly
                    className="w-full bg-dark-800 border border-dark-600 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-xs font-mono cursor-not-allowed" />
                </div>
                <button type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.2)] transition-all">
                  CREATE ACCOUNT
                </button>
              </form>
            )}

            {/* Footer text */}
            <p className="text-center text-[11px] text-slate-500 mt-5">
              {activeTab === 'login' ? (
                <>To register, connect a new wallet from home page</>
              ) : (
                <>Already registered? Connect your registered wallet to login</>
              )}
            </p>

            {/* Use Other Wallet */}
            <button
              onClick={() => {
                // Clear all wallet state completely
                dispatch(disconnectWallet());
                localStorage.removeItem('walletAddress');
                sessionStorage.removeItem('token');
                // Small delay then redirect so Redux state fully clears
                setTimeout(() => router.push('/'), 100);
              }}
              className="w-full mt-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 bg-dark-800 border border-dark-600 hover:border-purple-500/30 hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              🔄 Use Other Wallet
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-slate-600 mt-6 text-center">
          By creating an account, you agree to our{' '}
          <span className="text-purple-400">Terms & Conditions</span>
        </p>

        {/* Back to home */}
        <Link href="/" className="text-xs text-slate-500 hover:text-white mt-4 transition-colors">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
