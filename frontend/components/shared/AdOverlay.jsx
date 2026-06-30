'use client';
import { useState, useEffect, useRef } from 'react';

// Direct video URL (mp4) — no iframe needed
const AD_VIDEO_URL =
  'https://res.cloudinary.com/depjmtq3g/video/upload/v1782560292/vidssave.com_Treasure_nft_letest_video_trending_viral_nft_shorts_reels_720P_ksk3zq.mp4';

const SKIP_DELAY = 10; // seconds before continue button appears

/**
 * AdOverlay — fullscreen ad with direct video playback
 */
export default function AdOverlay({ onComplete, loading = false, buttonText = 'Continue', loadingText = 'Processing...' }) {
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canSkip, setCanSkip] = useState(false);
  const videoRef = useRef(null);
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

  // Auto-play video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const progressPercent = ((SKIP_DELAY - countdown) / SKIP_DELAY) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top progress bar */}
      <div className="h-1 bg-white/10 w-full">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Video area — takes full available space */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <video
          ref={videoRef}
          src={AD_VIDEO_URL}
          className="w-full h-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      {/* Bottom action bar */}
      <div className="px-4 py-4 sm:py-5 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-md mx-auto">
          {canSkip ? (
            <button
              onClick={onComplete}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-primary-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? loadingText : (
                <>
                  {buttonText}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <span className="text-sm text-white/70 font-medium">
                Continue in {countdown}s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
