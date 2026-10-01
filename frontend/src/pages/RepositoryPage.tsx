import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ReportItem } from '../types';
import { Download, Search, FileSpreadsheet, Code, ShieldCheck, FileText, Filter } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Page Title & Register Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E6E2DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#3E7B66]"></span>
            <span>OIML R-76 Digital Certificate Archive</span>
          </div>
          <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
            Test Reports & Verification Repository
          </h1>
          <p className="text-xs text-[#666059] mt-1">
            Searchable, tamper-evident record repository of completed and in-progress legal metrology test certificates.
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
            className="bg-[#25221F] hover:bg-[#38332F] text-white font-medium text-xs px-4 py-2 rounded-md transition shadow-xs inline-flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#C87A57]" />
            <span>Export Register (CSV)</span>
          </button>
        </div>
      </div>

      {/* Clean Filters Register Bar */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-center shadow-2xs">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-[#666059] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report number, instrument model, manufacturer, or serial..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-[#E6E2DC] rounded-md pl-9 pr-3 py-2 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57]"
          />
        </div>

        <select
          value={accuracyClass}
          onChange={e => setAccuracyClass(e.target.value)}
          className="bg-white border border-[#E6E2DC] rounded-md px-3 py-2 text-xs text-[#25221F] w-full sm:w-auto focus:outline-none focus:border-[#C87A57]"
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
          className="bg-white border border-[#E6E2DC] rounded-md px-3 py-2 text-xs text-[#25221F] w-full sm:w-auto focus:outline-none focus:border-[#C87A57]"
        >
          <option value="">All Results</option>
          <option value="PASS">PASS Only</option>
          <option value="FAIL">FAIL Only</option>
        </select>
      </div>

      {/* Reports Digital Register Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC] flex items-center justify-between text-xs">
          <span className="font-serif-header font-semibold text-[#25221F] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3E7B66]" />
            Official Certificate Archive Register
          </span>
          <span className="text-[#666059] text-xs font-mono">
            Showing {reports.length} finalized records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Report Number</th>
                <th className="p-3">Instrument & Manufacturer</th>
                <th className="p-3">Serial Number</th>
                <th className="p-3">Class</th>
                <th className="p-3">Generated Date</th>
                <th className="p-3">Result</th>
                <th className="p-3 pr-5 text-right">Certificate Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#666059]">
                    Loading digital report register...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#666059]">
                    No matching report records found in database register.
                  </td>
                </tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{r.report_number}</td>
                    <td className="p-3">
                      <p className="font-medium text-[#25221F]">{r.model_name}</p>
                      <p className="text-[10px] text-[#666059]">{r.manufacturer_name}</p>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">{r.instrument_serial}</td>
                    <td className="p-3 font-mono font-medium">Class {r.accuracy_class}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">
                      {new Date(r.generated_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          r.overall_result === 'PASS'
                            ? 'bg-[#EBF5F1] text-[#2D5A4B] border-[#BDE3D5]'
                            : 'bg-[#FFF5F5] text-[#9B2C2C] border-[#F5C6C6]'
                        }`}
                      >
                        {r.overall_result}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right space-x-1.5 font-sans">
                      <button
                        onClick={async () => {
                          try {
                            await api.downloadReportPdf(r.id);
                          } catch (err: any) {
                            alert(err.message || 'PDF Download failed');
                          }
                        }}
                        className="bg-[#FFF5F5] hover:bg-[#FFEBEB] text-[#9B2C2C] border border-[#F5C6C6] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center space-x-1 transition"
                      >
                        <Download className="w-3 h-3 text-[#C54B4B]" />
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
                        className="bg-white hover:bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center space-x-1 transition"
                      >
                        <Download className="w-3 h-3 text-[#666059]" />
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
                        className="bg-white hover:bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center space-x-1 transition"
                      >
                        <Code className="w-3 h-3 text-[#666059]" />
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

