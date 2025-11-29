export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="60" cy="60" r="58" fill="url(#gradient)" />
      
      {/* Wallet Icon */}
      <g transform="translate(30, 30)">
        {/* Wallet body */}
        <rect x="5" y="20" width="50" height="35" rx="4" fill="white" opacity="0.95" />
        
        {/* Wallet flap */}
        <path 
          d="M 8 20 L 8 12 C 8 9 10 7 13 7 L 47 7 C 50 7 52 9 52 12 L 52 20" 
          fill="white" 
          opacity="0.8"
        />
        
        {/* Card slot */}
        <rect x="12" y="28" width="36" height="3" rx="1.5" fill="#059669" opacity="0.6" />
        
        {/* Money symbol - Riyal */}
        <g transform="translate(23, 38)">
          <text 
            x="0" 
            y="12" 
            fontFamily="Arial, sans-serif" 
            fontSize="16" 
            fontWeight="bold" 
            fill="#059669"
          >
            ر.س
          </text>
        </g>
        
        {/* Coins */}
        <circle cx="45" cy="48" r="8" fill="#fbbf24" stroke="white" strokeWidth="2" />
        <circle cx="15" cy="48" r="6" fill="#fbbf24" stroke="white" strokeWidth="1.5" />
      </g>
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWithText({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Logo size={size} />
      <div className="flex flex-col">
        <span className="font-bold text-emerald-700 leading-tight">إدارة الأموال</span>
        <span className="text-xs text-emerald-600 leading-tight">مديرك المالي الشخصي</span>
      </div>
    </div>
  );
}
