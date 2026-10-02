import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { activeLabId } = useAuth();
  const [failures, setFailures] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFailurePatterns(activeLabId),
      api.getModels()
    ]).then(([fData, mData]) => {
      setFailures(fData);
      setModels(mData);
      if (mData.length > 0) setSelectedModelId(mData[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, [activeLabId]);

  useEffect(() => {
    if (selectedModelId) {
      api.getInstrumentHistory(selectedModelId)
        .then(data => setHistory(data))
        .catch(console.error);
    }
  }, [selectedModelId]);

  if (loading) return <div className="p-8 text-center text-xs font-mono text-[#25221F]/70">Loading Legal Metrology Analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
      <div className="pb-3 border-b border-[#E6E2DC]">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 bg-[#C87A57] inline-block rounded-xs"></span>
          <h1 className="text-xl font-serif-header font-normal tracking-tight text-[#25221F]">
            Failure Analytics & Instrument Historical Drift
          </h1>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC]">
            QUALITY OVERSIGHT
          </span>
        </div>
        <p className="text-xs text-[#25221F]/70 font-sans mt-1">
          Quality oversight across laboratory inspections: test failure counts and historical error drift for models over time.
        </p>
      </div>

      {/* Failure Patterns Bar Chart */}
      <div className="bg-white border border-[#E6E2DC] rounded-sm p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3">
          <h2 className="text-xs font-bold font-mono text-[#25221F] uppercase">Failure Frequency Breakdown by Test Procedure</h2>
          <span className="text-[10px] font-mono text-[#25221F]/60">HISTORICAL TEST FAILURES</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failures?.failures_by_test_procedure || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DC" />
              <XAxis dataKey="procedure" stroke="#25221F" fontSize={11} />
              <YAxis stroke="#25221F" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E6E2DC', color: '#25221F', fontSize: '12px', fontFamily: 'monospace' }} />
              <Bar dataKey="count" fill="#C87A57" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model History Drift Analysis */}
      <div className="bg-white border border-[#E6E2DC] rounded-sm p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E2DC] pb-3">
          <div>
            <h2 className="text-xs font-bold font-mono text-[#25221F] uppercase flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#C87A57]" />
              <span>Model Family Historical Error Drift Tracking</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <label className="text-[#25221F]/70 text-[11px]">Select Model:</label>
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(parseInt(e.target.value))}
              className="bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs px-2.5 py-1.5 text-xs text-[#25221F] font-mono focus:outline-none focus:border-[#C87A57]"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.model_name} (Class {m.accuracy_class})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history?.history || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E2DC" />
              <XAxis dataKey="date" stroke="#25221F" fontSize={11} />
              <YAxis stroke="#25221F" fontSize={11} label={{ value: 'Error E_c (e)', angle: -90, position: 'insideLeft', fill: '#25221F', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FAF6F0', borderColor: '#E6E2DC', color: '#25221F', fontSize: '12px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="error_e" stroke="#C87A57" strokeWidth={2} dot={{ r: 4, fill: '#3E7B66' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
