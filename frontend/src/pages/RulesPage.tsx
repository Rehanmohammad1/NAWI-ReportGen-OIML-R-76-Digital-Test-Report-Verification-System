import React, { useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../services/api';
import type { RuleLimit } from '../types';
import { ShieldAlert, Layers, AlertCircle, RefreshCw, Scale, BookOpen } from 'lucide-react';

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
      <div className="p-12 text-center text-xs font-mono text-[#666059] bg-white border border-[#E6E2DC] rounded-lg max-w-7xl mx-auto">
        Loading OIML Rule Engine configuration...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
      <div className="pb-2 border-b border-[#E6E2DC]">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#C87A57]"></span>
          <span>Regulatory Calculation Standards</span>
        </div>
        <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
          Versioned Rule Engine (OIML R-76)
        </h1>
        <p className="text-xs text-[#666059] mt-1">
          Decoupled regulatory rule engine storing MPE tables and scale interval bands as versioned database configuration.
        </p>
      </div>

      {/* Error Notice if API failed */}
      {errorMsg && (
        <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-4 rounded-lg text-xs space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-[#C54B4B]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>OIML RULE ENGINE DATA FETCH FAILURE</span>
          </div>
          <p>{errorMsg}</p>
          <button
            onClick={fetchRulesData}
            className="bg-[#C54B4B] hover:bg-[#A83D3D] text-white font-medium px-3 py-1.5 rounded-md transition inline-flex items-center space-x-1.5 mt-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading Rules</span>
          </button>
        </div>
      )}

      {/* Regulatory Constraint Warning Banner */}
      <div className="bg-[#FAF6F0] border border-[#E6E2DC] text-[#25221F] p-4 rounded-lg text-xs space-y-1.5 shadow-2xs">
        <div className="flex items-center space-x-2 font-semibold text-[#C87A57]">
          <ShieldAlert className="w-4 h-4 text-[#C87A57] flex-shrink-0" />
          <span>Regulatory Compliance Status & Data Provenance</span>
        </div>
        <p className="leading-relaxed text-[#666059]">
          Active rule limits in this installation are tagged with status:{' '}
          <span className="font-mono bg-white text-[#25221F] px-2.5 py-0.5 rounded border border-[#E6E2DC] font-semibold inline-block">
            REQUIRES VERIFICATION AGAINST APPLICABLE OIML R-76 EDITION
          </span>
        </p>
      </div>

      {/* Active Rule Versions & Data Provenance */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg p-5 space-y-4 shadow-2xs">
        <h2 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#C87A57]" />
          <span>Official Regulatory Data Source & Provenance</span>
        </h2>
        {versions.length === 0 ? (
          <p className="text-xs text-[#666059] py-2">No active rule versions found in configuration database.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {versions.map(v => {
              const versionCode = v.version_code || v.edition_label || v.standard || `VERSION-${v.id}`;
              const statusLabel = v.status ? String(v.status).toUpperCase() : (v.is_active ? 'ACTIVE' : 'INACTIVE');
              const descriptionText = v.description || `Official Legal Metrology Regulatory Rule Version for ${v.standard || 'OIML R-76'}`;
              const citationText = v.source_citation || v.source_document || 'OIML Recommendation R 76-1 (2006 E)';
              return (
                <div key={v.id} className="bg-[#FAF6F0]/60 border border-[#E6E2DC] p-4 rounded-md space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif-header text-sm font-semibold text-[#25221F]">{versionCode}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EBF5F1] text-[#2D5A4B] border border-[#BDE3D5] font-mono font-semibold">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#666059]">{descriptionText}</p>
                  <p className="text-[11px] text-[#666059]/80 pt-1 font-mono">Source: {citationText}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MPE Table Configuration Register */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC]">
          <h2 className="text-sm font-semibold font-serif-header text-[#25221F]">Maximum Permissible Error (MPE) Limits Register</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Rule Code</th>
                <th className="p-3">Accuracy Class</th>
                <th className="p-3">Load Range (m in e)</th>
                <th className="p-3">Initial MPE (±e)</th>
                <th className="p-3">In-Service MPE (±e)</th>
                <th className="p-3 pr-5">Evaluation Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {limits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#666059]">
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
                    <tr key={rl.id} className="hover:bg-[#FAF6F0]/60 transition">
                      <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{ruleCode}</td>
                      <td className="p-3 font-mono font-medium">Class {rl.accuracy_class}</td>
                      <td className="p-3 font-mono text-[11px] text-[#666059]">
                        {minLoad} e ≤ m ≤ {maxLoad} e
                      </td>
                      <td className="p-3 font-mono font-semibold text-[#25221F]">±{mpeInitial} e</td>
                      <td className="p-3 font-mono text-[#666059]">±{mpeInservice} e</td>
                      <td className="p-3 pr-5 font-mono text-[11px] text-[#666059] uppercase">{evalType}</td>
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

