'use client';
import { useState, useEffect } from 'react';

// ─── LAUNCH DATE: June 22, 2026, 00:00:00 IST (UTC+5:30) ───
const LAUNCH_DATE = new Date('2026-06-22T00:00:00+05:30').getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = LAUNCH_DATE - now;
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeBlock({ value, label }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="flex flex-col items-center">
      {/* Number box */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-purple-600/20 rounded-2xl blur-sm group-hover:blur-md transition-all" />
        <div className="relative w-[72px] h-[88px] sm:w-[90px] sm:h-[108px] md:w-[110px] md:h-[130px] bg-dark-800/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/20">
          {/* Inner glow line */}
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
          <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight tabular-nums">
            {display}
          </span>
        </div>
      </div>
      {/* Label */}
      <span className="mt-3 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

export default function CountdownGate({ children }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const tl = getTimeLeft();
      if (!tl) {
        clearInterval(interval);
      }
      setTimeLeft(tl);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Not mounted yet — show nothing (avoid hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Launch time passed — show the actual website
  if (!timeLeft) {
    return children;
  }

  // Show countdown
  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Radial gradient center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[80px]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Top and bottom fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-dark-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Logo / Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-900/30 border border-indigo-500/20 rounded-full px-5 py-2 mb-8">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-indigo-300 tracking-wide">Coming Soon</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-[1.1]">
          Future<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Mint</span> NFT
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-4 max-w-xl mx-auto leading-relaxed">
          Something Big Is Loading...
        </p>
        <p className="text-sm sm:text-base text-slate-500 mb-12 max-w-md mx-auto">
          The smartest way to earn real USDT through NFTs is almost here. Get ready to connect, build your team, and start earning.
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-12">
          <TimeBlock value={timeLeft.days} label="Days" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          </div>
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          </div>
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          </div>
          <TimeBlock value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Features teaser */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto mb-10">
          {[
            { icon: '100', label: 'Free NFTs' },
            { icon: '15', label: 'Levels Deep' },
            { icon: 'USDT', label: 'Real Earnings' },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-dark-800/50 backdrop-blur-sm border border-white/5 rounded-xl p-3 sm:p-4">
              <div className="text-lg sm:text-xl font-black text-white mb-1">{icon}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <p className="text-xs text-slate-600">
          BSC & Polygon Supported
        </p>
      </div>
    </div>
  );
}
