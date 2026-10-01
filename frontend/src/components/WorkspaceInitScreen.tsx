import React, { useState, useEffect } from 'react';

export const WorkspaceInitScreen: React.FC = () => {
  const [iconIndex, setIconIndex] = useState(0);
  const [statusText, setStatusText] = useState('Initializing Legal Metrology Workspace...');

  const statuses = [
    'Initializing Legal Metrology Workspace...',
    'Verifying OIML R-76 Rule Engine...',
    'Loading Laboratory Authority Context...',
    'Preparing Calibration Register...'
  ];

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setIconIndex(prev => (prev + 1) % 5);
    }, 280);

    const statusInterval = setInterval(() => {
      setStatusText(prev => {
        const currIdx = statuses.indexOf(prev);
        return statuses[(currIdx + 1) % statuses.length];
      });
    }, 450);

    return () => {
      clearInterval(iconInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#EBE5DC] text-[#24211D] flex flex-col items-center justify-center p-6 font-sans tech-grid-bg relative overflow-hidden select-none">
      
      <div className="max-w-sm w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-2xl p-8 shadow-xl text-center space-y-6 relative z-10">
        
        {/* Header Branding */}
        <div>
          <h1 className="font-serif-header font-bold text-xl sm:text-2xl text-[#24211D] tracking-tight">
            NAWI TEST REPORTING SYSTEM
          </h1>
          <p className="text-xs font-mono text-[#8C8275] tracking-widest uppercase mt-1">
            Legal Metrology &bull; OIML R-76
          </p>
        </div>

        {/* Technical Metrology Line Icon Sequence */}
        <div className="w-20 h-20 mx-auto rounded-xl bg-[#EFEAE2] border border-[#E2DDD5] flex items-center justify-center text-[#9C5A3C] shadow-inner relative overflow-hidden">
          
          {/* Icon 1: Beam Balance */}
          {iconIndex === 0 && (
            <svg className="w-10 h-10 animate-fade-in" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 24 8 L 24 38 M 12 18 L 36 18 M 12 18 L 8 28 L 16 28 Z M 36 18 L 32 28 L 40 28 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="18" r="2" fill="currentColor" />
              <rect x="18" y="38" width="12" height="4" rx="1" fill="currentColor" />
            </svg>
          )}

          {/* Icon 2: Digital Weighing Platform */}
          {iconIndex === 1 && (
            <svg className="w-10 h-10 animate-fade-in" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="24" width="32" height="14" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <rect x="14" y="28" width="12" height="6" rx="1" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <circle cx="34" cy="31" r="1.5" fill="currentColor" />
            </svg>
          )}

          {/* Icon 3: Standard Calibration Weight */}
          {iconIndex === 2 && (
            <svg className="w-10 h-10 animate-fade-in" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="18" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <rect x="20" y="10" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="16" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
            </svg>
          )}

          {/* Icon 4: Graduated Measurement Ruler */}
          {iconIndex === 3 && (
            <svg className="w-10 h-10 animate-fade-in" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="16" width="36" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <line x1="12" y1="16" x2="12" y2="24" stroke="currentColor" strokeWidth="2" />
              <line x1="18" y1="16" x2="18" y2="21" stroke="currentColor" strokeWidth="1.5" />
              <line x1="24" y1="16" x2="24" y2="26" stroke="currentColor" strokeWidth="2" />
              <line x1="30" y1="16" x2="30" y2="21" stroke="currentColor" strokeWidth="1.5" />
              <line x1="36" y1="16" x2="36" y2="24" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}

          {/* Icon 5: Vernier Caliper / Measurement Tool */}
          {iconIndex === 4 && (
            <svg className="w-10 h-10 animate-fade-in" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="3" />
              <path d="M 12 14 L 12 34 M 18 18 L 18 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="24" y="18" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          )}

        </div>

        {/* Progress Bar & Status Text */}
        <div className="space-y-2">
          <div className="w-48 h-1.5 bg-[#E2DDD5] rounded-full mx-auto overflow-hidden relative">
            <div className="h-full bg-[#9C5A3C] w-full animate-pulse rounded-full" />
          </div>
          <p className="text-[11px] font-mono font-medium text-[#8C8275] h-4">
            {statusText}
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2DDD5]/80 text-[10px] font-mono text-[#6B6359]">
          Department of Consumer Affairs &bull; Govt. of India
        </div>

      </div>

    </div>
  );
};
