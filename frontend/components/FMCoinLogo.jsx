'use client';

/**
 * FM Coin Logo - Gold shiny coin with FM text
 * Proper coin look with shadow, golden shine, metallic feel
 */
export default function FMCoinLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 4px 8px rgba(234,179,8,0.3))' }}
    >
      {/* Outer coin edge - dark gold rim */}
      <circle cx="60" cy="60" r="58" fill="url(#outerRim)" />
      
      {/* Main coin body - golden gradient */}
      <circle cx="60" cy="60" r="53" fill="url(#coinBody)" />
      
      {/* Inner ring detail */}
      <circle cx="60" cy="60" r="48" fill="none" stroke="url(#innerRing)" strokeWidth="2" />
      
      {/* Inner coin face */}
      <circle cx="60" cy="60" r="46" fill="url(#coinFace)" />
      
      {/* Shine highlight (top-left) */}
      <ellipse cx="42" cy="38" rx="18" ry="14" fill="url(#shine)" opacity="0.6" />
      
      {/* FM Text */}
      <text x="60" y="72" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="Arial, sans-serif" fill="url(#textGold)" stroke="url(#textStroke)" strokeWidth="1">
        FM
      </text>
      
      {/* Edge light reflection */}
      <circle cx="60" cy="60" r="53" fill="none" stroke="url(#edgeLight)" strokeWidth="1.5" opacity="0.5" />

      <defs>
        {/* Outer dark rim */}
        <linearGradient id="outerRim" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#92600a" />
          <stop offset="30%" stopColor="#6b4a0a" />
          <stop offset="70%" stopColor="#4a3308" />
          <stop offset="100%" stopColor="#92600a" />
        </linearGradient>
        
        {/* Main coin body gradient */}
        <linearGradient id="coinBody" x1="10" y1="10" x2="110" y2="110">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        
        {/* Inner ring */}
        <linearGradient id="innerRing" x1="0" y1="20" x2="120" y2="100">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        
        {/* Inner coin face - slightly darker */}
        <radialGradient id="coinFace" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        
        {/* Top shine */}
        <radialGradient id="shine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
        
        {/* FM text gold gradient */}
        <linearGradient id="textGold" x1="35" y1="40" x2="85" y2="80">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="30%" stopColor="#78350f" />
          <stop offset="50%" stopColor="#451a03" />
          <stop offset="70%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        
        {/* Text stroke */}
        <linearGradient id="textStroke" x1="35" y1="40" x2="85" y2="80">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        
        {/* Edge reflection */}
        <linearGradient id="edgeLight" x1="20" y1="20" x2="100" y2="100">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fef3c7" stopOpacity="0" />
          <stop offset="70%" stopColor="#fef3c7" stopOpacity="0" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Simple FM coin icon for inline/small use
 */
export function FMIconSimple({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.25))' }}
    >
      {/* Outer rim */}
      <circle cx="30" cy="30" r="29" fill="url(#sRim)" />
      
      {/* Coin body */}
      <circle cx="30" cy="30" r="26" fill="url(#sBody)" />
      
      {/* Inner ring */}
      <circle cx="30" cy="30" r="23" fill="none" stroke="url(#sRing)" strokeWidth="1" />
      
      {/* Coin face */}
      <circle cx="30" cy="30" r="22" fill="url(#sFace)" />
      
      {/* Shine */}
      <ellipse cx="22" cy="20" rx="8" ry="6" fill="url(#sShine)" opacity="0.5" />
      
      {/* FM Text */}
      <text x="30" y="36" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="Arial, sans-serif" fill="url(#sText)" stroke="#92400e" strokeWidth="0.5">
        FM
      </text>

      <defs>
        <linearGradient id="sRim" x1="0" y1="0" x2="60" y2="60">
          <stop offset="0%" stopColor="#92600a" />
          <stop offset="50%" stopColor="#6b4a0a" />
          <stop offset="100%" stopColor="#92600a" />
        </linearGradient>
        <linearGradient id="sBody" x1="5" y1="5" x2="55" y2="55">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="25%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="sRing" x1="0" y1="10" x2="60" y2="50">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <radialGradient id="sFace" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id="sShine" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sText" x1="15" y1="20" x2="45" y2="40">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
      </defs>
    </svg>
  );
}
