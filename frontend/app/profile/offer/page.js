'use client';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/shared/Navbar';
import { RiArrowLeftSLine } from 'react-icons/ri';

export default function OfferPage() {
  const router = useRouter();
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);

  useEffect(() => {
    if (sessionChecked && !isAuthenticated) router.push('/');
  }, [sessionChecked, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#070714] pb-24">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <RiArrowLeftSLine className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">September Mega Offer</h1>
        </div>

        {/* ─── Main Banner ─── */}
        <div className="relative rounded-2xl overflow-hidden mb-5 border border-orange-500/30">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#0d0714] to-[#0a0020]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange-600/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-purple-600/15 rounded-full blur-[60px]" />

          <div className="relative z-10 p-6 text-center">
            {/* Fire emoji + title */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl animate-bounce" style={{ animationDuration: '1.5s' }}>🔥</span>
              <h2 className="text-xl font-black text-white tracking-wide">SEPTEMBER</h2>
              <span className="text-2xl animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}>🔥</span>
            </div>
            <div className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mb-4">
              <p className="text-xs font-black text-white tracking-widest uppercase">MEGA OFFER</p>
            </div>
          </div>
        </div>

        {/* ─── Reward 1 ─── */}
        <div className="relative rounded-2xl border border-cyan-500/30 overflow-hidden mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#030f1a] to-[#0c0c24]" />
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-cyan-500/10 rounded-full blur-[50px]" />

          <div className="relative z-10 p-5">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                <span className="text-sm">🎯</span>
              </div>
              <div>
                <p className="text-xs font-black text-cyan-400 uppercase tracking-wider">Reward 1</p>
                <p className="text-[9px] text-slate-500">Complete targets to unlock</p>
              </div>
            </div>

            {/* Targets */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/60 border border-dark-600/40">
                <span className="text-base">👥</span>
                <div>
                  <p className="text-[10px] text-slate-500">Direct Members</p>
                  <p className="text-sm font-bold text-white">50 Direct</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/60 border border-dark-600/40">
                <span className="text-base">🌐</span>
                <div>
                  <p className="text-[10px] text-slate-500">Total Team Size</p>
                  <p className="text-sm font-bold text-white">500 Team Members</p>
                </div>
              </div>
            </div>

            {/* Reward */}
            <div className="rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-3.5">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 text-center">🎁 You Will Receive</p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-lg font-black text-cyan-400">5,000</p>
                  <p className="text-[9px] text-slate-400">NFT Tokens</p>
                </div>
                <div className="w-px h-8 bg-dark-600" />
                <div className="text-center">
                  <p className="text-lg font-black text-yellow-400">5,000</p>
                  <p className="text-[9px] text-slate-400">FM Tokens</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Reward 2 ─── */}
        <div className="relative rounded-2xl border border-purple-500/30 overflow-hidden mb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d0320] to-[#0c0c24]" />
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[50px]" />

          <div className="relative z-10 p-5">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <span className="text-sm">👑</span>
              </div>
              <div>
                <p className="text-xs font-black text-purple-400 uppercase tracking-wider">Reward 2</p>
                <p className="text-[9px] text-slate-500">Complete targets to unlock</p>
              </div>
            </div>

            {/* Targets */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/60 border border-dark-600/40">
                <span className="text-base">👥</span>
                <div>
                  <p className="text-[10px] text-slate-500">Direct Members</p>
                  <p className="text-sm font-bold text-white">100 Direct</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800/60 border border-dark-600/40">
                <span className="text-base">🌐</span>
                <div>
                  <p className="text-[10px] text-slate-500">Total Team Size</p>
                  <p className="text-sm font-bold text-white">1,000 Team Members</p>
                </div>
              </div>
            </div>

            {/* Reward */}
            <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3.5">
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-2 text-center">🎁 You Will Receive</p>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-lg font-black text-purple-400">10,000</p>
                  <p className="text-[9px] text-slate-400">NFT Tokens</p>
                </div>
                <div className="w-px h-8 bg-dark-600" />
                <div className="text-center">
                  <p className="text-lg font-black text-yellow-400">10,000</p>
                  <p className="text-[9px] text-slate-400">FM Tokens</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom CTA ─── */}
        <div className="relative rounded-2xl border border-orange-500/20 overflow-hidden p-5 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-[#120800] to-[#0d0714]" />
          <div className="relative z-10">
            <p className="text-base font-black text-white mb-1">🚀 SEPTEMBER ONLY!</p>
            <p className="text-xs text-orange-400 font-semibold mb-3">Limited Time — Don't Miss Out!</p>
            <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
              <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-300">💎 Build Your Team</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">🔓 Unlock Your Bonus</span>
            </div>
            <p className="text-sm font-black bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              🔥 Make September Your Biggest Month!
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
