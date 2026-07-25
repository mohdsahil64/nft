'use client';

/**
 * FM Coin Logo - SVG recreation of the green FM leaf logo inside a gold coin
 * Perfectly fits inside coin, no cropping, no external images
 */
export default function FMCoinLogo({ size = 48, className = '' }) {
  const id = `fm-coin-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      style={{ filter: 'drop-shadow(0 3px 8px rgba(234,179,8,0.35))' }}
    >
      {/* Outer gold ring */}
      <circle cx="60" cy="60" r="58" fill={`url(#${id}-ring)`} />
      {/* Inner dark background */}
      <circle cx="60" cy="60" r="53" fill="#0c1a12" />
      {/* Subtle inner gold ring */}
      <circle cx="60" cy="60" r="50" stroke={`url(#${id}-inner)`} strokeWidth="1.5" fill="none" opacity="0.5" />

      {/* FM Logo - F letter */}
      <path
        d="M32 90 L32 50 C32 40 38 34 48 34 L56 34 L56 44 L48 44 C45 44 44 46 44 48 L44 56 L56 56 L56 66 L44 66 L44 90 Z"
        fill={`url(#${id}-fm)`}
      />

      {/* FM Logo - M letter (connected angular style) */}
      <path
        d="M54 90 L54 62 L64 42 L74 66 L84 42 L94 62 L94 90 L84 90 L84 68 L74 86 L64 68 L64 90 Z"
        fill={`url(#${id}-fm)`}
      />

      {/* Leaf on top-right */}
      <path
        d="M82 30 C82 30 87 22 96 20 C102 19 106 22 106 22 C106 22 103 30 96 33 C90 36 84 34 82 32 Z"
        fill={`url(#${id}-leaf1)`}
      />
      {/* Leaf stem/vein */}
      <path
        d="M84 31 C88 27 93 23 97 21"
        stroke="#065f46"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      {/* Small second leaf */}
      <path
        d="M86 35 C86 35 90 31 95 31 C99 31 101 33 101 33 C101 33 98 37 93 38 C89 39 87 37 86 36 Z"
        fill={`url(#${id}-leaf2)`}
      />

      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0" y1="20" x2="120" y2="100">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={`${id}-fm`} x1="32" y1="34" x2="94" y2="90">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${id}-leaf1`} x1="82" y1="20" x2="106" y2="34">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${id}-leaf2`} x1="86" y1="31" x2="101" y2="38">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Simple FM icon for inline/small use - same design, optimized for small sizes
 */
export function FMIconSimple({ size = 24, className = '' }) {
  const id = `fm-sm-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.25))' }}
    >
      {/* Outer gold ring */}
      <circle cx="60" cy="60" r="58" fill={`url(#${id}-ring)`} />
      {/* Inner dark background */}
      <circle cx="60" cy="60" r="53" fill="#0c1a12" />

      {/* FM Logo - F letter */}
      <path
        d="M32 90 L32 50 C32 40 38 34 48 34 L56 34 L56 44 L48 44 C45 44 44 46 44 48 L44 56 L56 56 L56 66 L44 66 L44 90 Z"
        fill={`url(#${id}-fm)`}
      />

      {/* FM Logo - M letter */}
      <path
        d="M54 90 L54 62 L64 42 L74 66 L84 42 L94 62 L94 90 L84 90 L84 68 L74 86 L64 68 L64 90 Z"
        fill={`url(#${id}-fm)`}
      />

      {/* Leaf */}
      <path
        d="M82 30 C82 30 87 22 96 20 C102 19 106 22 106 22 C106 22 103 30 96 33 C90 36 84 34 82 32 Z"
        fill={`url(#${id}-leaf)`}
      />
      <path
        d="M86 35 C86 35 90 31 95 31 C99 31 101 33 101 33 C101 33 98 37 93 38 C89 39 87 37 86 36 Z"
        fill={`url(#${id}-leaf)`}
      />

      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="60%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id={`${id}-fm`} x1="32" y1="34" x2="94" y2="90">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="82" y1="20" x2="106" y2="38">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
