import React, { useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../services/api';
import type { RuleLimit } from '../types';
import { ShieldAlert, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export const RulesPage: React.FC = () => {
  const [limits, setLimits] = useState<RuleLimit[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRulesData = () => {
    setLoading(true);
    setErrorMsg(null);
    Promise.all([api.getRuleVersions(), api.getRuleLimits()])
      .then(([vData, lData]) => {
        setVersions(Array.isArray(vData) ? vData : []);
        setLimits(Array.isArray(lData) ? lData : []);
      })
      .catch((err: any) => {
        const msg = extractErrorMessage(err, 'Failed to load OIML rule engine data');
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRulesData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#413B32]/70 bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm max-w-7xl mx-auto">
        Loading OIML Rule Engine configuration...
      </div>
    );
  }

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

      {/* Error Notice if API failed */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-xs text-xs space-y-2 font-mono">
          <div className="flex items-center space-x-2 font-bold text-red-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>OIML RULE ENGINE DATA FETCH FAILURE</span>
          </div>
          <p>{errorMsg}</p>
          <button
            onClick={fetchRulesData}
            className="bg-red-800 hover:bg-red-900 text-white font-bold px-3 py-1 rounded-xs transition inline-flex items-center space-x-1 mt-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Loading Rules</span>
          </button>
        </div>
      )}

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
        {versions.length === 0 ? (
          <p className="text-xs font-mono text-[#413B32]/60 py-2">No active rule versions found in configuration database.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            {versions.map(v => {
              const versionCode = v.version_code || v.edition_label || v.standard || `VERSION-${v.id}`;
              const statusLabel = v.status ? String(v.status).toUpperCase() : (v.is_active ? 'ACTIVE' : 'INACTIVE');
              const descriptionText = v.description || `Official Legal Metrology Regulatory Rule Version for ${v.standard || 'OIML R-76'}`;
              const citationText = v.source_citation || v.source_document || 'OIML Recommendation R 76-1 (2006 E)';
              return (
                <div key={v.id} className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#413B32]">{versionCode}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-xs bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#413B32]/80">{descriptionText}</p>
                  <p className="text-[10px] text-[#413B32]/60 pt-1">Source: {citationText}</p>
                </div>
              );
            })}
          </div>
        )}
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
              {limits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    No OIML rule limits available in database configuration.
                  </td>
                </tr>
              ) : (
                limits.map((rl) => {
                  const ruleCode = rl.rule_code || rl.test_procedure_code || `RULE-${rl.id}`;
                  const minLoad = rl.min_load_e ?? rl.load_band_min_e ?? 0;
                  const maxLoad = rl.max_load_e ?? rl.load_band_max_e ?? 0;
                  const mpeInitial = rl.mpe_initial_e ?? rl.mpe_type_eval_e ?? 0;
                  const mpeInservice = rl.mpe_inservice_e ?? rl.mpe_working_e ?? 0;
                  const evalType = (rl.evaluation_type || rl.formula_ref || 'Standard MPE').toString();
                  return (
                    <tr key={rl.id} className="hover:bg-[#F1EADE]/30 transition">
                      <td className="p-2.5 font-mono font-bold text-[#413B32]">{ruleCode}</td>
                      <td className="p-2.5 font-mono">Class {rl.accuracy_class}</td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {minLoad} e ≤ m ≤ {maxLoad} e
                      </td>
                      <td className="p-2.5 font-mono font-bold">±{mpeInitial} e</td>
                      <td className="p-2.5 font-mono">±{mpeInservice} e</td>
                      <td className="p-2.5 font-mono text-[11px] uppercase">{evalType}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
