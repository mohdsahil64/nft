'use client';
import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const SKIP_DELAY = 15; // seconds before claim button appears

/**
 * AdOverlay — fullscreen ad player with autoplay, 15s lock, Claim Now button
 * Picks random URL from NEXT_PUBLIC_WATCH_AD_URLS every time
 * Hides all YouTube branding - looks like platform's own player
 */
export default function AdOverlay({ onComplete, loading = false, buttonText = 'Claim Now', loadingText = 'Claiming...' }) {
  const [countdown, setCountdown] = useState(SKIP_DELAY);
  const [canClaim, setCanClaim] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const timerRef = useRef(null);

  // Get ALL ad URLs and pick a random one each time
  const allUrls = (process.env.NEXT_PUBLIC_WATCH_AD_URLS || '').split(',').filter(Boolean);
  const bonusUrl = process.env.NEXT_PUBLIC_REGISTER_BONUS_AD_URL || '';
  const fallbackUrl = process.env.NEXT_PUBLIC_AD_VIDEO_URL || '';
  
  // Combine all available URLs into pool
  const urlPool = [...allUrls];
  if (bonusUrl && !urlPool.includes(bonusUrl)) urlPool.push(bonusUrl);
  if (fallbackUrl && !urlPool.includes(fallbackUrl)) urlPool.push(fallbackUrl);

  // Pick random URL on each mount
  const [selectedUrl] = useState(() => {
    if (urlPool.length === 0) return '';
    return urlPool[Math.floor(Math.random() * urlPool.length)];
  });

  // Convert to embed URL with max branding suppression
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

    if (!videoId) return url;

    // Params to hide ALL YouTube branding
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      controls: '0',        // Hide player controls
      rel: '0',             // No related videos
      modestbranding: '1',  // Hide YouTube logo
      playsinline: '1',
      loop: '1',
      showinfo: '0',        // Hide video title/channel
      iv_load_policy: '3',  // Hide annotations
      disablekb: '1',       // Disable keyboard
      fs: '0',              // No fullscreen button
      cc_load_policy: '0',  // No captions
      playlist: videoId,    // Needed for loop to work
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    });

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const embedUrl = getEmbedUrl(selectedUrl);

  useEffect(() => {
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
      {/* Top bar - looks like our own player */}
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

      {/* Video area - cropped to hide YouTube UI at top/bottom */}
      <div className="flex-1 relative mx-4 my-3 rounded-2xl overflow-hidden bg-black border border-dark-700">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-800 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs">Loading...</p>
            </div>
          </div>
        )}
        {embedUrl && (
          <>
            {/* Iframe scaled up slightly and cropped to hide YouTube top/bottom bars */}
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ transform: 'scale(1.15)', transformOrigin: 'center center' }}
              allow="autoplay; encrypted-media; accelerometer; gyroscope"
              frameBorder="0"
              onLoad={() => setIframeLoaded(true)}
              referrerPolicy="no-referrer"
            />
            {/* Overlay to block any clickable YouTube elements */}
            <div className="absolute inset-0 z-[2]" />
            {/* Top gradient to hide any remaining title text */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent z-[3]" />
            {/* Bottom gradient to hide YouTube controls */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 to-transparent z-[3]" />
          </>
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
                <>🎁 {buttonText}</>
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
            Watch the full video to claim your 100 NFTs + 100 FM
          </p>
        </div>
      </div>
    </div>
  );
}
