import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RuleLimit } from '../types';
import { BookOpen, ShieldAlert, Layers } from 'lucide-react';

export const RulesPage: React.FC = () => {
  const [limits, setLimits] = useState<RuleLimit[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getRuleVersions(), api.getRuleLimits()])
      .then(([vData, lData]) => {
        setVersions(vData);
        setLimits(lData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">Loading Rule Engine configuration...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Header */}
      <div className="pb-2 border-b border-[#D9D1C5]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
          <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
            Versioned Rule Engine (OIML R-76)
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
            MPE CONFIGURATION
          </span>
        </div>
        <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
          Decoupled regulatory rule engine storing MPE tables and scale interval bands as versioned database configuration.
        </p>
      </div>

      {/* Regulatory Constraint Warning Banner */}
      <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-xs text-xs space-y-1.5 font-mono">
        <div className="flex items-center space-x-2 font-bold text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-800 flex-shrink-0" />
          <span>REGULATORY COMPLIANCE STATUS — CONFIGURATION PROVENANCE</span>
        </div>
        <p className="leading-relaxed text-[#413B32]">
          Active rule limits in this installation are tagged with status: <br/>
          <span className="font-mono bg-[#FFFFFF] text-[#413B32] px-2 py-0.5 rounded-xs border border-amber-300 font-bold inline-block mt-1">
            "REQUIRES VERIFICATION AGAINST APPLICABLE OIML R-76 EDITION"
          </span>
        </p>
      </div>

      {/* Active Rule Versions & Data Provenance */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-4 space-y-3">
        <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-[#413B32]" />
          <span>Official Regulatory Data Source & Provenance</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {versions.map(v => (
            <div key={v.id} className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#413B32]">{v.version_code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold">
                  {v.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-[#413B32]/80">{v.description}</p>
              <p className="text-[10px] text-[#413B32]/60 pt-1">Source: {v.source_citation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MPE Table Configuration Register */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#F1EADE]/40 border-b border-[#D9D1C5]">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase">Maximum Permissible Error (MPE) Limits Register</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Rule Code</th>
                <th className="p-2.5">Accuracy Class</th>
                <th className="p-2.5">Load Range (m in e)</th>
                <th className="p-2.5">Initial MPE (±e)</th>
                <th className="p-2.5">In-Service MPE (±e)</th>
                <th className="p-2.5">Evaluation Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {limits.map((rl) => (
                <tr key={rl.id} className="hover:bg-[#F1EADE]/30 transition">
                  <td className="p-2.5 font-mono font-bold text-[#413B32]">{rl.rule_code}</td>
                  <td className="p-2.5 font-mono">Class {rl.accuracy_class}</td>
                  <td className="p-2.5 font-mono text-[11px]">
                    {rl.min_load_e} e ≤ m ≤ {rl.max_load_e} e
                  </td>
                  <td className="p-2.5 font-mono font-bold">±{rl.mpe_initial_e} e</td>
                  <td className="p-2.5 font-mono">±{rl.mpe_inservice_e} e</td>
                  <td className="p-2.5 font-mono text-[11px] uppercase">{rl.evaluation_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
