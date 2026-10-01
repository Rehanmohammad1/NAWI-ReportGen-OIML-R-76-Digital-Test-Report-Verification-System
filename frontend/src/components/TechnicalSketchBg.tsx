import React from 'react';

interface TechnicalSketchBgProps {
  className?: string;
}

export const TechnicalSketchBg: React.FC<TechnicalSketchBgProps> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 450 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-[#24211D] opacity-[0.14]"
      >
        {/* Left Graduated Millimeter Ruler Ticks */}
        <line x1="30" y1="20" x2="30" y2="880" stroke="currentColor" strokeWidth="1" />
        {[...Array(44)].map((_, i) => {
          const y = 20 + i * 20;
          const isMajor = i % 5 === 0;
          const val = (i - 20) * 10;
          return (
            <g key={i}>
              <line
                x1={isMajor ? 12 : 22}
                y1={y}
                x2="30"
                y2={y}
                stroke="currentColor"
                strokeWidth={isMajor ? '1.2' : '0.7'}
              />
              {isMajor && y > 30 && y < 870 && (
                <text
                  x="8"
                  y={y + 3}
                  fontSize="7"
                  fontFamily="monospace"
                  fill="currentColor"
                  textAnchor="end"
                >
                  {val}
                </text>
              )}
            </g>
          );
        })}

        {/* Outer Glass Cabinet Case Outline */}
        <rect x="70" y="40" width="350" height="820" rx="3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 3" />
        <line x1="70" y1="120" x2="420" y2="120" stroke="currentColor" strokeWidth="0.8" />
        <line x1="70" y1="780" x2="420" y2="780" stroke="currentColor" strokeWidth="1.2" />

        {/* Central Brass Pillar Column */}
        <rect x="235" y="160" width="20" height="580" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="245" y1="160" x2="245" y2="740" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" />
        
        {/* Column Knobs & Decorative Collar Rings */}
        <circle cx="245" cy="220" r="14" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="245" cy="220" r="8" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="245" cy="220" r="3" fill="currentColor" />
        
        <rect x="230" y="270" width="30" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <rect x="225" y="420" width="40" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <rect x="220" y="620" width="50" height="20" rx="2" stroke="currentColor" strokeWidth="1.2" />

        {/* Base Platform & Leveling Screws */}
        <rect x="100" y="740" width="290" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="130" cy="774" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="360" cy="774" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <line x1="130" y1="764" x2="130" y2="784" stroke="currentColor" strokeWidth="1" />
        <line x1="360" y1="764" x2="360" y2="784" stroke="currentColor" strokeWidth="1" />

        {/* Main Horizontal Balance Beam */}
        <path d="M 110 180 L 380 180" stroke="currentColor" strokeWidth="2.5" />
        <path d="M 130 170 L 245 160 L 360 170" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <polygon points="245,180 232,210 258,210" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="245" cy="180" r="4" fill="currentColor" />

        {/* Central Pointer & Graduated Arc Scale */}
        <line x1="245" y1="180" x2="245" y2="265" stroke="currentColor" strokeWidth="1.2" />
        <path d="M 215 270 A 35 35 0 0 0 275 270" stroke="currentColor" strokeWidth="1.2" fill="none" />
        {[...Array(11)].map((_, i) => (
          <line
            key={i}
            x1={220 + i * 5.5}
            y1={265}
            x2={220 + i * 5.5}
            y2={i === 5 ? 276 : 271}
            stroke="currentColor"
            strokeWidth={i === 5 ? '1.5' : '0.8'}
          />
        ))}

        {/* Left Scale Pan Suspension & Pan */}
        <line x1="110" y1="180" x2="110" y2="480" stroke="currentColor" strokeWidth="1" />
        <path d="M 110 180 L 85 220 L 135 220 Z" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M 85 480 Q 110 510 135 480" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="80" y1="480" x2="140" y2="480" stroke="currentColor" strokeWidth="2" />
        <line x1="85" y1="220" x2="85" y2="480" stroke="currentColor" strokeWidth="0.8" />
        <line x1="135" y1="220" x2="135" y2="480" stroke="currentColor" strokeWidth="0.8" />

        {/* Right Scale Pan Suspension & Pan */}
        <line x1="380" y1="180" x2="380" y2="480" stroke="currentColor" strokeWidth="1" />
        <path d="M 380 180 L 355 220 L 405 220 Z" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M 355 480 Q 380 510 405 480" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="350" y1="480" x2="410" y2="480" stroke="currentColor" strokeWidth="2" />
        <line x1="355" y1="220" x2="355" y2="480" stroke="currentColor" strokeWidth="0.8" />
        <line x1="405" y1="220" x2="405" y2="480" stroke="currentColor" strokeWidth="0.8" />

        {/* Standard Calibration Weight Cylinders */}
        <rect x="95" y="445" width="30" height="35" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="106" y="437" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
        
        <rect x="365" y="440" width="32" height="40" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="377" y="432" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />

        {/* Technical Annotations & Reference Labels */}
        <text x="145" y="100" fontSize="8" fontFamily="monospace" fill="currentColor">OIML R-76 PRECISION BALANCE</text>
        <text x="145" y="112" fontSize="7" fontFamily="monospace" fill="currentColor">CLASS (I) SPECIAL ACCURACY • MAX 220g</text>
        
        <text x="80" y="720" fontSize="7" fontFamily="monospace" fill="currentColor">FIGURE 3.1 — MECHANICAL SCALE ASSEMBLY</text>
        <text x="80" y="732" fontSize="7" fontFamily="monospace" fill="currentColor">LEGAL METROLOGY VERIFICATION SPECIFICATION</text>
      </svg>
    </div>
  );
};
