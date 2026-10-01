import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ReportItem } from '../types';
import { Download, Search, FileSpreadsheet, Code } from 'lucide-react';

export const RepositoryPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      let params = [];
      if (searchQuery) params.push(`search_query=${encodeURIComponent(searchQuery)}`);
      if (accuracyClass) params.push(`accuracy_class=${accuracyClass}`);
      if (resultFilter) params.push(`result_filter=${resultFilter}`);

      const data = await api.searchReports(params.join('&'));
      setReports(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [searchQuery, accuracyClass, resultFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Title & Document Register Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#D9D1C5]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              DIGITAL TEST REPORT REGISTER
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              OIML R-76 ARCHIVE
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            Searchable, tamper-evident record repository of completed and in-progress OIML R-76 test reports.
          </p>
        </div>

        <div>
          <button
            onClick={async () => {
              try {
                await api.downloadReportCsv();
              } catch (err: any) {
                alert(err.message || 'Failed to download CSV export');
              }
            }}
            className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs px-3.5 py-1.5 rounded-xs transition inline-flex items-center space-x-1.5 border border-[#413B32]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#A7BABA]" />
            <span>Export Register (CSV)</span>
          </button>
        </div>
      </div>

      {/* Clean Filters Register Bar */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3 flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="flex-1 relative w-full">
          <Search className="w-3.5 h-3.5 text-[#413B32]/50 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search report number, instrument model, manufacturer, or serial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F1EADE]/40 border border-[#D9D1C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#413B32] font-mono focus:outline-none focus:border-[#413B32]"
          />
        </div>

        <select
          value={accuracyClass}
          onChange={e => setAccuracyClass(e.target.value)}
          className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-2.5 py-1.5 text-xs font-mono text-[#413B32] w-full sm:w-auto"
        >
          <option value="">All Accuracy Classes</option>
          <option value="I">Class I (Special)</option>
          <option value="II">Class II (High)</option>
          <option value="III">Class III (Medium)</option>
          <option value="IIII">Class IIII (Ordinary)</option>
        </select>

        <select
          value={resultFilter}
          onChange={e => setResultFilter(e.target.value)}
          className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-2.5 py-1.5 text-xs font-mono text-[#413B32] w-full sm:w-auto"
        >
          <option value="">All Results</option>
          <option value="PASS">PASS Only</option>
          <option value="FAIL">FAIL Only</option>
        </select>
      </div>

      {/* Reports Digital Register Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2 bg-[#F1EADE]/40 border-b border-[#D9D1C5] flex items-center justify-between font-mono text-[11px]">
          <span className="font-bold text-[#413B32] uppercase">OFFICIAL CERTIFICATE ARCHIVE REGISTER</span>
          <span className="text-[#413B32]/70 text-[10px]">
            Showing {reports.length} finalized records in database register
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Report Number</th>
                <th className="p-2.5">Instrument & Manufacturer</th>
                <th className="p-2.5">Serial Number</th>
                <th className="p-2.5">Class</th>
                <th className="p-2.5">Generated Date</th>
                <th className="p-2.5">Result</th>
                <th className="p-2.5 text-right">Certificate Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    Loading digital report register...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    No matching report records found in database register.
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-[#F1EADE]/30 transition">
                    <td className="p-2.5 font-mono font-bold text-[#413B32]">{r.report_number}</td>
                    <td className="p-2.5">
                      <p className="font-semibold text-[#413B32]">{r.model_name}</p>
                      <p className="text-[10px] font-mono text-[#413B32]/60">{r.manufacturer_name}</p>
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">{r.instrument_serial}</td>
                    <td className="p-2.5 font-mono">Class {r.accuracy_class}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/70">
                      {new Date(r.generated_at).toLocaleDateString()}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold border uppercase ${
                          r.overall_result === 'PASS'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-red-50 text-red-900 border-red-300'
                        }`}
                      >
                        {r.overall_result}
                      </span>
                    </td>
                    <td className="p-2.5 text-right space-x-1 font-mono">
                      <button
                        onClick={async () => {
                          try {
                            await api.downloadReportPdf(r.id);
                          } catch (err: any) {
                            alert(err.message || 'PDF Download failed');
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 px-2 py-0.5 rounded-xs text-[10px] font-semibold inline-flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3 text-red-700" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.downloadReportDocx(r.id);
                          } catch (err: any) {
                            alert(err.message || 'DOCX Download failed');
                          }
                        }}
                        className="bg-[#F1EADE] hover:bg-[#D9D1C5]/50 text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs text-[10px] font-semibold inline-flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3 text-[#413B32]" />
                        <span>DOCX</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.downloadReportJson(r.id);
                          } catch (err: any) {
                            alert(err.message || 'JSON Export failed');
                          }
                        }}
                        className="bg-[#FFFFFF] hover:bg-[#F1EADE]/50 text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs text-[10px] font-semibold inline-flex items-center space-x-1"
                      >
                        <Code className="w-3 h-3 text-[#413B32]" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
