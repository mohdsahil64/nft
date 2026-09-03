'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { userAPI } from '../../../lib/api';
import Navbar from '../../../components/shared/Navbar';
import { RiArrowLeftSLine, RiSwapLine, RiCheckboxCircleFill, RiWallet3Fill } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function SwapNFTPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [wallet, setWallet] = useState(null);
  const [nftPrice, setNftPrice] = useState(0.01);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [swapHistory, setSwapHistory] = useState([]);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const [dashRes, histRes] = await Promise.all([
        userAPI.getDashboard(),
        userAPI.getSwapHistory(),
      ]);
      setWallet(dashRes.data.data.wallet);
      setNftPrice(dashRes.data.data.nftPrice || 0.01);
      setSwapHistory(histRes.data.data.swaps || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (sessionChecked && isAuthenticated) fetchData();
  }, [sessionChecked, isAuthenticated]);

  const grossUsdt = amount ? (parseFloat(amount) * nftPrice) : 0;
  const fee = (grossUsdt * 0.05);
  const usdtValue = (grossUsdt - fee).toFixed(4);

  const handleSwap = async () => {
    const qty = parseFloat(amount);
    if (!qty || qty <= 0) { toast.error('Enter a valid amount'); return; }
    if (qty < 200) { toast.error('Minimum 200 NFT required to swap'); return; }
    if (qty > (wallet?.nftBalance || 0)) { toast.error('Insufficient NFT balance'); return; }

    setSwapping(true);
    try {
      const res = await userAPI.swapNFT({ amount: qty });
      toast.success(res.data.message);
      setSuccess(res.data.data);
      setAmount('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Swap failed');
    } finally {
      setSwapping(false);
    }
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
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">Swap NFT</h1>
        </div>

        {/* ─── Balance Card ─── */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0a1628] to-[#0c0c24] p-5 mb-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Swappable Balance</p>
              <p className="text-2xl font-extrabold text-white">{wallet?.nftBalance?.toLocaleString() || '0'} <span className="text-sm text-cyan-400">NFT</span></p>
              <p className="text-xs text-emerald-400 mt-1">≈ ${((wallet?.nftBalance || 0) * nftPrice).toFixed(2)} USD</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/25 to-cyan-600/15 border border-purple-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.15)]">
              <RiWallet3Fill className="w-8 h-8 text-purple-300" />
            </div>
          </div>
          {/* USDT Internal Balance */}
          <div className="mt-4 pt-3 border-t border-dark-700/50 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Your USDT Wallet</span>
            <span className="text-sm font-bold text-emerald-400">${(wallet?.usdtInternalBalance || 0).toFixed(4)}</span>
          </div>
        </div>

        {/* ─── Swap Form ─── */}
        <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-5 mb-5">
          <p className="text-xs font-semibold text-white mb-4">Swap NFT → USDT</p>

            {/* Min swap milestone */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-cyan-500/10 bg-cyan-500/5 mb-4">
              <span className="text-sm">🎯</span>
              <div className="flex-1">
                <p className="text-[11px] text-white font-medium">
                  {(wallet?.nftBalance || 0) < 200
                    ? `${200 - (wallet?.nftBalance || 0)} NFT more to unlock`
                    : 'Swap available!'
                  }
                </p>
                <p className="text-[9px] text-slate-500">Min 200 NFT required</p>
              </div>
              <span className="text-[9px] text-slate-400">{wallet?.nftBalance || 0}/200</span>
            </div>

          {/* Amount Input */}
          <div className="mb-4">
            <label className="text-[10px] text-slate-500 mb-1.5 block">Amount (NFT)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter NFT amount"
                min="1"
                max={wallet?.nftBalance || 0}
                className="w-full bg-dark-700/70 border border-dark-600 rounded-xl py-3.5 px-4 pr-16 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              <button
                onClick={() => setAmount(String(wallet?.nftBalance || 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                MAX
              </button>
            </div>
          </div>

          {/* Live calculation */}
          <div className="bg-dark-700/50 rounded-xl border border-dark-600/50 p-3.5 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400">Gross Amount</span>
              <span className="text-xs text-slate-300">${grossUsdt.toFixed(4)} USDT</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-slate-400">Processing Fee (5%)</span>
              <span className="text-xs text-red-400">-${fee.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-dark-600/50">
              <span className="text-[11px] text-white font-medium">You will receive</span>
              <span className="text-sm font-bold text-emerald-400">${usdtValue} <span className="text-[10px] text-slate-400">USDT</span></span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-500">Rate</span>
              <span className="text-[10px] text-slate-400">1 NFT = ${nftPrice} USDT</span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={swapping || !amount || parseFloat(amount) <= 0}
            className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {swapping ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Swapping...</>
            ) : (
              <><RiSwapLine className="w-5 h-5" /> Swap Now</>
            )}
          </button>

          <p className="text-[9px] text-slate-600 text-center mt-3">Min: 200 NFT • 5% processing fee • Credited instantly</p>
        </div>

        {/* ─── Success Card ─── */}
        {success && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <RiCheckboxCircleFill className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">Swap Successful!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-slate-500">NFT Swapped</p>
                <p className="text-sm font-bold text-white">{success.nftSwapped}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500">USDT Received</p>
                <p className="text-sm font-bold text-emerald-400">${success.usdtReceived}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Price Used</p>
                <p className="text-sm font-bold text-slate-300">${success.priceUsed}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Recent Swaps ─── */}
        {swapHistory.length > 0 && (
          <div className="rounded-2xl border border-dark-600/60 bg-dark-800/50 p-4">
            <p className="text-xs font-semibold text-white mb-3">Recent Swaps</p>
            <div className="space-y-2">
              {swapHistory.slice(0, 5).map((swap, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-dark-700/40 rounded-xl border border-dark-600/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                      <RiSwapLine className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-white">{Math.abs(swap.amount)} NFT → USDT</p>
                      <p className="text-[9px] text-slate-500">{swap.description?.match(/\$[\d.]+/)?.[0] || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-400 font-bold">{swap.description?.match(/→ \$([\d.]+)/)?.[1] ? `+$${swap.description.match(/→ \$([\d.]+)/)[1]}` : ''}</p>
                    <p className="text-[9px] text-slate-600">{new Date(swap.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
