'use client';
import { useState, useEffect } from 'react';

// Launch time: 28 June 2026, 12:00 PM IST (IST = UTC+5:30)
const LAUNCH_TIME = new Date('2026-06-28T06:30:00.000Z').getTime();

export default function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [launched, setLaunched] = useState(false);

  function getTimeLeft() {
    const diff = LAUNCH_TIME - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      total: diff,
    };
  }

  useEffect(() => {
    if (Date.now() >= LAUNCH_TIME) {
      setLaunched(true);
      return;
    }

    const timer = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (t.total <= 0) {
        setLaunched(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (launched) return null;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[99999] bg-dark-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/assets/favicon/favicon-96x96.png"
            alt="FutureMint"
            className="w-16 h-16 mx-auto rounded-2xl shadow-lg shadow-primary-600/30"
          />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Something Big is Coming
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8">
          FutureMint NFT is launching soon. Get ready!
        </p>

        {/* Countdown boxes */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
          <div className="bg-dark-800 border border-dark-700 rounded-xl px-4 sm:px-6 py-4 min-w-[70px] sm:min-w-[80px]">
            <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{pad(timeLeft.hours)}</p>
            <p className="text-xs text-slate-500 mt-1">Hours</p>
          </div>
          <span className="text-2xl text-slate-600 font-bold">:</span>
          <div className="bg-dark-800 border border-dark-700 rounded-xl px-4 sm:px-6 py-4 min-w-[70px] sm:min-w-[80px]">
            <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{pad(timeLeft.minutes)}</p>
            <p className="text-xs text-slate-500 mt-1">Minutes</p>
          </div>
          <span className="text-2xl text-slate-600 font-bold">:</span>
          <div className="bg-dark-800 border border-dark-700 rounded-xl px-4 sm:px-6 py-4 min-w-[70px] sm:min-w-[80px]">
            <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{pad(timeLeft.seconds)}</p>
            <p className="text-xs text-slate-500 mt-1">Seconds</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="inline-flex items-center gap-2 bg-primary-900/30 border border-primary-700/30 rounded-full px-4 py-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm text-primary-300 font-medium">Launching Soon</span>
        </div>
      </div>
    </div>
  );
}
