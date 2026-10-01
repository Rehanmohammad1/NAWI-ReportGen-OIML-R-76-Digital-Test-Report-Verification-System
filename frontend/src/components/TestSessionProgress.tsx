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
    <div className={`bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-sm ${className}`}>
      <div className="text-xs uppercase tracking-wider font-semibold text-[#666059] mb-3 flex items-center justify-between border-b border-[#E6E2DC] pb-2.5">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C87A57] inline-block"></span>
          <span className="font-serif-header text-sm text-[#25221F] normal-case tracking-normal font-semibold">Testing Workflow Lifecycle (OIML R-76)</span>
        </span>
        {status && (
          <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#F3EFEA] text-[#25221F] border border-[#E6E2DC] font-medium">
            STATUS: {status.toUpperCase().replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 relative">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex || status === 'finalized';
          const isActive = idx === activeIndex && status !== 'finalized';

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-2.5 p-2.5 rounded-md text-xs transition border ${
                isActive
                  ? 'bg-[#FAF6F0] border-[#C87A57] text-[#25221F] font-medium shadow-xs'
                  : isCompleted
                  ? 'bg-white border-[#E6E2DC] text-[#25221F]'
                  : 'bg-[#F9F8F6] border-[#E6E2DC]/60 text-[#666059]/50'
              }`}
            >
              {/* Step indicator icon/number */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold flex-shrink-0 ${
                  isActive
                    ? 'bg-[#C87A57] text-white'
                    : isCompleted
                    ? 'bg-[#3E7B66] text-white'
                    : 'bg-[#E6E2DC] text-[#666059]'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : step.num}
              </div>

              {/* Step Title */}
              <div className="truncate">
                <span className="block truncate font-sans text-xs font-semibold text-[#25221F]">
                  {step.title}
                </span>
                <span className="text-[10px] block text-[#666059] font-sans">
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

