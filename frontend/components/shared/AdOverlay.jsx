'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const SKIP_DELAY = 15;

export default function AdOverlay({ onComplete, loading = false, buttonText = 'Claim Now', loadingText = 'Claiming...' }) {
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canClaim, setCanClaim] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timerRef = useRef(null);
  const errorTimerRef = useRef(null);

  // Build URL pool from env
  const buildPool = () => {
    const allUrls = (process.env.NEXT_PUBLIC_WATCH_AD_URLS || '').split(',').map(u => u.trim()).filter(Boolean);
    const bonus = process.env.NEXT_PUBLIC_REGISTER_BONUS_AD_URL?.trim();
    const fallback = process.env.NEXT_PUBLIC_AD_VIDEO_URL?.trim();
    const pool = [...allUrls];
    if (bonus && !pool.includes(bonus)) pool.push(bonus);
    if (fallback && !pool.includes(fallback)) pool.push(fallback);
    return pool;
  };

  const urlPool = useRef(buildPool());
  const usedIndices = useRef([]);

  // Pick a random URL that hasn't been tried yet this session
  const pickRandomUrl = useCallback(() => {
    const pool = urlPool.current;
    if (pool.length === 0) return '';
    // Reset if all tried
    if (usedIndices.current.length >= pool.length) usedIndices.current = [];
    const available = pool.map((_, i) => i).filter(i => !usedIndices.current.includes(i));
    const idx = available[Math.floor(Math.random() * available.length)];
    usedIndices.current.push(idx);
    return pool[idx];
  }, []);

  const [currentUrl, setCurrentUrl] = useState(() => pickRandomUrl());

  // Convert to embed URL with max branding suppression + nocookie
  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1]?.split('?')[0];
    } else {
      const watchMatch = url.match(/[?&]v=([^&]+)/);
      const shortsMatch = url.match(/shorts\/([^?&]+)/);
      const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
      videoId = watchMatch?.[1] || shortsMatch?.[1] || shortMatch?.[1] || '';
    }
    if (!videoId) return '';

    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      loop: '1',
      showinfo: '0',
      iv_load_policy: '3',
      disablekb: '1',
      fs: '0',
      playlist: videoId,
    });

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const embedUrl = getEmbedUrl(currentUrl);

  // Start countdown after iframe loads
  useEffect(() => {
    if (!iframeLoaded) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); setCanClaim(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [iframeLoaded]);

  // Auto-detect error via message listener (YouTube posts errors via postMessage)
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // YouTube error event
        if (data?.event === 'onError' || data?.info === 153 || data?.info === 150 || data?.info === 101) {
          handleVideoError();
        }
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [retryCount]);

  // If iframe loads but video has error, auto-detect via timeout
  // If no progress after 8 seconds → try next video
  useEffect(() => {
    clearTimeout(errorTimerRef.current);
    setIframeLoaded(false);
    setVideoError(false);
    // Give 8s to load, else try next
    errorTimerRef.current = setTimeout(() => {
      if (!iframeLoaded) handleVideoError();
    }, 8000);
    return () => clearTimeout(errorTimerRef.current);
  }, [currentUrl]);

  const handleVideoError = useCallback(() => {
    clearTimeout(errorTimerRef.current);
    clearInterval(timerRef.current);
    const pool = urlPool.current;
    if (retryCount >= pool.length) {
      // All videos tried, just let user claim anyway
      setCanClaim(true);
      return;
    }
    setVideoError(true);
    setIframeLoaded(false);
    setRetryCount(r => r + 1);
    const next = pickRandomUrl();
    setCurrentUrl(next);
    setVideoError(false);
  }, [retryCount, pickRandomUrl]);

  const progressPercent = ((SKIP_DELAY - countdown) / SKIP_DELAY) * 100;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070714] flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-medium">FutureMint Ad</span>
        </div>
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
      <div className="flex-1 relative mx-4 my-3 rounded-2xl overflow-hidden bg-black border border-dark-700">
        {/* Loading state */}
        {!iframeLoaded && !canClaim && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs">Loading ad...</p>
            </div>
          </div>
        )}

        {embedUrl && !canClaim && (
          <>
            <iframe
              key={currentUrl}
              src={embedUrl}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scale(1.18)', transformOrigin: 'center center' }}
              allow="autoplay; encrypted-media; accelerometer; gyroscope"
              frameBorder="0"
              onLoad={() => { setIframeLoaded(true); clearTimeout(errorTimerRef.current); }}
              onError={handleVideoError}
              referrerPolicy="no-referrer"
            />
            {/* Block clicks + hide YT UI */}
            <div className="absolute inset-0 z-[2]" />
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/70 to-transparent z-[3]" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/70 to-transparent z-[3]" />
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-black z-[3]" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-black z-[3]" />
          </>
        )}

        {/* Claim ready overlay */}
        {canClaim && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/80 z-10">
            <div className="text-center">
              <div className="text-4xl mb-2">🎁</div>
              <p className="text-white font-semibold text-sm">Ad watched!</p>
              <p className="text-slate-400 text-xs mt-1">Tap below to claim</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-4 pb-5 pt-2">
        <div className="max-w-sm mx-auto">
          {canClaim ? (
            <button
              onClick={onComplete}
              disabled={loading}
              className="w-full py-4 rounded-xl text-white font-bold text-base bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 shadow-[0_0_25px_rgba(0,180,255,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {loadingText}</> : <>🎁 {buttonText}</>}
            </button>
          ) : (
            <div className="w-full py-4 bg-dark-800/80 border border-dark-600 rounded-xl flex items-center justify-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span className="text-sm text-slate-400 font-medium">
                Watch to claim &bull; {countdown}s remaining
              </span>
            </div>
          )}
          <p className="text-center text-[10px] text-slate-600 mt-2">
            Watch the full video to claim your 100 NFTs + 100 FM
          </p>
        </div>
      </div>
    </div>
  );
}
