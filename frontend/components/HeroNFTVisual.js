'use client';

export default function HeroNFTVisual() {
  return (
    <div className="relative w-full flex flex-col items-center gap-4">
      {/* NFT Hexagon - Main (bigger) */}
      <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-cyan-500/15 to-transparent blur-2xl" />
        {/* Holographic base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[12%]">
          <div className="absolute inset-0 rounded-[50%] border border-cyan-400/20" />
          <div className="absolute inset-[20%] rounded-[50%] border border-cyan-400/10" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-[1.5px] h-16 sm:h-20 bg-gradient-to-t from-cyan-400/40 to-transparent" />
        </div>
        {/* Hexagon SVG */}
        <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full drop-shadow-[0_0_18px_rgba(0,200,255,0.25)]">
          <defs>
            <linearGradient id="nftGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="nftFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#080820" />
              <stop offset="100%" stopColor="#12123a" />
            </linearGradient>
          </defs>
          <polygon points="100,18 172,56 172,144 100,182 28,144 28,56" fill="url(#nftFill)" stroke="url(#nftGlow)" strokeWidth="2" />
          <polygon points="100,28 162,62 162,138 100,172 38,138 38,62" fill="none" stroke="url(#nftGlow)" strokeWidth="0.5" opacity="0.35" />
        </svg>
        {/* Text */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[9px] sm:text-[10px] text-cyan-300/70 tracking-[3px] uppercase font-medium">FUTURE</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">MINT</span>
          <span className="text-[9px] sm:text-[10px] text-purple-300/70 tracking-[3px] uppercase font-medium mt-0.5">NFT</span>
        </div>
        {/* Particles */}
        <div className="absolute top-[15%] left-[10%] w-1 h-1 bg-cyan-400/50 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
        <div className="absolute top-[25%] right-[12%] w-0.5 h-0.5 bg-purple-400/40 rounded-full animate-ping" style={{ animationDuration: '3.2s' }} />
      </div>

      {/* FM Token Circle - Below NFT (smaller) */}
      <div className="relative w-[70px] h-[70px] sm:w-[85px] sm:h-[85px]">
        <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-lg" />
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-yellow-900/40 to-orange-900/30 border-2 border-yellow-500/35 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.12)]">
          <span className="text-lg sm:text-xl font-extrabold text-yellow-400">FM</span>
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-yellow-300/80 font-bold tracking-wider bg-[#070714] px-1.5 py-0.5 rounded-full border border-yellow-500/25">TOKEN</span>
      </div>
    </div>
  );
}
