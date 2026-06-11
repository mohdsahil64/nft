'use client';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { withdrawalAPI, userAPI } from '../../lib/api';
import Navbar from '../../components/shared/Navbar';
import OTPInput from '../../components/shared/OTPInput';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Play, CheckCircle, ArrowDownCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

// YouTube Ad embed URL — from env
const AD_VIDEO_URL = process.env.NEXT_PUBLIC_AD_VIDEO_URL || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
const AD_DURATION = parseInt(process.env.NEXT_PUBLIC_AD_DURATION || '30', 10);

export default function WithdrawPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);

  const [step, setStep] = useState(1); // 1=form, 2=ad, 3=otp, 4=done
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [history, setHistory] = useState([]);

  // Ad states
  const [adCountdown, setAdCountdown] = useState(AD_DURATION);
  const [adFinished, setAdFinished] = useState(false);
  const timerRef = useRef(null);

  const [form, setForm] = useState({
    amount: '',
    walletAddress: user?.walletAddress || '',
  });

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    Promise.all([userAPI.getDashboard(), withdrawalAPI.getHistory()])
      .then(([dash, hist]) => {
        setWallet(dash.data.data.wallet);
        setHistory(hist.data.data.withdrawals);
        setForm((f) => ({ ...f, walletAddress: dash.data.data.user.walletAddress || '' }));
      })
      .catch(() => {});
  }, [sessionChecked, isAuthenticated, router]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Step 1: Validate form → go to ad
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) < 1) {
      toast.error('Minimum withdrawal is 1 NFT');
      return;
    }
    if (parseFloat(form.amount) > (wallet?.nftBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }
    if (!form.walletAddress) {
      toast.error('Wallet address required');
      return;
    }
    // Go to ad step
    setStep(2);
    startAdTimer();
  };

  // Start ad countdown
  const startAdTimer = () => {
    setAdCountdown(AD_DURATION);
    setAdFinished(false);
    timerRef.current = setInterval(() => {
      setAdCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setAdFinished(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // After ad → initiate withdrawal
  const handleAdComplete = async () => {
    setLoading(true);
    try {
      const res = await withdrawalAPI.initiate({
        amount: parseFloat(form.amount),
        walletAddress: form.walletAddress,
        adWatched: true,
      });
      setWithdrawalId(res.data.data.withdrawalId);
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate withdrawal');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // OTP verification
  const handleOTPComplete = async (otp) => {
    setLoading(true);
    try {
      await withdrawalAPI.verifyOTP({ withdrawalId, otp });
      toast.success('Withdrawal confirmed! Admin will process it soon.');
      setStep(4);
      withdrawalAPI.getHistory().then((r) => setHistory(r.data.data.withdrawals));
      userAPI.getDashboard().then((r) => setWallet(r.data.data.wallet));
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const networkLabel = user?.network === 'Polygon' ? 'Polygon USDT' : 'BEP-20 USDT';

  // ─── FULLSCREEN AD OVERLAY ───
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
        {/* Timer bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-dark-900 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white font-medium">Advertisement</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-slate-400">
              {adFinished ? 'Ad Complete' : `${adCountdown}s remaining`}
            </span>
            {adFinished && (
              <button
                onClick={handleAdComplete}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
              >
                {loading ? 'Processing...' : 'Continue →'}
              </button>
            )}
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center p-2">
          <iframe
            src={`${AD_VIDEO_URL}?autoplay=1&controls=0&modestbranding=1&rel=0`}
            className="w-full h-full max-w-4xl rounded-lg"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Advertisement"
          />
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-dark-700">
          <div
            className="h-full bg-primary-500 transition-all duration-1000"
            style={{ width: `${((AD_DURATION - adCountdown) / AD_DURATION) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="max-w-lg mx-auto px-3 sm:px-6 pt-20 sm:pt-24">
        <h1 className="page-title">Withdraw NFTs</h1>

        {/* Balance card */}
        {wallet && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Available Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  {wallet.nftBalance?.toLocaleString()} <span className="text-sm text-slate-400">NFT</span>
                </p>
              </div>
              <span className="badge badge-info text-sm">{user?.network}</span>
            </div>
          </div>
        )}

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-primary-400" /> Withdrawal Details
            </h2>
            <form onSubmit={handleFormSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="label">Amount (NFT)</label>
                  <input
                    id="amount" type="number" min="1" required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Enter NFT amount"
                    className="input-field"
                  />
                  <p className="text-xs text-slate-500 mt-1">Min: 1 · Max: {wallet?.nftBalance || 0} NFT</p>
                </div>
                <div>
                  <label htmlFor="walletAddr" className="label">Wallet Address ({networkLabel})</label>
                  <input
                    id="walletAddr" type="text" required
                    value={form.walletAddress}
                    readOnly
                    placeholder="0x..."
                    className="input-field font-mono text-sm opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Watch Ad & Withdraw
              </button>
              <p className="text-xs text-slate-500 text-center mt-3">You'll need to watch a short ad before proceeding</p>
            </form>
          </div>
        )}

        {/* Step 3: OTP */}
        {step === 3 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-2">Verify Email OTP</h2>
            <p className="text-slate-400 text-sm mb-6">Enter the OTP sent to your email to confirm withdrawal</p>
            <OTPInput length={6} onComplete={handleOTPComplete} disabled={loading} />
            {loading && <div className="flex justify-center mt-6"><LoadingSpinner /></div>}
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="card text-center py-8">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Submitted</h3>
            <p className="text-slate-400 text-sm mb-6">Your request is pending admin approval. You'll receive USDT once approved.</p>
            <button onClick={() => { setStep(1); setForm({ amount: '', walletAddress: user?.walletAddress || '' }); }}
              className="btn-secondary">
              New Withdrawal
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="card mt-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Withdrawals
            </h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((w) => (
                <div key={w._id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-white">{w.amount} NFT</p>
                    <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge ${w.status === 'approved' ? 'badge-success' : w.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
