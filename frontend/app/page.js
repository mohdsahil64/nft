'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import WalletConnect from '../components/WalletConnect';
import { authAPI, userAPI } from '../lib/api';
import Link from 'next/link';
import {
  ArrowRight, Zap, Users, DollarSign, Shield, Lock, Globe,
  TrendingUp, Award, Star, CheckCircle, Rocket, Layers
} from 'lucide-react';

const features = [
  { icon: Zap, title: '100 NFT Signup Bonus', desc: 'Get 100 NFTs instantly when you verify your account', color: 'from-yellow-500 to-orange-500' },
  { icon: Users, title: '15-Level Referral System', desc: 'Earn NFTs from every member in your downline, up to 15 levels deep', color: 'from-blue-500 to-cyan-500' },
  { icon: DollarSign, title: 'Team Achievement Rewards', desc: 'Hit team milestones and earn massive NFT bonuses automatically', color: 'from-emerald-500 to-green-500' },
  { icon: Shield, title: 'BSC & Polygon Support', desc: 'Withdraw USDT on BNB Smart Chain or Polygon — your choice', color: 'from-purple-500 to-pink-500' },
];

const trustLogos = [
  { name: 'BNB Chain', icon: '⛓️' },
  { name: 'Polygon', icon: '🟣' },
  { name: 'MetaMask', icon: '🦊' },
  { name: 'Trust Wallet', icon: '🛡️' },
  { name: 'WalletConnect', icon: '🔗' },
  { name: 'USDT', icon: '💵' },
];

const milestones = [
  { members: '100', reward: '500 NFT' },
  { members: '500', reward: '3,000 NFT' },
  { members: '1,000', reward: '8,000 NFT' },
  { members: '5,000', reward: '50,000 NFT' },
  { members: '10,000', reward: '1,50,000 NFT' },
];

