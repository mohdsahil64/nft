'use client';
import { useState, useEffect } from 'react';

// Launch time: 28 June 2026, 12:00 PM IST
// IST is UTC+5:30, so 12:00 PM IST = 06:30 UTC
const LAUNCH_YEAR = 2026;
const LAUNCH_MONTH = 5; // June (0-indexed)
const LAUNCH_DAY = 28;
const LAUNCH_HOUR = 12; // 12 PM
const LAUNCH_MINUTE = 0;

function getLaunchTimestamp() {
  // Create date in IST by calculating UTC equivalent
  // IST = UTC + 5:30, so subtract 5:30 from IST to get UTC
  const utcDate = new Date(Date.UTC(
    LAUNCH_YEAR,
    LAUNCH_MONTH,
    LAUNCH_DAY,
    LAUNCH_HOUR - 5, // subtract 5 hours
    LAUNCH_MINUTE - 30 // subtract 30 minutes
  ));
  return utcDate.getTime();
}

const LAUNCH_TIME = getLaunchTimestamp();

function calcTimeLeft() {
  const now = Date.now();
  const diff = LAUNCH_TIME - now;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export default function LaunchCountdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Only run on client after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const t = calcTimeLeft();
    setTimeLeft(t);

    if (!t) return; // Already past launch time

    const timer = setInterval(() => {
      const updated = calcTimeLeft();
      if (!updated) {
        clearInterval(timer);
        setTimeLeft(null);
      } else {
        setTimeLeft(updated);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render anything until mounted (prevents hydration flash)
  if (!mounted) return null;

  // If launch time has passed, don't show countdown
  if (!timeLeft) return null;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a1033 0%, #0a0a0f 70%)' }}>

      {/* Subtle animated particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-primary-400/40 rounded-full animate-pulse" />
        <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-emerald-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[35%] w-1 h-1 bg-primary-400/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[20%] right-[15%] w-1.5 h-1.5 bg-purple-400/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative text-center px-6 max-w-lg w-full">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/assets/favicon/favicon-96x96.png"
            alt="FutureMint"
            className="w-20 h-20 mx-auto rounded-2xl"
            style={{ boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)' }}
          />
        </div>

        {/* Main text */}
        <p className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-[3px] mb-3">
          Get Ready
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 leading-tight">
          We're Launching Soon
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mb-10 max-w-sm mx-auto leading-relaxed">
          Something exciting is on its way. Stay tuned for the big reveal.
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-10">
          {/* Hours */}
          <div className="text-center">
            <div className="w-[72px] sm:w-[88px] h-[80px] sm:h-[96px] rounded-2xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {pad(timeLeft.hours)}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium">Hours</p>
          </div>

          <span className="text-xl sm:text-2xl text-primary-500/60 font-light mt-[-20px]">:</span>

          {/* Minutes */}
          <div className="text-center">
            <div className="w-[72px] sm:w-[88px] h-[80px] sm:h-[96px] rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {pad(timeLeft.minutes)}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium">Minutes</p>
          </div>

          <span className="text-xl sm:text-2xl text-primary-500/60 font-light mt-[-20px]">:</span>

          {/* Seconds */}
          <div className="text-center">
            <div className="w-[72px] sm:w-[88px] h-[80px] sm:h-[96px] rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                {pad(timeLeft.seconds)}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-2 uppercase tracking-wider font-medium">Seconds</p>
          </div>
        </div>

        {/* Bottom pill */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm text-slate-300 font-medium">FutureMint NFT</span>
        </div>
      </div>
    </div>
  );
}
