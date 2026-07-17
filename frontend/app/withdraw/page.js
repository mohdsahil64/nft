'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { withdrawalAPI, userAPI } from '../../lib/api';
import Navbar from '../../components/shared/Navbar';
import OTPInput from '../../components/shared/OTPInput';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Play, CheckCircle, ArrowDownCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AdOverlay from '../../components/shared/AdOverlay';

// ─── WITHDRAWAL PAUSE ─────────────────────────────────────────────────────────
// Set to true to pause withdrawals (redirects to /withdraw/paused)
// Set to false to resume normal withdrawals
const WITHDRAWAL_PAUSED = true;
// ──────────────────────────────────────────────────────────────────────────────

export default function WithdrawPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);

  const [step, setStep] = useState(1); // 1=form, 2=ad, 3=otp, 4=done
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showMinPopup, setShowMinPopup] = useState(false);

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

  // Step 1: Validate form → go to ad
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) < 200) {
      setShowMinPopup(true);
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

  // Redirect to paused page if withdrawals are paused
  useEffect(() => {
    if (WITHDRAWAL_PAUSED) {
      router.replace('/withdraw/paused');
    }
  }, []);

  if (WITHDRAWAL_PAUSED) return null;

  // ─── FULLSCREEN AD OVERLAY ───
  if (step === 2) {
    return (
      <AdOverlay
        onComplete={handleAdComplete}
        loading={loading}
        buttonText="Skip Ad"
        loadingText="Processing..."
      />
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
                  <p className="text-xs text-slate-500 mt-1">Min: 200 · Max: {wallet?.nftBalance || 0} NFT</p>
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

      {/* Minimum 500 NFT Popup */}
      {showMinPopup && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center px-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDownCircle className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Minimum Withdrawal Limit</h3>
            <p className="text-slate-400 text-sm mb-6">
              You need at least <span className="text-white font-semibold">200 NFTs</span> to make a withdrawal. Keep earning and come back when you reach the minimum!
            </p>
            <button
              onClick={() => setShowMinPopup(false)}
              className="btn-primary w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
