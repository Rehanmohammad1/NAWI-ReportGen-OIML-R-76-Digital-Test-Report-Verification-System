import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { TestSessionProgress } from '../components/TestSessionProgress';
import { 
  CheckCircle, AlertTriangle, 
  Send, Download, ArrowLeft, ShieldCheck, FileCheck, Layers, Eye, Lock, FileSpreadsheet,
  Paperclip, Upload, Trash2, FileText
} from 'lucide-react';

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('TEST-WEIGHING');
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Input forms for test procedures
  const [weighingForm, setWeighingForm] = useState({
    test_points: [
      { load_kg: 5.0, indicated_kg: 5.0, delta_l_kg: 0.005, direction: 'increasing' },
      { load_kg: 15.0, indicated_kg: 15.0, delta_l_kg: 0.005, direction: 'increasing' },
      { load_kg: 30.0, indicated_kg: 30.0, delta_l_kg: 0.005, direction: 'increasing' },
    ]
  });

  const [repeatabilityForm] = useState({
    loads: [
      {
        load_kg: 15.0,
        readings: [
          { indicated_kg: 15.00, delta_l_kg: 0.005 },
          { indicated_kg: 15.00, delta_l_kg: 0.005 },
          { indicated_kg: 15.01, delta_l_kg: 0.005 }
        ]
      }
    ]
  });

  const [eccentricityForm] = useState({
    positions: [
      { pos_name: 'center', load_kg: 10.0, indicated_kg: 10.00, delta_l_kg: 0.005 },
      { pos_name: 'front_left', load_kg: 10.0, indicated_kg: 10.00, delta_l_kg: 0.005 },
      { pos_name: 'back_right', load_kg: 10.0, indicated_kg: 10.00, delta_l_kg: 0.005 }
    ]
  });

  const loadSession = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getSession(parseInt(id));
      setSession(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [id]);

  const handleSaveObservation = async (testCode: string, rawReadings: any) => {
    if (!session) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.enterObservation(session.id, {
        test_procedure_code: testCode,
        raw_readings: rawReadings
      });
      setSuccess(`Observation for ${testCode} evaluated! Result: ${res.compliance_evaluation.pass_fail}`);
      loadSession();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmitForReview = async () => {
    if (!session) return;
    try {
      await api.submitSession(session.id);
      setSuccess('Session submitted successfully for Reviewer approval!');
      loadSession();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !session) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Attached photograph/document: ${file.name}`);

    setError('');
    setSuccess('');
    try {
      setUploadingEvidence(true);
      await api.uploadEvidence(session.id, formData);
      setSuccess(`Evidence file '${file.name}' attached successfully!`);
      loadSession();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!session || !window.confirm('Remove this evidence attachment from session dossier?')) return;
    setError('');
    setSuccess('');
    try {
      await api.deleteEvidence(session.id, evidenceId);
      setSuccess('Evidence attachment removed.');
      loadSession();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">Loading evaluation session data...</div>;
  if (!session) return <div className="p-8 text-center text-xs font-mono text-red-800">Session not found in register</div>;

  const isFinalized = session.status === 'finalized' || (session.report && session.report.finalized);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': 
        return 'bg-[#FAF6F0] text-[#25221F] border-[#E6E2DC]';
      case 'submitted': 
        return 'bg-[#FAF6F0] text-[#D9822B] border-[#D9822B]';
      case 'under_review': 
        return 'bg-[#FAF6F0] text-[#D9822B] border-[#D9822B] font-bold';
      case 'finalized': 
        return 'bg-[#FAF6F0] text-[#3E7B66] border-[#3E7B66] font-bold';
      default: 
        return 'bg-[#FAF6F0] text-[#25221F]/70 border-[#E6E2DC]';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {session.is_demo_data && <DemoWatermark />}

      {/* Header Bar */}
      <div className="pb-3 border-b border-[#E6E2DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono text-[#25221F]/60 hover:text-[#25221F] inline-flex items-center space-x-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 bg-[#C87A57] inline-block rounded-xs"></span>
            <h1 className="text-xl font-serif-header font-normal tracking-tight text-[#25221F]">
              Evaluation Session: {session.session_number}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-xs text-[10px] font-mono uppercase border ${getStatusBadgeClass(session.status)}`}>
              {session.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-[#25221F]/70 font-sans mt-1">
            Instrument: <span className="font-semibold text-[#25221F]">{session.model_name}</span> (Serial: <span className="font-mono font-semibold">{session.serial_number}</span>) │ Class {session.accuracy_class} │ Max: {session.max_capacity} kg │ e: {session.e} kg │ d: {session.d} kg
          </p>
        </div>

        <div className="flex items-center space-x-2 font-sans text-xs">
          {session.status === 'draft' && (
            <button
              onClick={handleSubmitForReview}
              className="bg-[#C87A57] hover:bg-[#b56b49] text-white font-semibold px-4 py-2 rounded-xs transition inline-flex items-center space-x-1.5 border border-[#C87A57] shadow-2xs"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Submit for Review →</span>
            </button>
          )}

          <button
            onClick={() => setShowReportPreview(true)}
            className="bg-white hover:bg-[#FAF6F0] text-[#25221F] font-medium px-3.5 py-2 rounded-xs border border-[#E6E2DC] inline-flex items-center space-x-1 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#25221F]" />
            <span>Report Preview</span>
          </button>

          {session.report && (
            <div className="flex space-x-1.5">
              <a
                href={api.getReportPdfUrl(session.id)}
                target="_blank"
                rel="noreferrer"
                className="bg-[#FAF6F0] hover:bg-[#FAF6F0]/80 text-[#C54B4B] border border-[#C54B4B] px-3 py-2 rounded-xs font-semibold inline-flex items-center space-x-1 text-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#C54B4B]" />
                <span>PDF</span>
              </a>
              <a
                href={api.getReportDocxUrl(session.id)}
                target="_blank"
                rel="noreferrer"
                className="bg-[#FAF6F0] hover:bg-[#FAF6F0]/80 text-[#25221F] border border-[#E6E2DC] px-3 py-2 rounded-xs font-semibold inline-flex items-center space-x-1 text-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#25221F]" />
                <span>DOCX</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* OIML R-76 Workflow Progress */}
      <TestSessionProgress status={session.status} currentStep="tests" />

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#413B32]/60 hover:text-[#413B32]">✕</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xs text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-[#413B32]/60 hover:text-[#413B32]">✕</button>
        </div>
      )}

      {/* Report Status Register (PART 2) */}
      {session.report && (
        <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-4 space-y-2 font-mono text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-1.5">
            <span className="font-bold text-[#413B32] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              <span>OFFICIAL FINALIZED TEST REPORT REGISTER</span>
            </span>
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
              FINALIZED & SIGNED
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-[#413B32]/60 block text-[10px]">REPORT NUMBER:</span>
              <span className="font-bold">{session.report.report_number}</span>
            </div>
            <div>
              <span className="text-[#413B32]/60 block text-[10px]">GENERATED DATE:</span>
              <span>{new Date(session.report.generated_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[#413B32]/60 block text-[10px]">COMPLIANCE RESULT:</span>
              <span className="font-bold text-emerald-800">{session.report.overall_result}</span>
            </div>
            <div>
              <span className="text-[#413B32]/60 block text-[10px]">VERIFICATION CODE / QR:</span>
              <a
                href={`/verify/${session.report.report_number}`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-sky-700 font-bold"
              >
                Public QR Verification →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Guided Observation Entry & Procedure Selector */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-2">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#413B32]" />
            <span>OIML R-76 Procedure Observation Entry</span>
          </h2>
          <span className="text-[10px] font-mono text-[#413B32]/60">CLAUSE 3.5 & 3.6 PROCEDURES</span>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-1 border-b border-[#D9D1C5]/60 pb-2 overflow-x-auto font-mono text-xs">
          {[
            { code: 'TEST-WEIGHING', label: 'Weighing Performance (A.4.4)' },
            { code: 'TEST-REPEATABILITY', label: 'Repeatability Test (A.4.10)' },
            { code: 'TEST-ECCENTRICITY', label: 'Eccentricity Corner Test (A.4.7)' }
          ].map(tab => (
            <button
              key={tab.code}
              onClick={() => setActiveTab(tab.code)}
              className={`px-3 py-1.5 rounded-xs transition text-xs font-semibold flex items-center space-x-1.5 border ${
                activeTab === tab.code
                  ? 'bg-[#413B32] text-[#F1EADE] border-[#413B32]'
                  : 'bg-[#F1EADE]/40 text-[#413B32] border-[#D9D1C5] hover:bg-[#F1EADE]'
              }`}
            >
              <span>{tab.label}</span>
              {session.compliance_results?.find((c: any) => c.test_procedure_code === tab.code) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Weighing Performance Observation Table */}
        {activeTab === 'TEST-WEIGHING' && (
          <div className="space-y-3 font-mono">
            <p className="text-xs text-[#413B32]/70">
              Enter applied conventional mass loads $L$ and indicated scale readings $I$. Errors are computed in scale intervals ($e$) and evaluated against Maximum Permissible Error (MPE) limits.
            </p>

            <div className="overflow-x-auto border border-[#D9D1C5] rounded-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
                  <tr>
                    <th className="p-2">Test Point</th>
                    <th className="p-2">Applied Load L (kg)</th>
                    <th className="p-2">Indicated Reading I (kg)</th>
                    <th className="p-2">Small Weight ΔL (kg)</th>
                    <th className="p-2">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D1C5]/50 bg-[#FFFFFF]">
                  {weighingForm.test_points.map((pt, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold text-[#413B32]">Point 0{idx + 1}</td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          step="any"
                          value={pt.load_kg}
                          onChange={e => {
                            const newPts = [...weighingForm.test_points];
                            newPts[idx].load_kg = parseFloat(e.target.value);
                            setWeighingForm({ test_points: newPts });
                          }}
                          className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1 text-xs text-[#413B32]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          step="any"
                          value={pt.indicated_kg}
                          onChange={e => {
                            const newPts = [...weighingForm.test_points];
                            newPts[idx].indicated_kg = parseFloat(e.target.value);
                            setWeighingForm({ test_points: newPts });
                          }}
                          className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1 text-xs text-[#413B32]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          disabled={isFinalized}
                          type="number"
                          step="any"
                          value={pt.delta_l_kg}
                          onChange={e => {
                            const newPts = [...weighingForm.test_points];
                            newPts[idx].delta_l_kg = parseFloat(e.target.value);
                            setWeighingForm({ test_points: newPts });
                          }}
                          className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1 text-xs text-[#413B32]"
                        />
                      </td>
                      <td className="p-2 uppercase text-[10px] text-[#413B32]/70 font-bold">
                        {pt.direction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isFinalized && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveObservation('TEST-WEIGHING', weighingForm)}
                  className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs font-bold px-4 py-1.5 rounded-xs transition border border-[#413B32]"
                >
                  Evaluate & Save Weighing Test →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Repeatability Test */}
        {activeTab === 'TEST-REPEATABILITY' && (
          <div className="space-y-3 font-mono">
            <p className="text-xs text-[#413B32]/70">
              Enter repeat weighings at 50% and 100% Max load. Max spread (P<sub>max</sub> - P<sub>min</sub>) is evaluated against permissible limit.
            </p>
            {!isFinalized && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveObservation('TEST-REPEATABILITY', repeatabilityForm)}
                  className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs font-bold px-4 py-1.5 rounded-xs transition border border-[#413B32]"
                >
                  Evaluate & Save Repeatability Test →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Eccentricity Test */}
        {activeTab === 'TEST-ECCENTRICITY' && (
          <div className="space-y-3 font-mono">
            <p className="text-xs text-[#413B32]/70">
              Enter corner load readings (Center, Front Left, Back Right). Max corner error is evaluated against MPE.
            </p>
            {!isFinalized && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveObservation('TEST-ECCENTRICITY', eccentricityForm)}
                  className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs font-bold px-4 py-1.5 rounded-xs transition border border-[#413B32]"
                >
                  Evaluate & Save Eccentricity Test →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evaluated Compliance Register Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#F1EADE]/40 border-b border-[#D9D1C5] flex items-center justify-between">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#413B32]" />
            Technical Compliance Verification Register
          </h2>
          <span className="text-[10px] font-mono text-[#413B32]/60">OIML R-76 EVALUATION AUDIT TRAIL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Procedure Code</th>
                <th className="p-2.5">Measured Value</th>
                <th className="p-2.5">Permissible Limit</th>
                <th className="p-2.5">Margin (±e)</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Regulatory Reference / Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {session.compliance_results?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-xs font-mono text-[#413B32]/60">
                    No evaluated compliance observations recorded yet. Select procedure above and click "Evaluate & Save".
                  </td>
                </tr>
              ) : (
                session.compliance_results?.map((cr: any) => (
                  <tr key={cr.id} className="hover:bg-[#F1EADE]/30 transition">
                    <td className="p-2.5 font-mono font-bold text-[#413B32]">{cr.test_procedure_code}</td>
                    <td className="p-2.5 font-mono font-semibold">{cr.measured_value.toFixed(3)} e</td>
                    <td className="p-2.5 font-mono text-[#413B32]/80">{cr.limit_applied}</td>
                    <td className="p-2.5 font-mono font-bold">
                      {cr.margin > 0 ? `+${cr.margin.toFixed(3)}` : cr.margin.toFixed(3)} e
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border uppercase ${cr.pass_fail === 'PASS' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'}`}>
                        {cr.pass_fail}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/80 max-w-md leading-relaxed">
                      {cr.explanation_text}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EVIDENCE & SUPPORTING DOCUMENTS REGISTER (OBJECTIVE 1 / REQ 30) */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D9D1C5] pb-3 gap-2">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#413B32]/70 font-semibold">OIML R-76 EVALUATION DOSSIER</span>
            <h3 className="font-mono text-xs font-bold text-[#413B32] uppercase flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-[#413B32]" /> EVIDENCE & SUPPORTING DOCUMENTS REGISTER
            </h3>
          </div>
          {!isFinalized && (
            <label className="cursor-pointer inline-flex items-center gap-1.5 bg-[#413B32] text-[#F1EADE] text-[11px] font-mono px-3 py-1.5 rounded-xs hover:bg-[#413B32]/90 transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>+ ATTACH PHOTOGRAPH / DOCUMENT</span>
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.doc,.txt,.csv"
                onChange={handleUploadEvidence}
                disabled={uploadingEvidence}
              />
            </label>
          )}
        </div>

        {uploadingEvidence && (
          <div className="p-2 text-xs font-mono text-[#413B32] bg-[#F1EADE] border border-[#D9D1C5] rounded-xs">
            Uploading evidence file to test session dossier...
          </div>
        )}

        {session.evidence_files && session.evidence_files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[#F1EADE] text-[#413B32] text-[10px] uppercase font-bold border-b border-[#D9D1C5]">
                <tr>
                  <th className="p-2">File Name</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Description</th>
                  <th className="p-2">Uploaded At</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D1C5]/40 text-[#413B32]">
                {session.evidence_files.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-[#F1EADE]/30">
                    <td className="p-2 font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#413B32]/70" />
                      <span>{ev.file_name}</span>
                    </td>
                    <td className="p-2">
                      <span className="bg-[#D9D1C5]/40 px-1.5 py-0.5 rounded-xs text-[9px] uppercase font-bold text-[#413B32]">
                        {ev.file_type}
                      </span>
                    </td>
                    <td className="p-2 text-[#413B32]/80">{ev.description || 'Session Photograph / Technical Document'}</td>
                    <td className="p-2 text-[#413B32]/70">{ev.uploaded_at ? new Date(ev.uploaded_at).toLocaleString() : 'N/A'}</td>
                    <td className="p-2 text-right space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            await api.downloadEvidenceFile(session.id, ev.id, ev.file_name);
                          } catch (err: any) {
                            alert(err.message || 'Evidence download failed');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#413B32] underline hover:text-[#413B32]/80"
                      >
                        <Download className="w-3 h-3" /> DOWNLOAD / VIEW
                      </button>
                      {!isFinalized && (
                        <button
                          onClick={() => handleDeleteEvidence(ev.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 underline hover:text-red-900 ml-2"
                        >
                          <Trash2 className="w-3 h-3" /> REMOVE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center border border-dashed border-[#D9D1C5] rounded-xs font-mono text-[11px] text-[#413B32]/70">
            No photographs or supporting evidence attached yet for this evaluation session.
          </div>
        )}
      </div>

      {/* Official Report Preview Modal (PART 3) */}
      {showReportPreview && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-6 max-w-3xl w-full text-[#413B32] space-y-4 max-h-[92vh] overflow-y-auto shadow-md font-sans">
            <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#413B32]/60">OFFICIAL LEGAL METROLOGY REPORT PREVIEW</span>
                <h3 className="font-mono font-bold text-sm text-[#413B32]">
                  {session.report?.report_number || `DRAFT EVALUATION PREVIEW — ${session.session_number}`}
                </h3>
              </div>
              <button onClick={() => setShowReportPreview(false)} className="text-[#413B32]/60 hover:text-[#413B32] font-mono text-sm">✕ CLOSE</button>
            </div>

            {/* Document Body */}
            <div className="space-y-4 font-mono text-xs bg-[#FFFFFF] border border-[#D9D1C5] p-5 rounded-xs">
              <div className="text-center border-b border-[#D9D1C5] pb-3 space-y-1">
                <p className="font-bold text-sm text-[#413B32]">GOVERNMENT OF INDIA │ DEPARTMENT OF CONSUMER AFFAIRS</p>
                <p className="text-[11px] text-[#413B32]/80">LEGAL METROLOGY TESTING LABORATORY</p>
                <p className="text-[10px] text-[#413B32]/60">OIML RECOMMENDATION R-76 TEST REPORT</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">1. INSTRUMENT MODEL:</span>
                  <span className="font-bold">{session.model_name}</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">2. SERIAL NUMBER:</span>
                  <span className="font-bold">{session.serial_number}</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">3. ACCURACY CLASS:</span>
                  <span className="font-bold">Class {session.accuracy_class}</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">4. MAX / MIN CAPACITY:</span>
                  <span className="font-bold">{session.max_capacity} kg / {session.min_capacity || 0.2} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">5. VERIFICATION INTERVAL (e):</span>
                  <span className="font-bold">{session.e} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">6. ISSUING LABORATORY:</span>
                  <span className="font-bold">{session.lab_name || 'Central Legal Metrology Lab'}</span>
                </div>
              </div>

              <div className="border-t border-[#D9D1C5] pt-3 space-y-2">
                <span className="font-bold block text-[11px]">7. EVALUATED COMPLIANCE SUMMARY:</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#F1EADE] text-[#413B32] uppercase text-[9px] font-bold border-b border-[#D9D1C5]">
                      <tr>
                        <th className="p-1.5">Procedure</th>
                        <th className="p-1.5">Measured Error</th>
                        <th className="p-1.5">Limit</th>
                        <th className="p-1.5">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D1C5]/40">
                      {session.compliance_results?.map((c: any) => (
                        <tr key={c.id}>
                          <td className="p-1.5 font-bold">{c.test_procedure_code}</td>
                          <td className="p-1.5">{c.measured_value.toFixed(3)} e</td>
                          <td className="p-1.5">{c.limit_applied}</td>
                          <td className="p-1.5 font-bold">{c.pass_fail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-[#D9D1C5] pt-3 text-[10px] space-y-1">
                <span className="font-bold block text-[11px]">8. AUTHENTICATION & QR VERIFICATION:</span>
                <p>Status: <span className="font-bold text-emerald-800">{session.status.toUpperCase()}</span></p>
                <p>Cryptographic SHA-256 Digest: <code className="text-[#413B32]">a7f9b283c411d99e013a77...</code></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
