'use client';
import FMCoinLogo from './FMCoinLogo';

export default function HeroNFTVisual() {
  return (
    <div className="relative w-full flex flex-col items-center">
      {/* NFT Hexagon with FM coins on sides */}
      <div className="relative w-[280px] h-[260px] sm:w-[320px] sm:h-[300px] flex items-center justify-center">
        {/* Ambient glow behind hexagon */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-purple-500/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        
        {/* FM Coin - Left side */}
        <div className="absolute left-0 top-[45%] -translate-y-1/2 z-20">
          <div className="relative">
            <div className="absolute -inset-2 bg-yellow-500/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
            <FMCoinLogo size={44} className="relative" />
          </div>
        </div>

        {/* FM Coin - Right side */}
        <div className="absolute right-0 top-[45%] -translate-y-1/2 z-20">
          <div className="relative">
            <div className="absolute -inset-2 bg-yellow-500/10 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3.5s' }} />
            <FMCoinLogo size={44} className="relative" />
          </div>
        </div>

        {/* Holographic platform rings */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[70%]">
          <div className="relative">
            <div className="w-full h-[14px] rounded-[50%] border border-cyan-400/25" />
            <div className="absolute inset-x-[12%] top-[2px] h-[12px] rounded-[50%] border border-purple-400/20" />
            <div className="absolute inset-x-[25%] top-[4px] h-[10px] rounded-[50%] border border-cyan-400/15" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-[2px] h-14 sm:h-16 bg-gradient-to-t from-cyan-400/50 via-purple-400/30 to-transparent" />
          </div>
        </div>

        {/* Hexagon */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-[70%] h-[70%] m-auto"
          style={{ filter: 'drop-shadow(0 0 25px rgba(0,210,255,0.35)) drop-shadow(0 0 50px rgba(139,92,246,0.2))' }}>
          <defs>
            <linearGradient id="heroHexGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="heroHexFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080828" />
              <stop offset="50%" stopColor="#0f0f3a" />
              <stop offset="100%" stopColor="#080828" />
            </linearGradient>
            <filter id="heroGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polygon points="100,12 178,56 178,144 100,188 22,144 22,56" 
            fill="url(#heroHexFill)" stroke="url(#heroHexGlow)" strokeWidth="2.5" filter="url(#heroGlow)" />
          <polygon points="100,26 166,64 166,136 100,174 34,136 34,64" 
            fill="none" stroke="url(#heroHexGlow)" strokeWidth="0.6" opacity="0.3" />
        </svg>

        {/* NFT Text inside hexagon */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-cyan-300/80 tracking-[4px] uppercase font-medium">FUTURE</span>
          <span className="text-3xl sm:text-4xl font-black text-white leading-none" style={{ textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>MINT</span>
          <span className="text-[10px] sm:text-xs text-purple-300/80 tracking-[4px] uppercase font-medium mt-1">NFT</span>
        </div>

        {/* Corner sparkles */}
        <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 bg-cyan-400/70 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[20%] right-[18%] w-1 h-1 bg-purple-400/50 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[30%] left-[20%] w-0.5 h-0.5 bg-white/40 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
      </div>
    </div>
  );
}
