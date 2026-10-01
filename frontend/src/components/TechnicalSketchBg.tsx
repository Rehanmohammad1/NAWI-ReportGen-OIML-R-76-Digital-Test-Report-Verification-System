import React from 'react';

interface TechnicalSketchBgProps {
  className?: string;
}

export const TechnicalSketchBg: React.FC<TechnicalSketchBgProps> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none select-none opacity-[0.035] ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full stroke-[#25221F]"
      >
        {/* Balance Fulcrum & Beam */}
        <path d="M 300 50 L 150 110 M 300 50 L 450 110" strokeWidth="1.5" strokeDasharray="4 2" />
        <path d="M 300 40 L 300 150" strokeWidth="2" />
        <polygon points="300,50 285,90 315,90" strokeWidth="1.5" fill="none" />
        
        {/* Left Scale Pan */}
        <path d="M 150 110 L 110 150 L 190 150 Z" strokeWidth="1.5" />
        <line x1="150" y1="110" x2="150" y2="140" strokeWidth="1" />

        {/* Right Scale Pan */}
        <path d="M 450 110 L 410 150 L 490 150 Z" strokeWidth="1.5" />
        <line x1="450" y1="110" x2="450" y2="140" strokeWidth="1" />

        {/* Vernier / Calibration Scale Grid Ticks */}
        <line x1="50" y1="180" x2="550" y2="180" strokeWidth="1.5" />
        {[...Array(26)].map((_, i) => (
          <line
            key={i}
            x1={50 + i * 20}
            y1={180}
            x2={50 + i * 20}
            y2={i % 5 === 0 ? 165 : 173}
            strokeWidth={i % 5 === 0 ? '1.5' : '1'}
          />
        ))}

        {/* Technical Metrology Annotations */}
        <text x="50" y="160" fontSize="8" fontFamily="monospace" fill="#25221F">OIML R-76 CLAUSE 3.5</text>
        <text x="470" y="160" fontSize="8" fontFamily="monospace" fill="#25221F">±e (MPE) ACCURACY</text>
      </svg>
    </div>
  );
};