export default function LandingPage() {
  const router = useRouter();
  const { isConnected, address } = useSelector((s) => s.wallet);
  const { isAuthenticated } = useSelector((s) => s.user);
  const [walletExists, setWalletExists] = useState(null); // null = unknown, true = existing user, false = new user
  const [navigating, setNavigating] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // When wallet is connected (including auto-reconnect), check if it's registered
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      authAPI.checkWallet({ walletAddress: address })
        .then((res) => setWalletExists(res.data.exists))
        .catch(() => setWalletExists(false));
    }
  }, [isConnected, address, isAuthenticated]);

  // After wallet connects — check if wallet already registered
  const handleWalletConnected = async (connectedAddress) => {
    // If valid session exists, go to dashboard directly
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await userAPI.getProfile();
        router.push('/dashboard');
        return;
      } catch (_) {
        localStorage.removeItem('token');
      }
    }

    // No valid session — check if wallet is registered
    try {
      const res = await authAPI.checkWallet({ walletAddress: connectedAddress });
      setWalletExists(res.data.exists);
    } catch (_) {
      setWalletExists(false);
    }
  };

  const handleNavigate = (path) => {
    setNavigating(true);
    router.push(path);
  };

  return (
    <main className="min-h-screen">
      {/* ─── HERO SECTION ─── */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px]" />
        </div>

        {/* Main Hero */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left — Hero Content */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-5">
                The Future of{' '}
                <span className="gradient-text">NFT Earning</span>{' '}
                Starts Here
              </h1>

              <p className="text-base sm:text-lg text-slate-400 mb-8 leading-relaxed max-w-xl">
                Connect your wallet, build your team, and earn real USDT. FutureMint rewards
                you through 15 referral levels and team milestones — no trading required.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 p-4 sm:p-5 bg-dark-800/60 backdrop-blur-sm rounded-2xl border border-dark-700/50">
                {[
                  { label: 'Total Supply', value: '2.1M', icon: Layers },
                  { label: 'Referral Levels', value: '15', icon: Users },
                  { label: 'Signup Bonus', value: '100 NFT', icon: Award },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon className="w-5 h-5 text-primary-400 mx-auto mb-1" />
                    <div className="text-lg sm:text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Wallet Connect Card */}
            <div id="connect" className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-2xl blur-xl" />
              <div className="relative card border-primary-700/30 shadow-2xl shadow-primary-900/20">
                {isConnected ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready To Join FutureMint</h3>
                    <p className="text-slate-400 text-sm mb-6">
                      {walletExists === true
                        ? 'This wallet is already registered. Please login.'
                        : walletExists === false
                        ? 'New wallet detected! Create your account to start earning.'
                        : 'verifying Your Details...'}
                    </p>
                    <div className="flex flex-col gap-3">
                      {walletExists === true ? (
                        <button
                          onClick={() => handleNavigate('/auth/login')}
                          disabled={navigating}
                          className="btn-primary text-center shadow-lg shadow-primary-600/25 w-full"
                        >
                          {navigating ? 'Loading...' : 'Login to Your Account'}
                        </button>
                      ) : walletExists === false ? (
                        <button
                          onClick={() => handleNavigate('/auth/register')}
                          disabled={navigating}
                          className="btn-primary text-center shadow-lg shadow-primary-600/25 w-full"
                        >
                          {navigating ? 'Loading...' : 'Create New Account'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <WalletConnect onConnected={handleWalletConnected} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUST BANNER ─── */}
      <div className="border-y border-dark-700/50 bg-dark-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <p className="text-center text-xs sm:text-sm text-slate-500 mb-4 uppercase tracking-wider font-medium">Trusted & Supported By</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {trustLogos.map(({ name, icon }) => (
              <div key={name} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-dark-700/50 rounded-lg border border-dark-600/50">
                <span className="text-lg sm:text-xl">{icon}</span>
                <span className="text-xs sm:text-sm text-slate-400 font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── WHY FUTUREMINT ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-primary-900/30 border border-primary-700/30 rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-primary-300 font-medium">Why FutureMint?</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">Earn While You Build</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">Four pillars that make FutureMint the smartest NFT earning platform</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="group card hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base mb-2">{title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div className="bg-dark-800/30 border-y border-dark-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Get Started in 3 Steps</h2>
            <p className="text-slate-400 text-sm sm:text-base">Simple, fast, and rewarding</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your MetaMask, Trust Wallet, or any crypto wallet', icon: Globe, color: 'text-blue-400' },
              { step: '02', title: 'Register & Verify', desc: 'Create your account, verify email, and receive 100 free NFTs', icon: CheckCircle, color: 'text-emerald-400' },
              { step: '03', title: 'Earn & Withdraw', desc: 'Refer friends, hit milestones, and withdraw USDT anytime', icon: TrendingUp, color: 'text-purple-400' },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 bg-dark-700 rounded-2xl flex items-center justify-center border border-dark-600 mb-4 mx-auto">
                    <Icon className={`w-7 h-7 ${color}`} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TEAM MILESTONES ─── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-700/30 rounded-full px-4 py-1.5 mb-4">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-medium">Milestone Rewards</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Team Building Pays Big</h2>
          <p className="text-slate-400 text-sm sm:text-base">The bigger your team, the bigger your rewards — automatically</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {milestones.map(({ members, reward }) => (
            <div key={members} className="card text-center hover:border-emerald-500/30 transition-all group">
              <div className="text-2xl sm:text-3xl mb-2">🏆</div>
              <p className="text-lg sm:text-xl font-bold text-white">{members}</p>
              <p className="text-xs text-slate-500 mb-2">Members</p>
              <div className="bg-emerald-900/30 rounded-lg px-2 py-1.5 border border-emerald-700/30">
                <p className="text-xs sm:text-sm font-bold text-emerald-400">{reward}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── NFT PRICE DOUBLING ─── */}
      <div className="bg-dark-800/30 border-y border-dark-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-yellow-900/30 border border-yellow-700/30 rounded-full px-4 py-1.5 mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">Price Goes Up</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Price Doubles Every 50K Mint</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">The earlier you join, the cheaper your NFTs. Price automatically doubles after every 50,000 NFTs are minted.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { range: '0 – 50K', price: '$0.01', multiplier: '1x' },
              { range: '50K – 100K', price: '$0.02', multiplier: '2x' },
              { range: '100K – 150K', price: '$0.04', multiplier: '4x' },
              { range: '150K – 200K', price: '$0.08', multiplier: '8x' },
              { range: '200K – 250K', price: '$0.16', multiplier: '16x' },
              { range: '250K+', price: '$0.32+', multiplier: '32x+' },
            ].map(({ range, price, multiplier }) => (
              <div key={range} className="bg-dark-800 rounded-xl border border-dark-700 p-4 text-center hover:border-yellow-500/30 transition-all">
                <p className="text-xs text-slate-500 mb-1">{range}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{price}</p>
                <p className="text-xs text-yellow-400 font-medium mt-1">{multiplier}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">Total Supply: 2,100,000 NFTs · Current early bird price won't last forever</p>
        </div>
      </div>

      {/* ─── SECURITY / TRUST SECTION ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">Built for Trust & Security</h2>
          <p className="text-slate-400 text-sm sm:text-base">Your funds, your wallet, your control — always</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Lock, title: 'Non-Custodial', desc: 'We never hold your crypto. Withdrawals go directly to your wallet.' },
            { icon: Shield, title: 'Verified Smart Contracts', desc: 'All USDT transactions use audited BEP-20 and Polygon contracts.' },
            { icon: Globe, title: 'Multi-Chain Support', desc: 'Choose BSC or Polygon for your withdrawals — flexibility first.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-5 bg-dark-800 rounded-xl border border-dark-700 hover:border-primary-500/30 transition-all">
              <div className="w-10 h-10 bg-primary-600/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA FOOTER ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/30 to-purple-900/30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-slate-400 mb-8 text-sm sm:text-base max-w-xl mx-auto">
            Join FutureMint NFT today. Connect your wallet, get 100 free NFTs, and start building your earning network.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#connect" className="btn-primary flex items-center gap-2 text-base shadow-xl shadow-primary-600/30">
              <Rocket className="w-5 h-5" />
              Get Started Now
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-6">No hidden fees · No private key access · 100% transparent</p>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-dark-700/50 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">FM</div>
                <span className="font-bold text-white">FutureMint NFT</span>
              </div>
              <p className="text-sm text-slate-400">The next generation NFT reward platform. Earn, grow, and withdraw — all on-chain.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/auth/register" className="block text-sm text-slate-400 hover:text-white transition-colors">Register</Link>
                <Link href="/auth/login" className="block text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Contact & Support</h4>
              <div className="space-y-2">
                <a href="mailto:futuremintnft@gmail.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <span>✉️</span> futuremintnft@gmail.com
                </a>
                <a href="tel:+919351727145" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                  <span>📱</span> +91 9351727145
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-dark-700 mt-8 pt-6 text-center">
            <p className="text-xs text-slate-500">© 2024 FutureMint NFT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
