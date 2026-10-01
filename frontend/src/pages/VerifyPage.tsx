import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { NawiLogo } from '../components/NawiLogo';
import { AlertCircle, Lock, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#EBE5DC] text-[#24211D] p-4 md:p-8 flex flex-col items-center justify-center font-sans tech-grid-bg">
      <div className="max-w-2xl w-full space-y-5">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#9C5A3C] shadow-xs mb-3 border border-[#E2DDD5]">
            <NawiLogo className="w-7 h-7 text-[#9C5A3C]" />
          </div>
          <h1 className="text-2xl font-serif-header font-bold text-[#24211D] tracking-tight">
            NAWI TEST REPORTING SYSTEM
          </h1>
          <p className="text-xs font-mono text-[#8C8275] uppercase tracking-widest">
            Legal Metrology &bull; OIML R-76 Certificate Verification
          </p>
          <p className="text-xs text-[#6B6359] font-sans max-w-lg mx-auto">
            Verify the authenticity, compliance status, and cryptographic SHA-256 digest of a digitally issued NAWI test report.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-6 shadow-xs space-y-3 font-sans">
          <label className="block text-xs font-semibold text-[#24211D]">
            Report Certificate Number / Public Verification Code:
          </label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Certificate No. (e.g. NAWI-R76-2026-0001)"
                value={reportNumInput}
                onChange={e => setReportNumInput(e.target.value)}
                className="w-full bg-white border border-[#E2DDD5] rounded-lg px-4 py-2.5 text-xs text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading}
              className="bg-[#9C5A3C] hover:bg-[#864B30] text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition shadow-xs"
            >
              {loading ? 'Verifying...' : 'VERIFY REPORT'}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-4 rounded-xl text-xs flex items-center space-x-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Result Card */}
        {result && (
          <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-6 space-y-4 shadow-xs font-sans text-xs text-[#24211D]">
            <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
              <span className="font-bold uppercase text-[11px] flex items-center gap-1.5 text-[#2D5A4B]">
                <CheckCircle2 className="w-4 h-4 text-[#2D5A4B]" />
                <span>VERIFICATION RESULT │ ✓ REPORT AUTHENTIC</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${result.valid ? 'bg-[#E2F4EA] text-[#2D5A4B] border-[#BDE3D5]' : 'bg-[#FFF5F5] text-[#9B2C2C] border-[#F5C6C6]'}`}>
                {result.valid ? 'OFFICIALLY VERIFIED' : 'INVALID'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">REPORT NUMBER:</span>
                <span className="font-bold text-[#24211D] font-mono">{result.report_number}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">REPORT DATE:</span>
                <span className="font-mono">{new Date(result.issued_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">INSTRUMENT MODEL:</span>
                <span className="font-semibold">{result.instrument_model}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">SERIAL NUMBER:</span>
                <span className="font-bold font-mono">{result.serial_number}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">ISSUING LABORATORY:</span>
                <span>{result.laboratory_name}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">OIML REFERENCE:</span>
                <span>OIML R-76 ED. 2006 (E)</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">FINAL COMPLIANCE RESULT:</span>
                <span className="font-bold text-[#2D5A4B]">{result.overall_result}</span>
              </div>
              <div>
                <span className="text-[#8C8275] block text-[10px] font-mono">VERIFICATION STATUS:</span>
                <span className="font-bold text-[#2D5A4B]">AUTHENTIC & IMMUTABLE</span>
              </div>
            </div>

            <div className="border-t border-[#E2DDD5] pt-3 text-[10px] text-[#6B6359] space-y-1 font-mono">
              <p className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-[#24211D]" />
                <span>Cryptographic SHA-256 Report Hash: <code className="text-[#24211D] font-bold">{result.verification_hash?.substring(0, 32)}...</code></span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
