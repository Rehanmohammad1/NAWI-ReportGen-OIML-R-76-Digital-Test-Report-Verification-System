import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { NawiLogo } from '../components/NawiLogo';
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
    <div className="min-h-screen bg-[#F9F8F6] text-[#25221F] p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-2xl w-full space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xs bg-[#25221F] flex items-center justify-center text-[#F9F8F6] shadow-xs mb-3 border border-[#25221F]">
            <NawiLogo className="w-7 h-7 text-[#F9F8F6]" />
          </div>
          <h1 className="text-xl font-serif-header font-normal text-[#25221F] tracking-tight">
            Legal Metrology Report Verification
          </h1>
          <p className="text-xs text-[#25221F]/70 font-sans">
            Verify the authenticity, compliance status, and cryptographic SHA-256 digest of a digitally issued NAWI test report.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-white border border-[#E6E2DC] rounded-sm p-6 shadow-2xs space-y-3 font-sans">
          <label className="block text-xs font-semibold text-[#25221F]">
            Report Certificate Number / Public Verification Code:
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#25221F]/40 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter Certificate No. (e.g. NAWI-R76-2026-0001)"
                value={reportNumInput}
                onChange={e => setReportNumInput(e.target.value)}
                className="w-full bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs pl-9 pr-3 py-2 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57]"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="bg-[#C87A57] hover:bg-[#b56b49] text-white px-4 py-2 rounded-xs text-xs font-semibold border border-[#C87A57] transition shadow-2xs"
            >
              {loading ? 'Verifying...' : 'VERIFY REPORT'}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#FAF6F0] border border-[#C54B4B] text-[#C54B4B] p-4 rounded-xs text-xs flex items-center space-x-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className="bg-white border border-[#E6E2DC] rounded-sm p-6 space-y-4 shadow-2xs font-sans text-xs text-[#25221F]">
            <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3">
              <span className="font-bold uppercase text-[11px] flex items-center gap-1.5 text-[#3E7B66]">
                <CheckCircle2 className="w-4 h-4" />
                <span>VERIFICATION RESULT │ ✓ REPORT AUTHENTIC</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${result.valid ? 'bg-[#FAF6F0] text-[#3E7B66] border-[#3E7B66]' : 'bg-[#FAF6F0] text-[#C54B4B] border-[#C54B4B]'}`}>
                {result.valid ? 'OFFICIALLY VERIFIED' : 'INVALID'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">REPORT NUMBER:</span>
                <span className="font-bold text-[#25221F] font-mono">{result.report_number}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">REPORT DATE:</span>
                <span>{new Date(result.issued_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">INSTRUMENT MODEL:</span>
                <span className="font-semibold">{result.instrument_model}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">SERIAL NUMBER:</span>
                <span className="font-bold font-mono">{result.serial_number}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">ISSUING LABORATORY:</span>
                <span>{result.laboratory_name}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">OIML REFERENCE:</span>
                <span>OIML R-76 ED. 2006 (E)</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">FINAL COMPLIANCE RESULT:</span>
                <span className="font-bold text-[#3E7B66]">{result.overall_result}</span>
              </div>
              <div>
                <span className="text-[#25221F]/60 block text-[10px] font-mono">VERIFICATION STATUS:</span>
                <span className="font-bold text-[#3E7B66]">AUTHENTIC & IMMUTABLE</span>
              </div>
            </div>

            <div className="border-t border-[#E6E2DC] pt-3 text-[10px] text-[#25221F]/70 space-y-1">
              <p className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-[#25221F]" />
                <span>Cryptographic SHA-256 Report Hash: <code className="text-[#25221F] font-bold font-mono">{result.verification_hash?.substring(0, 32)}...</code></span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

