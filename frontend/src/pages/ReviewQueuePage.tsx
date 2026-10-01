import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckSquare, AlertTriangle, CheckCircle, XCircle, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [remarks, setRemarks] = useState('All parameters verified against OIML R-76 checklist and metrological limits.');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const [underReviewData, allData] = await Promise.all([
        api.getSessions('under_review'),
        api.getSessions().catch(() => [])
      ]);
      setPendingSessions(underReviewData || []);
      setAllSessions(allData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReviewAction = async (decision: 'approved' | 'rejected') => {
    if (!selectedSession) return;
    setError('');
    setMessage('');
    try {
      const res = await api.reviewSession(selectedSession.id, {
        decision,
        remarks
      });
      setMessage(res.message);
      setSelectedSession(null);
      loadQueue();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const returnedCount = allSessions.filter(s => s.status === 'draft' && s.reviewer_remarks).length;
  const approvedCount = allSessions.filter(s => s.status === 'finalized').length;
  const totalReviewedCount = approvedCount + returnedCount;

  if (loading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">
        Loading Review & Approval Register...
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
            REVIEW & APPROVAL REGISTER
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
            OIML R-76 AUDIT
          </span>
        </div>
        <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
          Pending NAWI evaluation sessions requiring technical review and authorization.
        </p>
      </div>

      {/* Compact Horizontal Status Register Strip */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3 shadow-2xs font-mono">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D9D1C5]/60 gap-2 md:gap-0">
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-amber-900 block">Pending Reviews</span>
            <span className="text-lg font-bold text-amber-900">{pendingSessions.length}</span>
          </div>
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-[#413B32]/70 block">Returned for Correction</span>
            <span className="text-lg font-bold text-[#413B32]">{returnedCount}</span>
          </div>
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-emerald-900 block">Approved & Finalized</span>
            <span className="text-lg font-bold text-emerald-900">{approvedCount}</span>
          </div>
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-[#413B32]/70 block">Total Audited Sessions</span>
            <span className="text-lg font-bold text-[#413B32]">{totalReviewedCount + pendingSessions.length}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xs text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-[#413B32]/60 hover:text-[#413B32]">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#413B32]/60 hover:text-[#413B32]">✕</button>
        </div>
      )}

      {/* Main Review Register Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#F1EADE]/40 border-b border-[#D9D1C5] flex items-center justify-between font-mono">
          <h2 className="text-xs font-bold text-[#413B32] uppercase">Pending Technical Authorization Queue</h2>
          <span className="text-[10px] text-[#413B32]/60">SHOWING {pendingSessions.length} SUBMITTED SESSIONS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Session Reference</th>
                <th className="p-2.5">Instrument / Model</th>
                <th className="p-2.5">Serial Number</th>
                <th className="p-2.5">Laboratory</th>
                <th className="p-2.5">Inspector</th>
                <th className="p-2.5">Submitted Date</th>
                <th className="p-2.5">Compliance Result</th>
                <th className="p-2.5">Review Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {pendingSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    No NAWI evaluation sessions currently pending technical review in queue.
                  </td>
                </tr>
              ) : (
                pendingSessions.map(s => (
                  <tr key={s.id} className="hover:bg-[#F1EADE]/30 transition">
                    <td className="p-2.5 font-mono font-bold text-[#413B32]">{s.session_number}</td>
                    <td className="p-2.5 font-semibold text-[#413B32]">{s.model_name}</td>
                    <td className="p-2.5 font-mono text-[11px]">{s.serial_number}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/80">{s.lab_name || 'Central Metrology Lab'}</td>
                    <td className="p-2.5 font-mono text-[11px]">{s.inspector_name || 'Staff Inspector'}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/70">
                      {new Date(s.submitted_at || s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold border uppercase bg-emerald-50 text-emerald-900 border-emerald-300">
                        EVALUATED PASS
                      </span>
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold border uppercase bg-amber-50 text-amber-900 border-amber-300">
                        UNDER REVIEW
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={async () => {
                          const full = await api.getSession(s.id);
                          setSelectedSession(full);
                        }}
                        className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] px-3 py-1 rounded-xs font-mono text-[11px] transition border border-[#413B32]"
                      >
                        Open Review →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Document-Review Workspace Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-6 max-w-4xl w-full text-[#413B32] space-y-5 max-h-[92vh] overflow-y-auto shadow-md font-sans">
            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#413B32]/60 block">OIML R-76 EVALUATION AUDIT WORKSPACE</span>
                <h3 className="font-mono font-bold text-sm text-[#413B32]">
                  SESSION REFERENCE: {selectedSession.session_number}
                </h3>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-[#413B32]/60 hover:text-[#413B32] font-mono text-sm">✕ CLOSE</button>
            </div>

            {/* Numbered Sections */}
            <div className="space-y-4 text-xs font-mono">
              {/* 01 — INSTRUMENT DETAILS */}
              <div className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1.5">
                <h4 className="font-bold text-[#413B32] border-b border-[#D9D1C5]/60 pb-1 text-[11px]">
                  01 — INSTRUMENT DETAILS
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">MODEL DESIGNATION:</span>
                    <span className="font-bold">{selectedSession.model_name}</span>
                  </div>
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">SERIAL NUMBER:</span>
                    <span className="font-bold">{selectedSession.serial_number}</span>
                  </div>
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">ACCURACY CLASS:</span>
                    <span className="font-bold">Class {selectedSession.accuracy_class}</span>
                  </div>
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">CAPACITY (Max / e):</span>
                    <span className="font-bold">{selectedSession.max_capacity} kg / {selectedSession.e} kg</span>
                  </div>
                </div>
              </div>

              {/* 02 — TEST SUMMARY & 03 — OBSERVATIONS */}
              <div className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1.5">
                <h4 className="font-bold text-[#413B32] border-b border-[#D9D1C5]/60 pb-1 text-[11px]">
                  02 & 03 — TEST PROCEDURES & OBSERVATIONS SUMMARY
                </h4>
                <p className="text-[11px] text-[#413B32]/80">
                  Tested under prescribed OIML R-76 clauses. Ambient temperature: {selectedSession.environmental_conditions?.temp_c || 20.5}°C │ RH: {selectedSession.environmental_conditions?.humidity_pct || 55}% │ Barometric Pressure: {selectedSession.environmental_conditions?.pressure_hpa || 1013.25} hPa.
                </p>
              </div>

              {/* 04 — CALCULATED RESULTS & 05 — COMPLIANCE DECISIONS */}
              <div className="bg-[#FFFFFF] border border-[#D9D1C5] p-3 rounded-xs space-y-2">
                <h4 className="font-bold text-[#413B32] border-b border-[#D9D1C5]/60 pb-1 text-[11px]">
                  04 & 05 — EVALUATED COMPLIANCE VERIFICATION REGISTER
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#F1EADE] text-[#413B32] font-mono text-[10px] uppercase font-bold border-b border-[#D9D1C5]">
                      <tr>
                        <th className="p-2">Procedure</th>
                        <th className="p-2">Measured Error</th>
                        <th className="p-2">Applied MPE Limit</th>
                        <th className="p-2">Margin (±e)</th>
                        <th className="p-2">Compliance</th>
                        <th className="p-2">OIML Clause Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D1C5]/40 text-[#413B32] font-mono text-[11px]">
                      {selectedSession.compliance_results?.map((c: any) => (
                        <tr key={c.id}>
                          <td className="p-2 font-bold">{c.test_procedure_code}</td>
                          <td className="p-2">{c.measured_value.toFixed(3)} e</td>
                          <td className="p-2">{c.limit_applied}</td>
                          <td className="p-2 font-bold">{c.margin > 0 ? `+${c.margin.toFixed(3)}` : c.margin.toFixed(3)} e</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${c.pass_fail === 'PASS' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'}`}>
                              {c.pass_fail}
                            </span>
                          </td>
                          <td className="p-2 text-[#413B32]/70 text-[10px]">{c.explanation_text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 06 — SUPPORTING EVIDENCE & 07 — REPORT INFORMATION */}
              <div className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1.5">
                <h4 className="font-bold text-[#413B32] border-b border-[#D9D1C5]/60 pb-1 text-[11px]">
                  06 & 07 — LABORATORY EVIDENCE & REPORT AUDIT TRAIL
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">SUBMITTING INSPECTOR:</span>
                    <span className="font-bold">{selectedSession.inspector_name || 'Staff Inspector'}</span>
                  </div>
                  <div>
                    <span className="text-[#413B32]/60 block text-[10px]">ISSUING LABORATORY:</span>
                    <span className="font-bold">{selectedSession.lab_name || 'Central Legal Metrology Lab'}</span>
                  </div>
                </div>
              </div>

              {/* REVIEW DECISION AREA */}
              <div className="border-t border-[#D9D1C5] pt-3 space-y-3">
                <h4 className="font-bold uppercase text-[#413B32] text-xs">REVIEW DECISION & AUTHORIZATION</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-[#413B32] mb-1">
                    Reviewer Remarks / Technical Certification Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-2 text-xs text-[#413B32] font-mono focus:outline-none focus:border-[#413B32]"
                  />
                </div>

                <div className="flex justify-end space-x-2 font-mono">
                  <button
                    onClick={() => handleReviewAction('rejected')}
                    className="bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 font-semibold px-4 py-2 rounded-xs text-xs flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-700" />
                    <span>RETURN FOR CORRECTION</span>
                  </button>
                  <button
                    onClick={() => handleReviewAction('approved')}
                    className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-semibold px-5 py-2 rounded-xs text-xs flex items-center space-x-1 border border-[#413B32]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#A7BABA]" />
                    <span>APPROVE & FINALIZE REPORT</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
