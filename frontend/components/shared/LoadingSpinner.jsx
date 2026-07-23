'use client';

export default function LoadingSpinner({ size = 'md' }) {
  const logoSize = size === 'xl' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Logo with pulse glow */}
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" />
        <img
          src="/assets/favicon/favicon-96x96.png"
          alt="Loading"
          className={`${logoSize} rounded-2xl relative z-10 animate-pulse`}
          style={{ animationDuration: '1.5s' }}
        />
      </div>
      {/* 3 dots */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
