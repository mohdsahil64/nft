'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userAPI, nftAPI } from '../../lib/api';
import { setNFTWallet, updateUser } from '../../store/slices/userSlice';
import { setNFTStats } from '../../store/slices/nftSlice';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AdOverlay from '../../components/shared/AdOverlay';
import { RiNftFill, RiCoinFill } from 'react-icons/ri';
import { RefreshCw, TrendingUp, Lock, Coins, BarChart3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import FMCoinLogo, { FMIconSimple } from '../../components/FMCoinLogo';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, sessionChecked } = useSelector((s) => s.user);
  const nftStats = useSelector((s) => s.nft);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showClaimPopup, setShowClaimPopup] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimAdStep, setClaimAdStep] = useState(false);
  const [showFMStatus, setShowFMStatus] = useState(false);
  const [watchStatus, setWatchStatus] = useState(null);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, statsRes] = await Promise.all([
        userAPI.getDashboard(),
        nftAPI.getStats(),
      ]);
      setData(dashRes.data.data);
      dispatch(setNFTWallet(dashRes.data.data.wallet));
      dispatch(updateUser(dashRes.data.data.user));
      dispatch(setNFTStats(statsRes.data.data));
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sessionChecked && isAuthenticated) fetchDashboard();
  }, [sessionChecked, isAuthenticated]);

  // Fetch watch status for streak display
  useEffect(() => {
    if (sessionChecked && isAuthenticated) {
      userAPI.getWatchStatus().then((res) => setWatchStatus(res.data.data)).catch(() => {});
    }
  }, [sessionChecked, isAuthenticated]);

  useEffect(() => {
    if (data?.user?.signupBonusClaimed === false) setShowClaimPopup(true);
  }, [data]);

  const handleClaimBonus = () => {
    setClaimAdStep(true);
    setShowClaimPopup(false);
  };

  const handleClaimAdComplete = async () => {
    if (claiming) return; // Prevent double-fire
    setClaimAdStep(false);
    setClaiming(true);
    try {
      const res = await userAPI.claimBonus();
      toast.success(res.data.message);
      setShowClaimPopup(false);
      fetchDashboard(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim bonus.');
      setShowClaimPopup(false); // Hide popup on error too (already claimed)
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const wallet = data?.wallet || {};
  const displayUser = data?.user || user || {};

  // FM lock: 180 days starting from 25 July 2025 for ALL users
  const lockStartDate = new Date('2025-07-25T00:00:00');
  const unlockDate = new Date(lockStartDate.getTime() + 180 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24)));
  const fmLocked = daysRemaining > 0;

  return (
    <div className="min-h-screen bg-[#070714] pb-20">
      <Navbar />

      {/* Ad Overlay */}
      {claimAdStep && (
        <AdOverlay onComplete={handleClaimAdComplete} loading={claiming}
          buttonText="Claim Bonus" loadingText="Claiming..." />
      )}

      {/* Claim Popup */}
      {showClaimPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl border border-purple-500/30 bg-[#0c0c24] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl" />
            <div className="relative p-6 text-center">
              <div className="text-4xl mb-3">🎁</div>
              <h2 className="text-xl font-bold text-white mb-1">Welcome to FutureMint!</h2>
              <p className="text-slate-400 text-sm mb-5">
                Hi <span className="text-purple-400 font-medium">{displayUser.name?.split(' ')[0]}</span>, claim your signup bonus
              </p>
              <div className="bg-dark-800/80 rounded-xl border border-dark-600 p-4 mb-5">
                <div className="flex items-center justify-center gap-5">
                  <div className="flex flex-col items-center gap-1.5">
                    <img src="/assets/nftimg.avif" alt="NFT" className="w-12 h-12 rounded-xl object-cover shadow-[0_0_12px_rgba(0,200,255,0.2)]" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">100</p>
                      <p className="text-[10px] text-cyan-400 font-medium">NFT</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-2xl font-light">+</span>
                  <div className="flex flex-col items-center gap-1.5">
                    <FMCoinLogo size={48} />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">100</p>
                      <p className="text-[10px] text-yellow-400 font-medium">FM</p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={handleClaimBonus} disabled={claiming}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 shadow-[0_0_20px_rgba(0,180,255,0.25)] disabled:opacity-60">
                {claiming ? 'Claiming...' : 'Claim My Bonus'}
              </button>
              <p className="text-[10px] text-slate-600 mt-3">Watch a short video to claim</p>
            </div>
          </div>
        </div>
      )}

      {/* FM Status Modal */}
      {showFMStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowFMStatus(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-yellow-500/30 bg-[#0c0c24] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
            <div className="relative p-6">
              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3">
                  <FMCoinLogo size={64} />
                </div>
                <h2 className="text-lg font-bold text-white">FM Status</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Total FM</span>
                  <span className="text-sm font-bold text-white">{wallet.fmBalance || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Available</span>
                  <span className="text-sm font-bold text-emerald-400">{fmLocked ? '0' : wallet.fmBalance || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Locked</span>
                  <span className="text-sm font-bold text-yellow-400">{fmLocked ? wallet.fmBalance || 0 : '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Lock Period</span>
                  <span className="text-sm font-medium text-white">180 Days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Days Remaining</span>
                  <span className="text-sm font-bold text-purple-400">{daysRemaining} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-dark-800/70 rounded-xl border border-dark-600">
                  <span className="text-xs text-slate-400">Unlock Date</span>
                  <span className="text-xs font-medium text-white">{unlockDate.toLocaleDateString()}</span>
                </div>
              </div>

              {fmLocked && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl text-center">
                  <Lock className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                  <p className="text-[11px] text-yellow-300">FM is locked for stability. No withdrawal until unlock date.</p>
                </div>
              )}

              <button onClick={() => setShowFMStatus(false)}
                className="w-full mt-4 py-3 rounded-xl text-sm font-medium text-slate-400 bg-dark-800 border border-dark-600 hover:text-white transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 pt-4 sm:pt-6">

        {/* Logo + Brand (scrolls with page) */}
        <div className="flex items-center gap-2 mb-4">
          <img src="/assets/favicon/favicon-96x96.png" alt="FM" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-white text-base">FutureMint NFT</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Welcome back, {displayUser.name?.split(' ')[0]} 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full">{displayUser.network}</span>
              <span className="text-[11px] text-slate-300 font-mono">{displayUser.mobile?.startsWith('+') ? displayUser.mobile : `+91${displayUser.mobile}`}</span>
            </div>
          </div>
          <button onClick={() => fetchDashboard(true)} disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ─── Balance Cards ─── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* NFT Balance */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0a1628] to-[#0c0c24] p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`font-extrabold text-white leading-tight ${
                  (wallet.nftBalance?.toLocaleString() || '0').length > 9 ? 'text-base' :
                  (wallet.nftBalance?.toLocaleString() || '0').length > 6 ? 'text-lg' : 'text-2xl'
                }`}>{wallet.nftBalance?.toLocaleString() || '0'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Total NFT</p>
                <p className="text-[10px] text-emerald-400 mt-1">≈ ${wallet.usdValue || '0.00'}</p>
              </div>
              <img src="/assets/nftimg.avif" alt="NFT" className="w-12 h-12 rounded-xl object-cover shadow-[0_0_15px_rgba(0,200,255,0.1)] flex-shrink-0" />
            </div>
          </div>

          {/* FM Balance */}
          <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-[#1a1400] to-[#0c0c24] p-4 cursor-pointer"
            onClick={() => setShowFMStatus(true)}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`font-extrabold text-white leading-tight ${
                  (wallet.fmBalance?.toLocaleString() || '0').length > 9 ? 'text-base' :
                  (wallet.fmBalance?.toLocaleString() || '0').length > 6 ? 'text-lg' : 'text-2xl'
                }`}>{wallet.fmBalance?.toLocaleString() || '0'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Total FM</p>
                {fmLocked && (
                  <div className="flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 text-purple-400" />
                    <p className="text-[11px] font-semibold text-yellow-400">{daysRemaining}d</p>
                  </div>
                )}
              </div>
              <FMCoinLogo size={48} className="flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* ─── Today's Earnings (thin full width) ─── */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/15 bg-dark-800/40 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[11px] text-slate-300 font-medium">Today's Earnings</p>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-cyan-400">+{data?.todayNFT || 0} NFT</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-bold text-yellow-400">+{data?.todayFM || 0} FM</span>
          </div>
        </div>

        {/* ─── Price Tickers (market feel) ─── */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600/40">
            <div className="flex items-center gap-3">
              <img src="/assets/nftimg.avif" alt="NFT" className="w-8 h-8 rounded-lg" />
              <div>
                <p className="text-xs font-semibold text-white">NFT Price Today</p>
                <p className="text-[9px] text-slate-500">NFT/USDT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">${nftStats.currentPrice || data?.nftPrice || '0.01'}</p>
              <div className="flex items-center gap-1 justify-end">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <span className="text-[9px] text-emerald-400 font-medium">+0.00%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-600/40">
            <div className="flex items-center gap-3">
              <FMCoinLogo size={32} />
              <div>
                <p className="text-xs font-semibold text-white">FM Price Today</p>
                <p className="text-[9px] text-slate-500">FM/USDT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">$1.00</p>
              <div className="flex items-center gap-1 justify-end">
                <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                <span className="text-[9px] text-emerald-400 font-medium">Stable</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── NFT Market Info ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/40 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-semibold text-white">NFT Market</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Price</p>
                <p className="text-sm font-bold text-emerald-400">${nftStats.currentPrice || data?.nftPrice || '0.01'}</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Minted</p>
                <p className="text-sm font-bold text-white">{nftStats.totalMinted?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Supply</p>
                <p className="text-sm font-bold text-white">2.1M</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <RiNftFill className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Remaining</p>
                <p className="text-sm font-bold text-cyan-400">{nftStats.remaining?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
              <span>Minting Progress</span>
              <span>{nftStats.totalSupply ? ((nftStats.totalMinted / nftStats.totalSupply) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                style={{ width: `${nftStats.totalSupply ? Math.min((nftStats.totalMinted / nftStats.totalSupply) * 100, 100) : 0}%` }} />
            </div>
          </div>
        </div>

        {/* ─── FM Market Info ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/40 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-yellow-400" />
            <p className="text-xs font-semibold text-white">FM Market</p>
            <span className="text-[9px] text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full ml-auto">Coming Soon</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                <Coins className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Supply</p>
                <p className="text-sm font-bold text-white">21M</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Minted</p>
                <p className="text-sm font-bold text-white">{(data?.fmMinted || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Listing Price</p>
                <p className="text-sm font-bold text-emerald-400">$1.00</p>
              </div>
            </div>
            <div className="bg-dark-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Lock Timer</p>
                <p className="text-sm font-bold text-purple-400">{fmLocked ? `${daysRemaining}d left` : 'Unlocked'}</p>
              </div>
            </div>
          </div>
          {/* FM Minting Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-[9px] text-slate-500 mb-1">
              <span>FM Minting Progress</span>
              <span>{((data?.fmMinted || 0) / 21000000 * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${(data?.fmMinted || 0) / 21000000 * 100}%` }} />
            </div>
          </div>
          {/* Lock countdown bar */}
          {fmLocked && (
            <div className="mt-3">
              <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                <span>Lock Countdown</span>
                <span>{180 - daysRemaining}/180 days passed</span>
              </div>
              <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  style={{ width: `${((180 - daysRemaining) / 180) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ─── Announcement Banner ─── */}
        {data?.announcement && (
          <div className={`rounded-xl px-4 py-3 mb-4 border ${
            data.announcement.type === 'success' ? 'bg-emerald-500/8 border-emerald-500/20' :
            data.announcement.type === 'warning' ? 'bg-yellow-500/8 border-yellow-500/20' :
            'bg-cyan-500/8 border-cyan-500/20'
          }`}>
            <p className={`text-[11px] leading-relaxed ${
              data.announcement.type === 'success' ? 'text-emerald-300' :
              data.announcement.type === 'warning' ? 'text-yellow-300' :
              'text-cyan-300'
            }`}>
              📢 {data.announcement.message}
            </p>
          </div>
        )}

        {/* ─── Daily Missions ─── */}
        <div className="rounded-2xl border border-purple-500/15 bg-gradient-to-b from-[#12081e] to-dark-800/50 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">Daily Missions</p>
            <span className="text-[9px] text-slate-500">{
              [watchStatus?.watchedToday].filter(Boolean).length
            }/3 done</span>
          </div>

          <div className="space-y-2.5">
            {/* Mission 1: Watch Ad */}
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              watchStatus?.watchedToday
                ? 'bg-emerald-500/8 border-emerald-500/20'
                : 'bg-dark-700/40 border-dark-600/50'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                watchStatus?.watchedToday ? 'bg-emerald-500/20' : 'bg-purple-500/15'
              }`}>
                {watchStatus?.watchedToday
                  ? <Check className="w-4 h-4 text-emerald-400" />
                  : <span className="text-sm">▶️</span>
                }
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-white">Watch Daily Video</p>
                <p className="text-[9px] text-slate-500">Earn 5 NFT + 1 FM</p>
              </div>
              {!watchStatus?.watchedToday && (
                <Link href="/tasks" className="text-[9px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                  GO
                </Link>
              )}
            </div>

            {/* Mission 2: Share Link */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-dark-700/40 border-dark-600/50">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <span className="text-sm">🔗</span>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-white">Share Referral Link</p>
                <p className="text-[9px] text-slate-500">Invite friends & earn commission</p>
              </div>
              <Link href="/dashboard/referrals" className="text-[9px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                GO
              </Link>
            </div>

            {/* Mission 3: Streak */}
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
              (watchStatus?.streakDays || 0) >= 7
                ? 'bg-emerald-500/8 border-emerald-500/20'
                : 'bg-dark-700/40 border-dark-600/50'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (watchStatus?.streakDays || 0) >= 7 ? 'bg-emerald-500/20' : 'bg-orange-500/15'
              }`}>
                {(watchStatus?.streakDays || 0) >= 7
                  ? <Check className="w-4 h-4 text-emerald-400" />
                  : <span className="text-sm">🔥</span>
                }
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-medium text-white">7-Day Streak</p>
                <p className="text-[9px] text-slate-500">{watchStatus?.streakDays || 0}/7 days • Bonus: 10 NFT + 5 FM</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Referral Quick Stats ─── */}
        <div className="rounded-2xl border border-dark-600/50 bg-dark-800/40 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">Your Referrals</p>
            <Link href="/dashboard/referrals" className="text-[9px] text-cyan-400 font-medium">View All →</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-dark-700/50 rounded-xl">
              <p className="text-lg font-bold text-white">{data?.teamSize || 0}</p>
              <p className="text-[8px] text-slate-500">Team Size</p>
            </div>
            <div className="text-center p-2 bg-dark-700/50 rounded-xl">
              <p className="text-lg font-bold text-purple-400">{wallet.referralEarnings || 0}</p>
              <p className="text-[8px] text-slate-500">NFT Earned</p>
            </div>
            <div className="text-center p-2 bg-dark-700/50 rounded-xl">
              <p className="text-lg font-bold text-yellow-400">{wallet.fmReferralEarnings || 0}</p>
              <p className="text-[8px] text-slate-500">FM Earned</p>
            </div>
          </div>
        </div>

        {/* ─── Navigation Cards ─── */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/referrals"
            className="rounded-xl bg-dark-800/60 border border-dark-700/60 p-4 text-center hover:border-purple-500/30 transition-all">
            <span className="text-xl mb-1 block">👥</span>
            <p className="text-xs font-medium text-white">Referrals</p>
            <p className="text-[9px] text-slate-500 mt-0.5">Team: {data?.teamSize || 0}</p>
          </Link>
          <Link href="/dashboard/transactions"
            className="rounded-xl bg-dark-800/60 border border-dark-700/60 p-4 text-center hover:border-cyan-500/30 transition-all">
            <span className="text-xl mb-1 block">📊</span>
            <p className="text-xs font-medium text-white">Transactions</p>
            <p className="text-[9px] text-slate-500 mt-0.5">History</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
