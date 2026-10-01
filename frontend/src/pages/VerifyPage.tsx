import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, AlertCircle, CheckCircle, Search, Lock, CheckCircle2 } from 'lucide-react';

export const VerifyPage: React.FC = () => {
  const { reportNumber: paramReportNum } = useParams<{ reportNumber?: string }>();
  const [reportNumInput, setReportNumInput] = useState(paramReportNum || 'NAWI-R76-2026-0001');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (queryNum?: string) => {
    const num = queryNum || reportNumInput;
    if (!num) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.publicVerify(num);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Report verification failed. Invalid certificate number.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramReportNum) {
      handleVerify(paramReportNum);
    }
  }, [paramReportNum]);

  return (
    <div className="min-h-screen bg-[#F1EADE] text-[#413B32] p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-xs bg-[#413B32] flex items-center justify-center text-[#F1EADE] shadow-xs mb-2 border border-[#413B32]">
            <ShieldCheck className="w-6 h-6 text-[#A7BABA]" />
          </div>
          <h1 className="text-base font-bold text-[#413B32] tracking-tight uppercase font-mono">
            LEGAL METROLOGY REPORT VERIFICATION
          </h1>
          <p className="text-xs text-[#413B32]/70 font-mono">
            Verify the authenticity and status of a digitally issued NAWI test report.
          </p>
        </div>

        {/* Input Box */}
        <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 shadow-2xs space-y-3 font-mono">
          <label className="block text-xs font-semibold text-[#413B32]">
            Report Certificate Number / Public Verification Code:
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#413B32]/50 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter Certificate No. (e.g. NAWI-R76-2026-0001)"
                value={reportNumInput}
                onChange={e => setReportNumInput(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs pl-9 pr-3 py-2 text-xs text-[#413B32] focus:outline-none focus:border-[#413B32]"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] px-4 py-2 rounded-xs text-xs font-bold border border-[#413B32] transition"
            >
              {loading ? 'Verifying...' : 'VERIFY REPORT'}
            </button>
          </div>
        </div>

        {/* Verification Result */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-xs text-xs flex items-center space-x-2 font-mono">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 space-y-4 shadow-2xs font-mono text-xs text-[#413B32]">
            <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-2">
              <span className="font-bold uppercase text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>VERIFICATION RESULT │ ✓ REPORT AUTHENTIC</span>
              </span>
              <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border ${result.valid ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-red-50 text-red-900 border-red-300'}`}>
                {result.valid ? 'OFFICIALLY VERIFIED' : 'INVALID'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">REPORT NUMBER:</span>
                <span className="font-bold text-[#413B32]">{result.report_number}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">REPORT DATE:</span>
                <span>{new Date(result.issued_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">INSTRUMENT MODEL:</span>
                <span>{result.instrument_model}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">SERIAL NUMBER:</span>
                <span className="font-bold">{result.serial_number}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">ISSUING LABORATORY:</span>
                <span>{result.laboratory_name}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">OIML REFERENCE:</span>
                <span>OIML R-76 ED. 2006 (E)</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">FINAL COMPLIANCE RESULT:</span>
                <span className="font-bold text-emerald-800">{result.overall_result}</span>
              </div>
              <div>
                <span className="text-[#413B32]/60 block text-[10px]">VERIFICATION STATUS:</span>
                <span className="font-bold text-emerald-800">AUTHENTIC & IMMUTABLE</span>
              </div>
            </div>

            <div className="border-t border-[#D9D1C5] pt-2.5 text-[10px] text-[#413B32]/70 space-y-1">
              <p className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-[#413B32]" />
                <span>Cryptographic SHA-256 Report Hash: <code className="text-[#413B32] font-bold">{result.verification_hash?.substring(0, 32)}...</code></span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
