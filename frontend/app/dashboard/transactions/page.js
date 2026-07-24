'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import { RiWallet3Fill, RiTimeLine, RiCalendarLine, RiCalendar2Line, RiHistoryLine, RiInfinityFill, RiGiftFill, RiVideoFill, RiTeamFill, RiTrophyFill, RiArrowLeftSLine, RiArrowRightSLine, RiSparklingFill, RiLock2Fill } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { FMIconSimple } from '../../../components/FMCoinLogo';

const FILTERS = [
  { key: 'today', label: 'Today', icon: RiTimeLine, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { key: 'yesterday', label: 'Yesterday', icon: RiCalendarLine, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { key: 'week', label: 'This Week', icon: RiCalendar2Line, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { key: 'month', label: 'This Month', icon: RiHistoryLine, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  { key: 'lifetime', label: 'Lifetime', icon: RiInfinityFill, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
];

export default function IncomeHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [transactions, setTransactions] = useState([]);
  const [totalNFT, setTotalNFT] = useState(0);
  const [totalFM, setTotalFM] = useState(0);
  const [filter, setFilter] = useState('lifetime');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setFilterLoading(true);
    try {
      const [txRes, dashRes] = await Promise.all([
        userAPI.getTransactions({ page, limit: 10, filter }),
        userAPI.getDashboard(),
      ]);
      setTransactions(txRes.data.data.transactions || []);
      setTotalPages(txRes.data.data.pagination?.pages || 1);
      setTotalNFT(dashRes.data.data.wallet?.nftBalance || 0);
      setTotalFM(dashRes.data.data.wallet?.fmBalance || 0);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    if (sessionChecked && isAuthenticated) fetchData(page > 1 || filter !== 'lifetime');
  }, [sessionChecked, isAuthenticated, page, filter]);

  const getTypeConfig = (type) => {
    switch (type) {
      case 'signup': return { icon: RiGiftFill, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Signup Bonus', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.15)]' };
      case 'referral': return { icon: RiTeamFill, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Referral Commission', glow: 'shadow-[0_0_8px_rgba(139,92,246,0.15)]' };
      case 'team': return { icon: RiTrophyFill, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'Team Milestone', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.15)]' };
      case 'admin_credit': return { icon: RiGiftFill, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Admin Credit', glow: 'shadow-[0_0_8px_rgba(0,200,255,0.15)]' };
      case 'watch': return { icon: RiVideoFill, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Watch & Earn', glow: 'shadow-[0_0_8px_rgba(59,130,246,0.15)]' };
      default: return { icon: RiVideoFill, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Earning', glow: '' };
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60));
    if (diff < 1) return 'Just now';
    if (diff < 24) return `${diff}h ago`;
    if (diff < 48) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
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
        <div className="flex items-center gap-2 mb-5">
          <img src="/assets/favicon/favicon-96x96.png" alt="FM" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="text-base font-bold text-white">Income History</h1>
            <p className="text-[10px] text-slate-500">Track all your earnings</p>
          </div>
        </div>

        {/* ─── Total Earnings Card ─── */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#12082a] via-[#0c0c24] to-[#0a1628] p-5 mb-5 relative overflow-hidden">
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-600/5 rounded-full blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <RiSparklingFill className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-[10px] text-purple-300/80 uppercase tracking-widest font-medium">Total Earnings</p>
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <img src="/assets/nftimg.avif" alt="NFT" className="w-6 h-6 rounded-lg" />
                <p className="text-2xl font-extrabold text-white">{totalNFT.toLocaleString()}</p>
                <span className="text-xs text-cyan-400 font-semibold">NFT</span>
                <span className="text-[10px] text-emerald-400 ml-1">≈ ${(totalNFT * 0.01).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FMIconSimple size={24} />
                <p className="text-xl font-bold text-white">{totalFM.toLocaleString()}</p>
                <span className="text-xs text-emerald-400 font-semibold">FM</span>
                <div className="flex items-center gap-1 ml-1">
                  <RiLock2Fill className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-yellow-400 font-medium">162d</span>
                </div>
              </div>
            </div>
            {/* Wallet icon */}
            <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-purple-600/25 to-cyan-600/15 border border-purple-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.15)]">
              <RiWallet3Fill className="w-9 h-9 text-purple-300" />
            </div>
          </div>
        </div>

        {/* ─── Time Filters ─── */}
        <div className="rounded-2xl border border-dark-600/50 bg-dark-800/30 p-3 mb-5">
          <div className="space-y-1">
            {FILTERS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPage(1); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                  filter === key
                    ? 'bg-purple-500/15 border border-purple-500/30'
                    : 'hover:bg-dark-700/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    filter === key ? 'bg-purple-500/20' : 'bg-dark-700/80'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${filter === key ? color : 'text-slate-500'}`} />
                  </div>
                  <span className={`text-xs font-medium ${filter === key ? 'text-white' : 'text-slate-400'}`}>{label}</span>
                </div>
                <RiArrowRightSLine className={`w-4 h-4 ${filter === key ? 'text-purple-400' : 'text-slate-600'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* ─── Earnings History ─── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-white">Transaction History</p>
            {filterLoading && <div className="w-3.5 h-3.5 border border-purple-400 border-t-transparent rounded-full animate-spin" />}
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dark-600/40 bg-dark-800/30 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-dark-700/50 flex items-center justify-center mx-auto mb-3">
                <RiHistoryLine className="w-7 h-7 text-slate-700" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No earnings yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Start watching ads to earn NFTs & FM</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {transactions.map((tx, i) => {
                const { icon: TxIcon, color, bg, border, label, glow } = getTypeConfig(tx.type);
                return (
                  <div key={i} className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border ${border} bg-dark-800/40 ${glow} transition-all hover:bg-dark-800/60`}>
                    <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                      <TxIcon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white">{label}</p>
                      <p className="text-[9px] text-slate-500 truncate mt-0.5">{tx.description || label}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {tx.fmAmount > 0 ? (
                        <p className="text-xs font-bold text-yellow-400">+{tx.fmAmount} FM</p>
                      ) : (
                        <p className={`text-xs font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} NFT
                        </p>
                      )}
                      <p className="text-[9px] text-slate-600 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 px-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-600/50 text-xs text-slate-400 hover:text-white hover:border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <RiArrowLeftSLine className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button key={i} onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                        page === pageNum
                          ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}>
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-slate-600 text-xs">...</span>}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-600/50 text-xs text-slate-400 hover:text-white hover:border-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next <RiArrowRightSLine className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
