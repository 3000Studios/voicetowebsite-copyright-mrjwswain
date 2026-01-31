
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => {
  return (
    <div className={`${className} relative group transition-all duration-700 hover:rotate-[360deg]`}>
      <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,229,255,0.4)]">
        <defs>
          <linearGradient id="scorp-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Tech Ring */}
        <circle cx="256" cy="256" r="240" stroke="url(#scorp-metal)" strokeWidth="4" strokeDasharray="10 5" opacity="0.3" />
        <circle cx="256" cy="256" r="220" stroke="#1e293b" strokeWidth="20" fill="#020617" />

        {/* Scorpion Body Segments */}
        <path d="M256 160 Q210 160 210 210 Q210 260 256 260 Q302 260 302 210 Q302 160 256 160 Z" fill="url(#scorp-metal)" />
        <path d="M220 230 Q180 230 160 260 Q140 290 150 310" stroke="url(#scorp-metal)" strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M292 230 Q332 230 352 260 Q372 290 362 310" stroke="url(#scorp-metal)" strokeWidth="12" fill="none" strokeLinecap="round" />

        {/* Claws */}
        <path d="M150 310 L130 340 M150 310 L170 340" stroke="url(#scorp-metal)" strokeWidth="8" strokeLinecap="round" />
        <path d="M362 310 L342 340 M362 310 L382 340" stroke="url(#scorp-metal)" strokeWidth="8" strokeLinecap="round" />

        {/* Tail Arc */}
        <path d="M256 160 Q256 60 380 80 Q450 100 420 180" stroke="url(#scorp-metal)" strokeWidth="15" fill="none" strokeLinecap="round" />

        {/* The Spear (Lightning/Energy) */}
        <path d="M420 180 L200 400" stroke="#00e5ff" strokeWidth="8" filter="url(#neon-glow)" strokeLinecap="round" />
        <path d="M200 400 L180 420 M200 400 L210 380 M200 400 L180 390" stroke="#00e5ff" strokeWidth="4" filter="url(#neon-glow)" />
        <path d="M420 180 L440 160 L450 140 M420 180 L445 190" stroke="#00e5ff" strokeWidth="6" filter="url(#neon-glow)" />

        {/* Cyber Eyes */}
        <circle cx="235" cy="205" r="4" fill="#00e5ff" filter="url(#neon-glow)" />
        <circle cx="277" cy="205" r="4" fill="#00e5ff" filter="url(#neon-glow)" />
      </svg>
    </div>
  );
};

export default Logo;
