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
      const token = sessionStorage.getItem('token');
      if (token) {
        userAPI.getProfile()
          .then(() => router.push('/dashboard'))
          .catch(() => sessionStorage.removeItem('token'));
      }
    }
  }, [isConnected, address, isAuthenticated, sessionChecked]);

  const handleWalletConnected = async (connectedAddress) => {
    setShowWalletModal(false);
    setChecking(true);
    const token = sessionStorage.getItem('token');
    if (token) {
      try { await userAPI.getProfile(); router.push('/dashboard'); return; }
      catch (_) { sessionStorage.removeItem('token'); }
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
    <main className="min-h-screen bg-[#04050f] overflow-hidden relative">
      {/* ─── ANIMATED SPACE BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Deep space gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0520] via-[#04050f] to-[#070320]" />
        {/* Nebula glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-800/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-blue-900/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s' }} />
        {/* Stars */}
        {[
          { top: '5%', left: '8%', size: 'w-1 h-1', opacity: '0.7', dur: '2.5s' },
          { top: '12%', left: '85%', size: 'w-0.5 h-0.5', opacity: '0.5', dur: '3.5s' },
          { top: '18%', left: '25%', size: 'w-0.5 h-0.5', opacity: '0.4', dur: '4s' },
          { top: '25%', left: '70%', size: 'w-1 h-1', opacity: '0.6', dur: '2.8s' },
          { top: '35%', left: '15%', size: 'w-0.5 h-0.5', opacity: '0.5', dur: '3.2s' },
          { top: '8%', left: '55%', size: 'w-0.5 h-0.5', opacity: '0.3', dur: '5s' },
          { top: '45%', left: '90%', size: 'w-0.5 h-0.5', opacity: '0.4', dur: '3.8s' },
          { top: '55%', left: '5%', size: 'w-1 h-1', opacity: '0.5', dur: '2.6s' },
          { top: '65%', left: '78%', size: 'w-0.5 h-0.5', opacity: '0.6', dur: '3s' },
          { top: '75%', left: '40%', size: 'w-0.5 h-0.5', opacity: '0.3', dur: '4.5s' },
          { top: '3%', left: '42%', size: 'w-1.5 h-1.5', opacity: '0.8', dur: '2s' },
          { top: '22%', left: '92%', size: 'w-1 h-1', opacity: '0.5', dur: '3.5s' },
          { top: '40%', left: '50%', size: 'w-0.5 h-0.5', opacity: '0.4', dur: '4.2s' },
          { top: '85%', left: '20%', size: 'w-0.5 h-0.5', opacity: '0.5', dur: '3.7s' },
          { top: '90%', left: '65%', size: 'w-1 h-1', opacity: '0.4', dur: '2.9s' },
        ].map((star, i) => (
          <div key={i} className={`absolute ${star.size} bg-white rounded-full animate-pulse`}
            style={{ top: star.top, left: star.left, opacity: star.opacity, animationDuration: star.dur }} />
        ))}
        {/* Shooting star effect */}
        <div className="absolute top-[15%] left-[60%] w-[80px] h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-[-35deg] animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

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
      <section className="relative px-4 pt-12 pb-6">
        <div className="relative z-10 max-w-sm mx-auto text-center">
          {/* Brand */}
          <h1 className="text-4xl sm:text-5xl font-black italic bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent leading-tight mb-2"
            style={{ textShadow: '0 0 40px rgba(139,92,246,0.3)' }}>
            FutureMint
          </h1>
          <p className="text-slate-400 text-[11px] tracking-[3px] uppercase mb-2">
            WATCH &bull; EARN &bull; MINT &bull; OWN THE FUTURE
          </p>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/5 mb-8">
            <p className="text-[10px] text-slate-300">
              Powered by <span className="text-yellow-400 font-bold">FM</span> & FutureMint NFT Ecosystem
            </p>
          </div>

          {/* NFT + FM Visual */}
          <HeroNFTVisual />
        </div>
      </section>

      {/* ─── ECOSYSTEM (compact) ─── */}
      <section className="relative z-10 px-4 pt-6 pb-4">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-0.5">NFT + FM</p>
          <p className="text-[10px] text-purple-300/80 tracking-widest uppercase mb-5">
            <HiSparkles className="inline w-2.5 h-2.5" /> ECOSYSTEM <HiSparkles className="inline w-2.5 h-2.5" />
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: RiPlayCircleFill, label: 'Watch', sub: 'Videos\nEarn Rewards', color: 'from-blue-500 to-blue-600', useFM: false },
              { icon: RiNftFill, label: 'Earn', sub: 'FutureMint\nNFTs', color: 'from-cyan-500 to-cyan-600', useFM: false },
              { icon: null, label: 'FM', sub: 'Unlock FM\nBenefits', color: 'from-yellow-500 to-orange-500', useFM: true },
              { icon: RiTeamFill, label: 'Community', sub: 'Global\nAccess', color: 'from-purple-500 to-purple-600', useFM: false },
            ].map(({ icon: Icon, label, sub, color, useFM }, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  {useFM ? <FMIconSimple size={26} /> : <Icon className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-white font-semibold leading-tight">{label}</p>
                  <p className="text-[7px] sm:text-[8px] text-slate-400 leading-tight whitespace-pre-line mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WELCOME BONUS + GET STARTED ─── */}
      <section className="relative z-10 px-4 py-5">
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
            className="w-full py-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_30px_rgba(0,180,255,0.3)] hover:shadow-[0_0_40px_rgba(0,180,255,0.5)] transition-all flex items-center justify-center gap-2">
            GET STARTED <BsArrowRight className="w-5 h-5" />
          </button>
          <p className="text-center text-slate-500 text-[11px] mt-2.5">NO INVESTMENT REQUIRED*</p>
        </div>
      </section>

      {/* ─── WHY JOIN FUTUREMINT ─── */}
      <section className="relative z-10 px-4 py-8">
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
      <section className="relative z-10 px-4 py-8">
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

      {/* ─── ABOUT FUTUREMINT ─── */}
      <section className="relative z-10 px-4 py-10" id="about">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-cyan-300 font-semibold tracking-wide mb-2 uppercase">About the Project</p>
          <p className="text-center text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-lg mx-auto mb-6">
            FutureMint NFT is a modern Web3 ecosystem created for students, professionals, creators, and digital enthusiasts who want to understand and participate in the next phase of the internet.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: RiNftFill, title: 'Learning-First', desc: 'Making Web3, blockchain, and future technology easier to understand through simple and accessible digital learning.', color: 'from-cyan-500 to-blue-600' },
              { icon: RiTeamFill, title: 'Community-Driven', desc: 'Connecting like-minded people who want to learn, collaborate, share ideas, and grow in a future-focused environment.', color: 'from-purple-500 to-indigo-600' },
              { icon: RiShieldCheckFill, title: 'Innovation & Trust', desc: 'Focusing on credibility, transparency, and meaningful digital experiences for long-term knowledge and responsible exploration.', color: 'from-emerald-500 to-teal-600' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-xs mb-1.5">{title}</p>
                <p className="text-slate-400 text-[10px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISION & MISSION ─── */}
      <section className="relative z-10 px-4 py-10" id="vision">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-purple-300 font-semibold tracking-wide mb-6 uppercase">Vision & Mission</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vision */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-900/20 to-dark-800/60 border border-purple-500/20">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <p className="text-white font-semibold text-sm mb-2">Our Vision</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">To become one of the most recognized Web3 ecosystems where people discover digital opportunities, learn continuously, connect globally, and build future-ready skills.</p>
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/15">
                <p className="text-purple-300 text-[10px] italic leading-relaxed">"A trusted gateway to the future of digital innovation, built on knowledge, creativity, and connection."</p>
              </div>
            </div>
            {/* Mission */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-900/20 to-dark-800/60 border border-cyan-500/20">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-white font-semibold text-sm mb-3">Our Mission</p>
              <div className="space-y-2.5">
                {[
                  { step: '01', title: 'Educate', desc: 'Help users understand Web3, blockchain, NFTs, AI through simple learning experiences.' },
                  { step: '02', title: 'Connect', desc: 'Build a trusted digital community for collaboration and idea exchange.' },
                  { step: '03', title: 'Transform', desc: 'Support people in becoming future-ready with meaningful digital experiences.' },
                ].map(({ step, title, desc }, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="text-[9px] text-cyan-400 font-bold mt-0.5">{step}</span>
                    <div>
                      <p className="text-white font-medium text-[11px]">{title}</p>
                      <p className="text-slate-400 text-[10px] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FUTURE & CAREER ─── */}
      <section className="relative z-10 px-4 py-10" id="future">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-emerald-300 font-semibold tracking-wide mb-2 uppercase">Future & Career</p>
          <p className="text-center text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-lg mx-auto mb-6">
            Technology is changing how people work, create and collaborate. FutureMint helps members build awareness, confidence and a future-ready mindset for the digital economy.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: '01', title: 'Digital Foundations', desc: 'Understand Web3, AI, digital ownership and emerging technology with clarity.', icon: RiGlobalLine, color: 'text-cyan-400' },
              { num: '02', title: 'Creator Capability', desc: 'Explore new tools, creative thinking and practical ways to shape digital experiences.', icon: RiAwardFill, color: 'text-purple-400' },
              { num: '03', title: 'Global Perspective', desc: 'Meet future-focused people, exchange ideas and grow through community collaboration.', icon: RiTeamFill, color: 'text-emerald-400' },
            ].map(({ num, title, desc, icon: Icon, color }, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] text-emerald-400/70 font-bold tracking-wider">{num}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className="text-white font-semibold text-xs mb-1.5">{title}</p>
                <p className="text-slate-400 text-[10px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FUTURE VISION 2030 ─── */}
      <section className="relative z-10 px-4 py-10">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-yellow-300 font-semibold tracking-wide mb-2 uppercase">Future Vision 2030</p>
          <p className="text-center text-slate-400 text-[11px] sm:text-xs leading-relaxed max-w-lg mx-auto mb-6">
            We are working toward a long-term, inclusive digital ecosystem that helps people develop confidence, capability and meaningful global connections.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: RiStore2Fill, title: 'Future Skills Platform', desc: 'A learning destination for future careers, digital tools, blockchain, AI, and online innovation.', color: 'from-blue-500 to-indigo-600' },
              { icon: RiExchangeFill, title: 'Digital Experience Hub', desc: 'Immersive digital products, creator participation, interactive communities, and next-gen online experiences.', color: 'from-purple-500 to-pink-600' },
              { icon: RiGlobalLine, title: 'Global Technology Brand', desc: 'A recognizable brand associated with innovation, learning, digital transformation, and community trust.', color: 'from-emerald-500 to-cyan-600' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white font-semibold text-xs mb-1.5">{title}</p>
                <p className="text-slate-400 text-[10px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE FUTUREMINT ─── */}
      <section className="relative z-10 px-4 py-8">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <p className="text-center text-xs text-blue-300 font-semibold tracking-wide mb-5 uppercase">Why Choose FutureMint?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              'Inclusive, beginner-friendly learning',
              'Community-driven collaboration',
              'Web3 & digital-technology discovery',
              'Creator-focused digital experiences',
              'Transparent, responsible approach',
              'A global future-thinking network',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-dark-800/40 border border-dark-700/40">
                <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-[10px] text-slate-300 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMUNITY STANDARDS ─── */}
      <section className="relative z-10 px-4 py-8">
        <div className="max-w-sm sm:max-w-lg mx-auto">
          <p className="text-center text-xs text-slate-400 font-semibold tracking-wide mb-4 uppercase">Community Standards</p>
          <div className="space-y-2">
            {[
              'Respectful participation supports a healthier ecosystem.',
              'Information is shared for education, not financial advice.',
              'Members should verify information and make independent decisions.',
              'Personal data and community safety matter.',
              'Technology should be explored responsibly and transparently.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-dark-800/30 border border-dark-700/30">
                <span className="text-[9px] text-slate-500 font-bold mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[10px] text-slate-400 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOSING ─── */}
      <section className="relative z-10 px-4 py-12">
        <div className="max-w-sm mx-auto text-center">
          <p className="text-lg sm:text-xl font-bold text-white mb-2">"Explore, Learn & Shape the Future"</p>
          <p className="text-cyan-400 text-xs">Your curiosity. Your creativity. Your digital future.</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 px-4 py-6 border-t border-dark-700/40">
        <div className="text-center">
          <p className="text-[10px] text-slate-500">Future is Minted with You &bull; www.futuremint.app</p>
          <p className="text-[9px] text-slate-600 mt-1">Premium Web3 Ecosystem for Learning, Creativity & Digital Growth</p>
          <p className="text-[9px] text-slate-700 mt-2">&copy; 2024-2026 FutureMint NFT. All rights reserved.</p>
          <p className="text-[8px] text-slate-700 mt-1">*Terms & Conditions Apply</p>
        </div>
      </footer>
    </main>
  );
}
