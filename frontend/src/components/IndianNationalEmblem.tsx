import React from 'react';

interface IndianNationalEmblemProps {
  className?: string;
  style?: React.CSSProperties;
}

export const IndianNationalEmblem: React.FC<IndianNationalEmblemProps> = ({
  className = '',
  style
}) => {
  return (
    <svg
      width="40"
      height="48"
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 text-black ${className}`}
      style={{
        width: '40px',
        height: '48px',
        minWidth: '40px',
        minHeight: '48px',
        maxWidth: '40px',
        maxHeight: '48px',
        flex: '0 0 40px',
        objectFit: 'contain',
        ...style
      }}
      aria-label="State Emblem of India - Lion Capital of Ashoka"
    >
      <g fill="currentColor">
        {/* --- TOP LION CAPITAL SILHOUETTE & EMBLEM --- */}
        
        {/* Center Lion Head */}
        <path d="M44 12 C44 9 46.5 6 50 6 C53.5 6 56 9 56 12 C56 14.5 54.5 16 53.5 17.5 C55.5 19 57 21 57 24 C57 27 55 29 53.5 30.5 C51.5 32 50 32 50 32 C50 32 48.5 32 46.5 30.5 C45 29 43 27 43 24 C43 21 44.5 19 46.5 17.5 C45.5 16 44 14.5 44 12 Z" />
        {/* Center Lion Snout & Facial Contours */}
        <path d="M47 14 H53 V17 H47 Z" fill="#FAF7F2" />
        <path d="M48.5 18 H51.5 V20.5 H48.5 Z" fill="#FAF7F2" />
        <circle cx="46.5" cy="12.5" r="1.2" fill="#FAF7F2" />
        <circle cx="53.5" cy="12.5" r="1.2" fill="#FAF7F2" />
        
        {/* Left Lion (Profile Left) */}
        <path d="M26 18 C26 15 29 12 33 12 C35.5 12 37 13.5 38 15 C39 17.5 39 20 37.5 22 C35.5 24.5 32.5 26.5 30 27.5 C27.5 25.5 26 22 26 18 Z" />
        <path d="M22 20 C21 20 20 21 20 22 C20 23 21 24 22 24 H26 V20 H22 Z" />
        <path d="M23 21 H25 V23 H23 Z" fill="#FAF7F2" />
        
        {/* Right Lion (Profile Right) */}
        <path d="M74 18 C74 15 71 12 67 12 C64.5 12 63 13.5 62 15 C61 17.5 61 20 62.5 22 C64.5 24.5 67.5 26.5 70 27.5 C72.5 25.5 74 22 74 18 Z" />
        <path d="M78 20 C79 20 80 21 80 22 C80 23 79 24 78 24 H74 V20 H78 Z" />
        <path d="M75 21 H77 V23 H75 Z" fill="#FAF7F2" />

        {/* Lion Mane Strands & Shoulder Structure */}
        <path d="M30 27.5 C34 30 41 32 50 32 C59 32 66 30 70 27.5 C74 32 76 37 76 43 C76 52 70 57 65 59 H35 C30 57 24 52 24 43 C24 37 26 32 30 27.5 Z" />
        
        {/* Mane Lock Texture Detailing */}
        <path d="M34 32 C37 36 39 42 39 48 H36 C34 43 33 37 34 32 Z" fill="#FAF7F2" opacity="0.35" />
        <path d="M66 32 C63 36 61 42 61 48 H64 C66 43 67 37 66 32 Z" fill="#FAF7F2" opacity="0.35" />
        <path d="M43 33 C45 37 46 43 46 49 H44 C43 44 42 38 43 33 Z" fill="#FAF7F2" opacity="0.35" />
        <path d="M57 33 C55 37 54 43 54 49 H56 C57 44 58 38 57 33 Z" fill="#FAF7F2" opacity="0.35" />
        <path d="M49 33 H51 V50 H49 Z" fill="#FAF7F2" opacity="0.4" />

        {/* --- ABACUS BAND (MIDDLE) --- */}
        <rect x="18" y="59" width="64" height="4" rx="1" />
        <rect x="20" y="63" width="60" height="21" rx="1.5" />
        
        {/* Ashoka Chakra (Center of Abacus) */}
        <circle cx="50" cy="73.5" r="8.5" fill="#FAF7F2" />
        <circle cx="50" cy="73.5" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="50" cy="73.5" r="1.5" fill="currentColor" />
        {/* 24-Spoke Radial Wheel */}
        <g stroke="currentColor" strokeWidth="0.75">
          <line x1="50" y1="65.5" x2="50" y2="81.5" />
          <line x1="42" y1="73.5" x2="58" y2="73.5" />
          <line x1="44.3" y1="67.8" x2="55.7" y2="79.2" />
          <line x1="44.3" y1="79.2" x2="55.7" y2="67.8" />
          <line x1="47" y1="65.9" x2="53" y2="81.1" />
          <line x1="47" y1="81.1" x2="53" y2="65.9" />
          <line x1="42.4" y1="70.5" x2="57.6" y2="76.5" />
          <line x1="42.4" y1="76.5" x2="57.6" y2="70.5" />
        </g>

        {/* Galloping Horse (Left Side of Abacus) */}
        <path d="M28 70.5 C26 69 27.5 66.5 30 66.5 C32 66.5 33 68 33.5 69.5 C34 71 33.5 73.5 31.5 74.5 C29.5 75 27.5 73 28 70.5 Z" fill="#FAF7F2" />
        <path d="M25 74 C26 73 28 73.5 29 75.5 C27 75.5 25.5 75 25 74 Z" fill="#FAF7F2" />

        {/* Bull (Right Side of Abacus) */}
        <path d="M72 70.5 C74 69 72.5 66.5 70 66.5 C68 66.5 67 68 66.5 69.5 C66 71 66.5 73.5 68.5 74.5 C70.5 75 72.5 73 72 70.5 Z" fill="#FAF7F2" />
        <path d="M75 74 C74 73 72 73.5 71 75.5 C73 75.5 74.5 75 75 74 Z" fill="#FAF7F2" />

        {/* Abacus Bottom Moulding */}
        <rect x="18" y="84" width="64" height="3" rx="1" />

        {/* --- INVERTED BELL LOTUS BASE --- */}
        <path d="M22 87 C22 87 28 97 50 97 C72 97 78 87 78 87 H22 Z" />
        <path d="M32 88 C36 93 43 95 50 95 C57 95 64 93 68 88 H32 Z" fill="#FAF7F2" opacity="0.25" />
        <rect x="25" y="98" width="50" height="3" rx="1" />

        {/* --- MOTTO BASE: SATYAMEVA JAYATE (सत्यमेव जयते) --- */}
        <text
          x="50"
          y="117"
          fontSize="10"
          fontFamily="serif, 'Noto Sans Devanagari', 'Tiro Devanagari Hindi', 'Arial Unicode MS'"
          fontWeight="bold"
          textAnchor="middle"
          fill="currentColor"
          letterSpacing="0.4"
        >
          सत्यमेव जयते
        </text>
      </g>
    </svg>
  );
};
