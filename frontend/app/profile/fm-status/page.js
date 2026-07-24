'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import { RiLock2Fill, RiArrowLeftSLine, RiTimerFlashLine, RiPriceTag3Line, RiExchangeDollarLine, RiInformationLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import FMCoinLogo from '../../../components/FMCoinLogo';

export default function FMStatusPage() {
  const router = useRouter();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  useEffect(() => {
    if (sessionChecked && isAuthenticated) {
      userAPI.getDashboard()
        .then((r) => setWallet(r.data.data.wallet))
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [sessionChecked, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" />
          <img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} />
        </div>
      </div>
    );
  }

  const fmBalance = wallet?.fmBalance || 0;
  const accountCreated = new Date(user?.createdAt);
  const unlockDate = new Date(accountCreated.getTime() + 180 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24)));
  const fmLocked = daysRemaining > 0;
  const availableFM = fmLocked ? 0 : fmBalance;
  const lockedFM = fmLocked ? fmBalance : 0;
  const listingPrice = 1.00; // $1 per FM
  const totalValueUSDT = (fmBalance * listingPrice).toFixed(2);

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">FM Status</h1>
        </div>

        {/* ─── Main Balance Card ─── */}
        <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-[#1a1400] to-[#0c0c24] p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-4 mb-5 pb-5 border-b border-dark-700/50">
            <FMCoinLogo size={64} />
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white">{fmBalance}</p>
                <span className="text-sm text-yellow-400 font-semibold">FM</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{fmLocked ? 'Locked' : 'Available'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-0">
            <div className="flex items-center justify-between py-3 border-b border-dark-700/40">
              <span className="text-xs text-slate-400">Total FM</span>
              <span className="text-sm font-bold text-white">{fmBalance} FM</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-dark-700/40">
              <span className="text-xs text-slate-400">Locked FM</span>
              <span className="text-sm font-bold text-yellow-400">{lockedFM} FM</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-slate-400">Available FM</span>
              <span className="text-sm font-bold text-emerald-400">{availableFM} FM</span>
            </div>
          </div>
        </div>

        {/* ─── Lock Period Badge ─── */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-purple-500/10 border border-purple-500/25 mb-5">
          <RiLock2Fill className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-purple-300">Lock Period: 180 Days</span>
        </div>

        {/* ─── Countdown + Unlock ─── */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-dark-600/60 bg-dark-800/50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiTimerFlashLine className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-[10px] text-slate-500">Remaining Days</p>
            </div>
            <p className="text-2xl font-extrabold text-white">{daysRemaining}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Days left</p>
          </div>
          <div className="rounded-xl border border-dark-600/60 bg-dark-800/50 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RiTimerFlashLine className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-[10px] text-slate-500">Unlock Date</p>
            </div>
            <p className="text-lg font-bold text-white">{unlockDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{unlockDate.getFullYear()}</p>
          </div>
        </div>

        {/* ─── Value & Pricing ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4 mb-5">
          <p className="text-xs font-semibold text-white mb-3">FM Details</p>
          <div className="space-y-0">
            <div className="flex items-center justify-between py-2.5 border-b border-dark-700/40">
              <div className="flex items-center gap-2">
                <RiPriceTag3Line className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400">Listing Price</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">$1.00</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-dark-700/40">
              <div className="flex items-center gap-2">
                <RiExchangeDollarLine className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs text-slate-400">Your FM Value (USDT)</span>
              </div>
              <span className="text-sm font-bold text-cyan-400">${totalValueUSDT}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-dark-700/40">
              <div className="flex items-center gap-2">
                <RiInformationLine className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs text-slate-400">Total Supply</span>
              </div>
              <span className="text-sm font-medium text-white">21,000,000 FM</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <RiInformationLine className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400">Listing Status</span>
              </div>
              <span className="text-xs font-semibold text-yellow-400">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* ─── Info Note ─── */}
        <div className="rounded-xl bg-dark-800/40 border border-dark-700/40 p-4">
          <div className="flex items-start gap-2.5">
            <RiInformationLine className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 leading-relaxed">FM is locked for 180 days from the date of earning to ensure long-term stability and user retention.</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">After unlock, FM can be swapped for USDT or used within the FutureMint ecosystem.</p>
              <p className="text-[10px] text-slate-500">Earn more FM daily by watching ads and building your team.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
