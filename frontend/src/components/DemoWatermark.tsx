import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DemoWatermark: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-semibold mb-4 shadow-sm">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        <span>DEMO DATA — FOR TESTING & SIH EVALUATION PURPOSES ONLY</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
        Non-Official Record
      </span>
    </div>
  );
};
