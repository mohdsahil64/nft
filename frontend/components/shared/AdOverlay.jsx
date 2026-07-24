'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const SKIP_DELAY = 15; // seconds before claim button appears

/**
 * AdOverlay — fullscreen YouTube ad with autoplay+audio, 15s lock, Claim Now button
 * URL from env: NEXT_PUBLIC_REGISTER_BONUS_AD_URL
 */
export default function AdOverlay({ onComplete, loading = false, buttonText = 'Claim Now', loadingText = 'Claiming...' }) {
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canClaim, setCanClaim] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const timerRef = useRef(null);

  // Get YouTube URL from env
  const rawUrl = process.env.NEXT_PUBLIC_REGISTER_BONUS_AD_URL || process.env.NEXT_PUBLIC_AD_VIDEO_URL || '';

  // Convert YouTube URL to embed format with autoplay + audio
  const getEmbedUrl = (url) => {
    if (!url) return '';
    // Already embed format
    if (url.includes('/embed/')) {
      const base = url.split('?')[0];
      return `${base}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1`;
    }
    // youtube.com/watch?v=ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1`;
    }
    // youtube.com/shorts/ID
    const shortsMatch = url.match(/shorts\/([^?&]+)/);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1`;
    }
    // youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=0&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(rawUrl);

  useEffect(() => {
    // Timer starts only after iframe loads
    if (!iframeLoaded) return;
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setCanClaim(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [iframeLoaded]);

  const progressPercent = ((SKIP_DELAY - countdown) / SKIP_DELAY) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070714] flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Sponsored</span>
        <span className="text-[10px] text-slate-500">
          {canClaim ? '✓ Ready' : `${countdown}s`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-dark-800 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center relative mx-4 my-3 rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-800 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs">Loading video...</p>
            </div>
          </div>
        )}
        {embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full h-full absolute inset-0"
            allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            onLoad={() => setIframeLoaded(true)}
          />
        )}
      </div>

      {/* Bottom action */}
      <div className="px-4 pb-5 pt-2">
        <div className="max-w-sm mx-auto">
          {canClaim ? (
            <button
              onClick={onComplete}
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_25px_rgba(0,180,255,0.3)] hover:shadow-[0_0_35px_rgba(0,180,255,0.5)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {loadingText}</>
              ) : (
                <>
                  🎁 {buttonText}
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-4 bg-dark-800/80 border border-dark-600 rounded-xl flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="text-sm text-slate-400 font-medium">
                Watch to claim &bull; {countdown}s remaining
              </span>
            </div>
          )}

          {/* Info */}
          <p className="text-center text-[10px] text-slate-600 mt-2">
            Watch the full video to claim your 100 NFTs + 50 FM
          </p>
        </div>
      </div>
    </div>
  );
}
