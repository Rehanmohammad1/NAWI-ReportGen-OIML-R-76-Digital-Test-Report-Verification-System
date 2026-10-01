import React from 'react';

interface NawiLogoProps {
  className?: string;
  size?: number;
  iconOnly?: boolean;
}

export const NawiLogo: React.FC<NawiLogoProps> = ({ className = 'w-6 h-6', size = 24, iconOnly = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NAWI OIML R-76 Metrology Logo"
    >
      {/* Outer Regulatory Shield */}
      <path
        d="M24 4L8 10V22C8 32.5 14.8 41.7 24 44C33.2 41.7 40 32.5 40 22V10L24 4Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Precision Grid Accent */}
      <path
        d="M16 12H32M24 12V36M18 36H30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fulcrum & Balance Beam */}
      <path
        d="M14 20L24 16L34 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left Weighing Pan & Suspension */}
      <path
        d="M14 20V27M10 27H18L14 31L10 27Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Weighing Pan & Suspension */}
      <path
        d="M34 20V27M30 27H38L34 31L30 27Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center Metrology Calibration Point */}
      <circle cx="24" cy="16" r="2" fill="currentColor" />
    </svg>
  );
};
