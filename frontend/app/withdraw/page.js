'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { withdrawalAPI, userAPI } from '../../lib/api';
import Navbar from '../../components/shared/Navbar';
import OTPInput from '../../components/shared/OTPInput';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { RiArrowLeftSLine, RiWallet3Fill, RiMailCheckLine, RiSmartphoneLine, RiCheckboxCircleFill, RiTimeLine, RiClipboardLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function WithdrawPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);

  // Steps: 1=form, 2=email-otp, 3=mobile-otp, 4=done
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [fetchingData, setFetchingData] = useState(true);
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [history, setHistory] = useState([]);
  const [network, setNetwork] = useState('BSC');
  const [form, setForm] = useState({ amount: '', walletAddress: '' });

  useEffect(() => {
    if (!sessionChecked) return;
    if (!isAuthenticated) { router.push('/'); return; }
    Promise.all([userAPI.getDashboard(), withdrawalAPI.getHistory()])
      .then(([dash, hist]) => {
        setWallet(dash.data.data.wallet);
        setHistory(hist.data.data.withdrawals || []);
        setNetwork(dash.data.data.user?.network || 'BSC');
      })
      .catch(() => {})
      .finally(() => setFetchingData(false));
  }, [sessionChecked, isAuthenticated, router]);

  const usdtBalance = wallet?.usdtInternalBalance || 0;

  // Withdrawal timing (disabled for testing)
  const withdrawalOpen = true;

  // Step 1: Submit form → email OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > usdtBalance) { toast.error('Insufficient USDT balance'); return; }
    if (!form.walletAddress || !form.walletAddress.startsWith('0x') || form.walletAddress.length !== 42) {
      toast.error('Enter a valid wallet address (0x...)'); return;
    }
    setLoading(true);
    try {
      const res = await withdrawalAPI.initiate({ amount: amt, walletAddress: form.walletAddress, network });
      setWithdrawalId(res.data.data.withdrawalId);
      toast.success('Email OTP sent!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  // Step 2: Verify email → mobile OTP sent
  const handleEmailOTP = async (otp) => {
    setLoading(true);
    try {
      await withdrawalAPI.verifyEmail({ withdrawalId, otp });
      toast.success('Email verified! Mobile OTP sent.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email verification failed');
      if (err.response?.status === 404) { setStep(1); setWithdrawalId(null); }
    } finally { setLoading(false); }
  };

  // Step 3: Verify mobile → done
  const handleMobileOTP = async (otp) => {
    setLoading(true);
    try {
      await withdrawalAPI.verifyMobile({ withdrawalId, otp });
      toast.success('Withdrawal confirmed!');
      setStep(4);
      const [dash, hist] = await Promise.all([userAPI.getDashboard(), withdrawalAPI.getHistory()]);
      setWallet(dash.data.data.wallet);
      setHistory(hist.data.data.withdrawals || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mobile verification failed');
      if (err.response?.status === 404) { setStep(1); setWithdrawalId(null); }
    } finally { setLoading(false); }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">Withdraw USDT</h1>
        </div>

        {/* Balance Card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#081a12] to-[#0c0c24] p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Withdrawable Balance</p>
              <p className="text-2xl font-extrabold text-white">${usdtBalance.toFixed(4)} <span className="text-sm text-emerald-400">USDT</span></p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/25 to-cyan-600/15 border border-emerald-500/30 flex items-center justify-center">
              <RiWallet3Fill className="w-7 h-7 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* ─── Step 1: Form ─── */}
        {step === 1 && (
          <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-b from-dark-800/80 to-[#0c0c24] p-5 mb-5">
            {/* Network */}
            <div className="mb-5">
              <p className="text-[11px] text-slate-400 font-medium mb-2.5">Select Network</p>
              <div className="flex gap-3">
                <button onClick={() => setNetwork('BSC')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    network === 'BSC'
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-400/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                      : 'bg-dark-700/60 border border-dark-600/80 text-slate-400 hover:border-slate-500'
                  }`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 6.5v11L12 22l8-4.5v-11L12 2zm0 2.3l5.5 3.1v6.2L12 16.7l-5.5-3.1V7.4L12 4.3z"/></svg>
                  BSC (BEP20)
                </button>
                <button onClick={() => setNetwork('Polygon')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    network === 'Polygon'
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-2 border-purple-400/50 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                      : 'bg-dark-700/60 border border-dark-600/80 text-slate-400 hover:border-slate-500'
                  }`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l-8 4.5v11L12 22l8-4.5v-11L12 2zm-1 15.5l-4.5-2.5V9l4.5 2.5v6zm1-7.3L7.5 7.7 12 5.2l4.5 2.5L12 10.2zm5.5 4.8L13 17.5v-6L17.5 9v6z"/></svg>
                  Polygon
                </button>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="mb-5">
              <p className="text-[11px] text-slate-400 font-medium mb-2">Enter Your USDT Address</p>
              <div className="relative">
                <input type="text" value={form.walletAddress}
                  onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                  placeholder="Paste wallet address"
                  className="w-full bg-dark-700/50 border border-dark-600/80 rounded-xl py-3.5 px-4 pr-12 text-white text-sm font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_10px_rgba(139,92,246,0.08)] transition-all" />
                <button onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setForm({ ...form, walletAddress: text });
                    toast.success('Pasted!');
                  } catch (_) { toast.error('Paste failed — allow clipboard access'); }
                }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-purple-400 hover:text-purple-300 transition-colors">
                  <RiClipboardLine className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-5">
              <p className="text-[11px] text-slate-400 font-medium mb-2">Amount (USDT)</p>
              <div className="relative">
                <input type="number" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00" min="0.01" step="0.01" max={usdtBalance}
                  className="w-full bg-dark-700/50 border border-dark-600/80 rounded-xl py-3.5 px-4 pr-20 text-white text-lg font-semibold placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_10px_rgba(139,92,246,0.08)] transition-all" />
                <button onClick={() => setForm({ ...form, amount: String(usdtBalance.toFixed(4)) })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors">
                  MAX
                </button>
              </div>
            </div>

            {/* Note */}
            <div className="rounded-xl bg-gradient-to-r from-purple-900/20 to-cyan-900/10 border border-purple-500/15 px-4 py-3 mb-6">
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <span className="text-purple-400 font-semibold">🔒 Secure Withdrawal</span> — Verified by Email + Mobile OTP. Processed by admin within 24 hours to your wallet.
              </p>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={loading || !withdrawalOpen}
              className={`w-full py-4 rounded-xl font-bold text-base text-white transition-all flex items-center justify-center gap-2 ${
                !withdrawalOpen
                  ? 'bg-dark-700 border border-dark-600 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_25px_rgba(0,180,255,0.2)] hover:shadow-[0_0_35px_rgba(0,180,255,0.3)] disabled:opacity-50'
              }`}>
              {!withdrawalOpen ? (
                <><RiTimeLine className="w-4 h-4" /> Opens at 12:00 PM IST</>
              ) : loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              ) : 'Request Withdrawal'}
            </button>
          </div>
        )}

        {/* ─── Step 2: Email OTP ─── */}
        {step === 2 && (
          <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-5 mb-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center mx-auto mb-3">
                <RiMailCheckLine className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Email Verification</p>
              <p className="text-[11px] text-slate-400">Enter OTP sent to your email</p>
            </div>
            <OTPInput length={6} onComplete={handleEmailOTP} disabled={loading} />
            {loading && <div className="flex justify-center mt-4"><LoadingSpinner /></div>}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <div className="w-2 h-2 rounded-full bg-dark-600" />
              <p className="text-[9px] text-slate-500 ml-2">Step 1 of 2</p>
            </div>
          </div>
        )}

        {/* ─── Step 3: Mobile OTP ─── */}
        {step === 3 && (
          <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-5 mb-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto mb-3">
                <RiSmartphoneLine className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Mobile Verification</p>
              <p className="text-[11px] text-slate-400">Enter OTP sent to your mobile</p>
            </div>
            <OTPInput length={6} onComplete={handleMobileOTP} disabled={loading} />
            {loading && <div className="flex justify-center mt-4"><LoadingSpinner /></div>}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <p className="text-[9px] text-slate-500 ml-2">Step 2 of 2</p>
            </div>
          </div>
        )}

        {/* ─── Step 4: Done ─── */}
        {step === 4 && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 mb-5 text-center">
            <RiCheckboxCircleFill className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Withdrawal Submitted!</h3>
            <p className="text-xs text-slate-400 mb-4">Admin will process your USDT withdrawal soon.</p>
            <button onClick={() => { setStep(1); setForm({ amount: '', walletAddress: '' }); setWithdrawalId(null); }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              New Withdrawal
            </button>
          </div>
        )}

        {/* ─── History ─── */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4">
            <p className="text-xs font-semibold text-white mb-3">Recent Withdrawals</p>
            <div className="space-y-2">
              {history.slice(0, 5).map((w, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-dark-700/40 rounded-xl border border-dark-600/30">
                  <div>
                    <p className="text-sm font-bold text-white">${w.amount}</p>
                    <p className="text-[9px] text-slate-500">{new Date(w.createdAt).toLocaleDateString()} • {w.network}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    w.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10' :
                    w.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                    'text-yellow-400 bg-yellow-500/10'
                  }`}>
                    {w.status === 'approved' ? 'Completed' : w.status === 'rejected' ? 'Rejected' : 'Pending'}
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
