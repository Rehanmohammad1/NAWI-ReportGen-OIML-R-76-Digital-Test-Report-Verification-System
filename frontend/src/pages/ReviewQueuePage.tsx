import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, AlertTriangle, CheckCircle, XCircle, FileText, CheckCircle2, ShieldCheck, Download, ChevronRight, X } from 'lucide-react';

export const ReviewQueuePage: React.FC = () => {
  const { activeLabId } = useAuth();
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
        api.getSessions('under_review', activeLabId),
        api.getSessions(undefined, activeLabId).catch(() => [])
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
  }, [activeLabId]);

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
      <div className="p-12 text-center text-xs font-mono text-[#666059]">
        Loading Review & Approval Register...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
      <div className="pb-2 border-b border-[#E6E2DC]">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
          <span className="w-2 h-2 rounded-full bg-[#D9822B]"></span>
          <span>Technical Audit & Approval Queue</span>
        </div>
        <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
          Review & Authorization Register
        </h1>
        <p className="text-xs text-[#666059] mt-1">
          Pending NAWI evaluation sessions requiring technical review and authorization.
        </p>
      </div>

      {/* Compact Horizontal Status Register Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#FBE3B5] rounded-lg p-4 shadow-2xs bg-[#FFFDF9]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#B86200] block mb-1">Pending Reviews</span>
          <span className="text-2xl font-serif-header font-bold text-[#B86200]">{pendingSessions.length}</span>
        </div>
        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#666059] block mb-1">Returned for Correction</span>
          <span className="text-2xl font-serif-header font-bold text-[#25221F]">{returnedCount}</span>
        </div>
        <div className="bg-white border border-[#BDE3D5] rounded-lg p-4 shadow-2xs bg-[#F7FCFA]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2D5A4B] block mb-1">Approved & Finalized</span>
          <span className="text-2xl font-serif-header font-bold text-[#2D5A4B]">{approvedCount}</span>
        </div>
        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#666059] block mb-1">Total Audited Sessions</span>
          <span className="text-2xl font-serif-header font-bold text-[#25221F]">{totalReviewedCount + pendingSessions.length}</span>
        </div>
      </div>

      {message && (
        <div className="bg-[#EBF5F1] border border-[#BDE3D5] text-[#2D5A4B] p-3.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#3E7B66] flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-[#25221F]/60 hover:text-[#25221F]">✕</button>
        </div>
      )}

      {error && (
        <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#C54B4B] flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#25221F]/60 hover:text-[#25221F]">✕</button>
        </div>
      )}

      {/* Main Review Register Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC] flex items-center justify-between text-xs">
          <h2 className="font-serif-header font-semibold text-[#25221F]">Pending Technical Authorization Queue</h2>
          <span className="text-xs font-mono text-[#666059]">SHOWING {pendingSessions.length} SUBMITTED SESSIONS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Session Reference</th>
                <th className="p-3">Instrument / Model</th>
                <th className="p-3">Serial Number</th>
                <th className="p-3">Laboratory</th>
                <th className="p-3">Inspector</th>
                <th className="p-3">Submitted Date</th>
                <th className="p-3">Compliance Result</th>
                <th className="p-3">Review Status</th>
                <th className="p-3 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {pendingSessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-xs text-[#666059]">
                    No NAWI evaluation sessions currently pending technical review in queue.
                  </td>
                </tr>
              ) : (
                pendingSessions.map(s => (
                  <tr key={s.id} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{s.session_number}</td>
                    <td className="p-3 font-medium text-[#25221F]">{s.model_name}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">{s.serial_number}</td>
                    <td className="p-3 text-[#666059]">{s.lab_name || 'Central Metrology Lab'}</td>
                    <td className="p-3 font-medium text-[#25221F]">{s.inspector_name || 'Staff Inspector'}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">
                      {new Date(s.submitted_at || s.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#EBF5F1] text-[#2D5A4B] border border-[#BDE3D5]">
                        EVALUATED PASS
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-[#FFF8EE] text-[#B86200] border border-[#FBE3B5]">
                        UNDER REVIEW
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right">
                      <button
                        onClick={async () => {
                          const full = await api.getSession(s.id);
                          setSelectedSession(full);
                        }}
                        className="bg-[#C87A57] hover:bg-[#B36846] text-white px-3.5 py-1.5 rounded-md text-xs font-medium transition shadow-xs"
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
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-4xl w-full text-[#25221F] space-y-5 max-h-[92vh] overflow-y-auto shadow-lg">
            {/* Document Header */}
            <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#666059] block">OIML R-76 EVALUATION AUDIT WORKSPACE</span>
                <h3 className="font-serif-header font-semibold text-base text-[#25221F]">
                  Session Reference: {selectedSession.session_number}
                </h3>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-[#666059] hover:text-[#25221F] text-xs font-medium flex items-center gap-1">
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            {/* Numbered Sections */}
            <div className="space-y-4 text-xs">
              {/* 01 — INSTRUMENT DETAILS */}
              <div className="bg-[#FAF6F0]/60 border border-[#E6E2DC] p-4 rounded-md space-y-2">
                <h4 className="font-serif-header text-xs font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-1">
                  01 — INSTRUMENT DETAILS
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[#666059] block text-[11px]">Model Designation:</span>
                    <span className="font-semibold text-[#25221F]">{selectedSession.model_name}</span>
                  </div>
                  <div>
                    <span className="text-[#666059] block text-[11px]">Serial Number:</span>
                    <span className="font-mono font-semibold text-[#25221F]">{selectedSession.serial_number}</span>
                  </div>
                  <div>
                    <span className="text-[#666059] block text-[11px]">Accuracy Class:</span>
                    <span className="font-mono font-semibold text-[#25221F]">Class {selectedSession.accuracy_class}</span>
                  </div>
                  <div>
                    <span className="text-[#666059] block text-[11px]">Capacity (Max / e):</span>
                    <span className="font-mono font-semibold text-[#25221F]">{selectedSession.max_capacity} kg / {selectedSession.e} kg</span>
                  </div>
                </div>
              </div>

              {/* 02 — TEST SUMMARY & 03 — OBSERVATIONS */}
              <div className="bg-[#FAF6F0]/60 border border-[#E6E2DC] p-4 rounded-md space-y-2">
                <h4 className="font-serif-header text-xs font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-1">
                  02 & 03 — TEST PROCEDURES & OBSERVATIONS SUMMARY
                </h4>
                <p className="text-xs text-[#666059]">
                  Tested under prescribed OIML R-76 clauses. Ambient temperature: {selectedSession.environmental_conditions?.temp_c || 20.5}°C &nbsp;&bull;&nbsp; RH: {selectedSession.environmental_conditions?.humidity_pct || 55}% &nbsp;&bull;&nbsp; Barometric Pressure: {selectedSession.environmental_conditions?.pressure_hpa || 1013.25} hPa.
                </p>
              </div>

              {/* 04 — CALCULATED RESULTS & 05 — COMPLIANCE DECISIONS */}
              <div className="bg-white border border-[#E6E2DC] p-4 rounded-md space-y-3">
                <h4 className="font-serif-header text-xs font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-1">
                  04 & 05 — EVALUATED COMPLIANCE VERIFICATION REGISTER
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF6F0] text-[#666059] font-mono text-[10px] uppercase font-semibold border-b border-[#E6E2DC]">
                      <tr>
                        <th className="p-2.5">Procedure</th>
                        <th className="p-2.5">Measured Error</th>
                        <th className="p-2.5">Applied MPE Limit</th>
                        <th className="p-2.5">Margin (±e)</th>
                        <th className="p-2.5">Compliance</th>
                        <th className="p-2.5">OIML Clause Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2DC] text-[#25221F] font-mono text-[11px]">
                      {selectedSession.compliance_results?.map((c: any) => (
                        <tr key={c.id}>
                          <td className="p-2.5 font-semibold">{c.test_procedure_code}</td>
                          <td className="p-2.5">{c.measured_value.toFixed(3)} e</td>
                          <td className="p-2.5">{c.limit_applied}</td>
                          <td className="p-2.5 font-semibold">{c.margin > 0 ? `+${c.margin.toFixed(3)}` : c.margin.toFixed(3)} e</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.pass_fail === 'PASS' ? 'bg-[#EBF5F1] text-[#2D5A4B] border-[#BDE3D5]' : 'bg-[#FFF5F5] text-[#9B2C2C] border-[#F5C6C6]'}`}>
                              {c.pass_fail}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#666059] text-[10px]">{c.explanation_text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 06 — SUPPORTING EVIDENCE & 07 — REPORT INFORMATION */}
              <div className="bg-[#FAF6F0]/60 border border-[#E6E2DC] p-4 rounded-md space-y-2">
                <h4 className="font-serif-header text-xs font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-1">
                  06 & 07 — LABORATORY EVIDENCE & REPORT AUDIT TRAIL
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#666059] block text-[11px]">Submitting Inspector:</span>
                    <span className="font-semibold text-[#25221F]">{selectedSession.inspector_name || 'Staff Inspector'}</span>
                  </div>
                  <div>
                    <span className="text-[#666059] block text-[11px]">Issuing Laboratory:</span>
                    <span className="font-semibold text-[#25221F]">{selectedSession.lab_name || 'Central Legal Metrology Lab'}</span>
                  </div>
                </div>
              </div>

              {/* REVIEW DECISION AREA */}
              <div className="border-t border-[#E6E2DC] pt-4 space-y-3">
                <h4 className="font-serif-header text-xs font-semibold uppercase text-[#25221F]">Review Decision & Authorization</h4>
                <div>
                  <label className="block text-xs font-medium text-[#25221F] mb-1.5">
                    Reviewer Remarks / Technical Certification Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md p-2.5 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleReviewAction('rejected')}
                    className="bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#9B2C2C] border border-[#F5C6C6] font-medium px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 transition"
                  >
                    <XCircle className="w-4 h-4 text-[#C54B4B]" />
                    <span>RETURN FOR CORRECTION</span>
                  </button>
                  <button
                    onClick={() => handleReviewAction('approved')}
                    className="bg-[#C87A57] hover:bg-[#B36846] text-white font-medium px-5 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
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

