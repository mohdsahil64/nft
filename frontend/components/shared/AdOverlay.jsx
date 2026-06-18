'use client';
import { useState, useEffect, useRef } from 'react';

// Multiple ad videos — randomly picked each time
const AD_VIDEOS = [
  'https://www.youtube.com/embed/NbTBkuZOJqY',
  'https://www.youtube.com/embed/BBftv3uI2ro',
  'https://www.youtube.com/embed/8tlXp_CGSSc',
];

const SKIP_DELAY = 10; // seconds before skip button appears

/**
 * AdOverlay — fullscreen ad with random video, 10s circular countdown skip button
 * @param {function} onComplete - called when ad is skipped or finishes
 * @param {boolean} loading - disable skip button while processing
 * @param {string} buttonText - text for the action button (default: "Continue")
 * @param {string} loadingText - text while loading (default: "Processing...")
 */
export default function AdOverlay({ onComplete, loading = false, buttonText = 'Continue', loadingText = 'Processing...' }) {
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canSkip, setCanSkip] = useState(false);
  const [videoUrl] = useState(() => AD_VIDEOS[Math.floor(Math.random() * AD_VIDEOS.length)]);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setCanSkip(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // SVG circular progress
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = ((SKIP_DELAY - countdown) / SKIP_DELAY) * circumference;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-white/80 font-medium">Sponsored Content</span>
        </div>

        {/* Skip button area */}
        <div className="flex items-center gap-3">
          {canSkip ? (
            <button
              onClick={onComplete}
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full border border-white/20 transition-all disabled:opacity-50"
            >
              {loading ? loadingText : (
                <>
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Skip in</span>
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Circular countdown */}
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                  {/* Background circle */}
                  <circle
                    cx="22" cy="22" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="22" cy="22" r={radius}
                    fill="none"
                    stroke="url(#skipGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="skipGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Number in center */}
                <span className="absolute text-xs font-bold text-white">{countdown}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="w-full h-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
          <iframe
            src={`${videoUrl}?autoplay=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${videoUrl.split('/').pop()}`}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Sponsored Content"
          />
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="h-1.5 bg-dark-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${((SKIP_DELAY - countdown) / SKIP_DELAY) * 100}%` }}
        />
      </div>
    </div>
  );
}
