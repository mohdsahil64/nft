'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI } from '../lib/api';
import WalletConnect from '../components/WalletConnect';
import HeroNFTVisual from '../components/HeroNFTVisual';
import { RiPlayCircleFill, RiNftFill, RiCoinFill, RiTeamFill, RiShieldCheckFill, RiGlobalLine, RiCustomerService2Fill, RiExchangeFill, RiStore2Fill, RiAwardFill } from 'react-icons/ri';
import { HiSparkles } from 'react-icons/hi2';
import { BsArrowRight } from 'react-icons/bs';
import { X } from 'lucide-react';
import FMCoinLogo, { FMIconSimple } from '../components/FMCoinLogo';

export default function LandingPage() {
  const router = useRouter();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated, sessionChecked } = useSelector((s) => s.user);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (sessionChecked && isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, sessionChecked, router]);

  useEffect(() => {
    if (isConnected && address && sessionChecked && !isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        userAPI.getProfile()
          .then(() => router.push('/dashboard'))
          .catch(() => localStorage.removeItem('token'));
      }
    }
  }, [isConnected, address, isAuthenticated, sessionChecked]);

  const handleWalletConnected = async (connectedAddress) => {
    setShowWalletModal(false);
    setChecking(true);
    const token = localStorage.getItem('token');
    if (token) {
      try { await userAPI.getProfile(); router.push('/dashboard'); return; }
      catch (_) { localStorage.removeItem('token'); }
    }
    try {
      const res = await authAPI.checkWallet({ walletAddress: connectedAddress });
      router.push(res.data.exists ? '/auth/login' : '/auth/register');
    } catch (_) { router.push('/auth/register'); }
  };

  const handleGetStarted = () => {
    if (isConnected && address) handleWalletConnected(address);
    else setShowWalletModal(true);
  };

  if (!sessionChecked || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714]">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
      </div>
    );
  }
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070714] gap-3">
        <div className="relative"><div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" /><img src="/assets/favicon/favicon-96x96.png" alt="" className="w-12 h-12 rounded-2xl relative animate-pulse" style={{animationDuration:"1.5s"}} /></div>
        <p className="text-slate-400 text-xs">Setting up...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070714] overflow-hidden">
      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWalletModal(false)} />
          <div className="relative w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowWalletModal(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-white transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <div className="p-5"><WalletConnect onConnected={handleWalletConnected} /></div>
          </div>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative px-4 pt-10 pb-4">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px]" />
          <div className="absolute top-[5%] left-[12%] w-0.5 h-0.5 bg-white/30 rounded-full" />
          <div className="absolute top-[8%] right-[18%] w-0.5 h-0.5 bg-white/20 rounded-full" />
          <div className="absolute top-[18%] left-[35%] w-0.5 h-0.5 bg-cyan-400/20 rounded-full" />
        </div>

        <div className="relative z-10 max-w-sm mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            <span className="text-purple-400">FutureMint</span>
          </h1>
          <p className="text-slate-500 text-xs tracking-wider mt-1 mb-1">
            WATCH &bull; EARN &bull; MINT &bull; OWN THE FUTURE
          </p>
          <p className="text-[11px] text-slate-400 mb-5">
            Powered by <span className="text-cyan-400 font-medium">FM</span> & FutureMint NFT
          </p>

          {/* NFT + FM Visual */}
          <HeroNFTVisual />
        </div>
      </section>

      {/* ─── ECOSYSTEM (compact) ─── */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-sm font-semibold text-white mb-0.5">NFT + FM</p>
          <p className="text-[10px] text-purple-300/80 tracking-widest uppercase mb-4">
            <HiSparkles className="inline w-2.5 h-2.5" /> ECOSYSTEM <HiSparkles className="inline w-2.5 h-2.5" />
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: RiPlayCircleFill, label: 'Watch', sub: 'Videos', color: 'text-blue-400', useFM: false },
              { icon: RiNftFill, label: 'Earn', sub: 'NFTs', color: 'text-cyan-400', useFM: false },
              { icon: null, label: 'FM', sub: 'Benefits', color: 'text-yellow-400', useFM: true },
              { icon: RiTeamFill, label: 'Community', sub: 'Access', color: 'text-purple-400', useFM: false },
            ].map(({ icon: Icon, label, sub, color, useFM }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-dark-800 border border-dark-600/80 flex items-center justify-center">
                  {useFM ? <FMIconSimple size={22} /> : <Icon className={`w-5 h-5 ${color}`} />}
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium leading-tight">{label}</p>
                <p className="text-[8px] text-slate-500 -mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WELCOME BONUS + GET STARTED ─── */}
      <section className="px-4 py-5">
        <div className="max-w-sm mx-auto">
          {/* Bonus bar */}
          <div className="bg-dark-800/70 border border-dark-600/70 rounded-xl px-4 py-4 mb-4 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">🎁 Welcome Bonus</p>
            <p className="text-xl font-extrabold text-white mb-1">
              <span className="text-cyan-400">100 NFT</span> + <span className="text-yellow-400">100 FM</span>
            </p>
            <p className="text-[11px] text-emerald-400 font-medium">Absolutely FREE on signup!</p>
          </div>

          {/* GET STARTED */}
          <button onClick={handleGetStarted}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_20px_rgba(0,180,255,0.25)] hover:shadow-[0_0_30px_rgba(0,180,255,0.4)] transition-all flex items-center justify-center gap-2">
            GET STARTED <BsArrowRight className="w-4 h-4" />
          </button>
          <p className="text-center text-slate-500 text-[11px] mt-2.5">NO INVESTMENT REQUIRED*</p>
        </div>
      </section>

      {/* ─── WHY JOIN FUTUREMINT ─── */}
      <section className="px-4 py-8">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-yellow-300 font-semibold tracking-wide mb-5 uppercase">Why Join FutureMint?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: RiPlayCircleFill, title: 'Watch Videos', desc: 'Just 15-20 seconds & earn real rewards', color: 'text-blue-400', border: 'hover:border-blue-500/30', useFM: false },
              { icon: RiNftFill, title: 'Earn NFTs', desc: 'Collect FutureMint NFTs & increase your value', color: 'text-cyan-400', border: 'hover:border-cyan-500/30', useFM: false },
              { icon: null, title: 'FM Benefits', desc: 'Use FM for utilities, rewards & access', color: 'text-yellow-400', border: 'hover:border-yellow-500/30', useFM: true },
              { icon: RiTeamFill, title: 'Strong Community', desc: 'Be a part of a global future-building movement', color: 'text-purple-400', border: 'hover:border-purple-500/30', useFM: false },
            ].map(({ icon: Icon, title, desc, color, border, useFM }, i) => (
              <div key={i} className={`flex items-start gap-3 p-3.5 bg-dark-800/50 border border-dark-700/70 rounded-xl transition-all ${border}`}>
                <div className="w-9 h-9 rounded-lg bg-dark-700/80 flex items-center justify-center flex-shrink-0">
                  {useFM ? <FMIconSimple size={20} /> : <Icon className={`w-4.5 h-4.5 ${color}`} />}
                </div>
                <div>
                  <p className="text-white font-semibold text-xs mb-0.5">{title}</p>
                  <p className="text-slate-400 text-[11px] leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FM UTILITIES ─── */}
      <section className="px-4 py-8">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-cyan-300 font-semibold tracking-wide mb-5 uppercase">FM Utilities</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-2">
              {['Staking & Rewards', 'Access to Premium Features', 'Marketplace Transactions', 'Governance & Voting Rights', 'Future Utilities & Partnerships'].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-dark-800/50 border border-dark-700/60 rounded-lg">
                  <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[11px] sm:text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center py-4 sm:py-0">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
                <FMCoinLogo size={120} className="relative drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OUR ECOSYSTEM ─── */}
      <section className="px-4 py-8">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-purple-300 font-semibold tracking-wide mb-5 uppercase">Our Ecosystem</p>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {[
              { icon: RiNftFill, label: 'NFTs', color: 'text-cyan-400', useFM: false },
              { icon: null, label: 'FM', color: 'text-yellow-400', useFM: true },
              { icon: RiExchangeFill, label: 'Swap', color: 'text-emerald-400', useFM: false },
              { icon: RiAwardFill, label: 'Rewards', color: 'text-purple-400', useFM: false },
              { icon: RiStore2Fill, label: 'Market', color: 'text-blue-400', useFM: false },
            ].map(({ icon: Icon, label, color, useFM }, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-dark-800 border border-dark-600/60 flex items-center justify-center">
                  {useFM ? <FMIconSimple size={22} /> : <Icon className={`w-5 h-5 ${color}`} />}
                </div>
                <span className="text-[8px] sm:text-[10px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: RiShieldCheckFill, label: 'Secure', sub: 'Transparent', color: 'text-emerald-400' },
              { icon: RiGlobalLine, label: 'Global', sub: 'Access', color: 'text-blue-400' },
              { icon: RiCustomerService2Fill, label: '24/7', sub: 'Support', color: 'text-purple-400' },
            ].map(({ icon: Icon, label, sub, color }, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-3 bg-dark-800/50 border border-dark-700/60 rounded-lg">
                <Icon className={`w-5 h-5 ${color}`} />
                <p className="text-[10px] text-white font-semibold">{label}</p>
                <p className="text-[8px] text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="px-4 py-6 border-t border-dark-700/40">
        <div className="text-center">
          <p className="text-[10px] text-slate-500">Future is Minted with You &bull; www.futuremint.app</p>
          <p className="text-[9px] text-slate-700 mt-2">&copy; 2024 FutureMint NFT</p>
        </div>
      </footer>
    </main>
  );
}
