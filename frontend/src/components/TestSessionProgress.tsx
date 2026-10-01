import React from 'react';
import { Check } from 'lucide-react';

export interface TestSessionProgressProps {
  currentStep?: 'instrument' | 'conditions' | 'tests' | 'compliance' | 'review' | 'report' | number;
  status?: string; // 'draft' | 'submitted' | 'under_review' | 'finalized'
  className?: string;
}

const STEPS = [
  { id: 'instrument', num: '01', title: 'Instrument' },
  { id: 'conditions', num: '02', title: 'Conditions' },
  { id: 'tests', num: '03', title: 'Tests' },
  { id: 'compliance', num: '04', title: 'Compliance' },
  { id: 'review', num: '05', title: 'Review' },
  { id: 'report', num: '06', title: 'Report' },
];

export const TestSessionProgress: React.FC<TestSessionProgressProps> = ({
  currentStep = 'tests',
  status,
  className = ''
}) => {
  // Map session status to step index if provided
  let activeIndex = 2; // default 'tests'
  if (typeof currentStep === 'number') {
    activeIndex = Math.max(0, Math.min(STEPS.length - 1, currentStep));
  } else if (typeof currentStep === 'string') {
    const foundIdx = STEPS.findIndex(s => s.id === currentStep);
    if (foundIdx !== -1) activeIndex = foundIdx;
  }

  if (status) {
    if (status === 'draft') activeIndex = 2; // Tests step
    else if (status === 'submitted') activeIndex = 3; // Compliance
    else if (status === 'under_review') activeIndex = 4; // Review
    else if (status === 'finalized') activeIndex = 5; // Report
  }

  return (
    <div className={`bg-white border border-[#D9D1C5] rounded-md p-4 shadow-sm ${className}`}>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[#413B32]/70 mb-3 flex items-center justify-between border-b border-[#D9D1C5]/60 pb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#413B32] inline-block"></span>
          Testing Workflow Lifecycle (OIML R-76)
        </span>
        {status && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
            STATUS: {status.toUpperCase().replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex || status === 'finalized';
          const isActive = idx === activeIndex && status !== 'finalized';

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-2.5 p-2 rounded text-xs transition border ${
                isActive
                  ? 'bg-[#F1EADE] border-[#413B32] text-[#413B32] font-semibold'
                  : isCompleted
                  ? 'bg-white border-[#D9D1C5] text-[#413B32]'
                  : 'bg-[#F1EADE]/30 border-[#D9D1C5]/50 text-[#413B32]/40'
              }`}
            >
              {/* Step indicator icon/number */}
              <div
                className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 ${
                  isActive
                    ? 'bg-[#413B32] text-[#F1EADE]'
                    : isCompleted
                    ? 'bg-[#A7BABA] text-[#413B32]'
                    : 'bg-[#D9D1C5]/60 text-[#413B32]/60'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.num}
              </div>

              {/* Step Title */}
              <div className="truncate">
                <span className="block truncate font-mono text-[11px]">
                  {step.title}
                </span>
                <span className="text-[9px] block text-[#413B32]/60 uppercase font-sans">
                  {isCompleted ? 'Completed' : isActive ? 'Active' : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
