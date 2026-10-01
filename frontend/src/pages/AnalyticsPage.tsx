import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [failures, setFailures] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getFailurePatterns(),
      api.getModels()
    ]).then(([fData, mData]) => {
      setFailures(fData);
      setModels(mData);
      if (mData.length > 0) setSelectedModelId(mData[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      api.getInstrumentHistory(selectedModelId)
        .then(data => setHistory(data))
        .catch(console.error);
    }
  }, [selectedModelId]);

  if (loading) return <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">Loading Legal Metrology Analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Header */}
      <div className="pb-2 border-b border-[#D9D1C5]">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
          <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
            Failure Analytics & Instrument Historical Drift
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
            QUALITY OVERSIGHT
          </span>
        </div>
        <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
          Quality oversight across laboratory inspections: test failure counts and historical error drift for models over time.
        </p>
      </div>

      {/* Failure Patterns Bar Chart */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#D9D1C5]/60 pb-2">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase">Failure Frequency Breakdown by Test Procedure</h2>
          <span className="text-[10px] font-mono text-[#413B32]/60">HISTORICAL TEST FAILURES</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={failures?.failures_by_test_procedure || []} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D1C5" />
              <XAxis dataKey="procedure" stroke="#413B32" fontSize={11} />
              <YAxis stroke="#413B32" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9D1C5', color: '#413B32', fontSize: '12px', fontFamily: 'monospace' }} />
              <Bar dataKey="count" fill="#413B32" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model History Drift Analysis */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D1C5]/60 pb-2">
          <div>
            <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center space-x-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#413B32]" />
              <span>Model Family Historical Error Drift Tracking</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <label className="text-[#413B32]/70 text-[11px]">Select Model:</label>
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(parseInt(e.target.value))}
              className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-2.5 py-1 text-xs text-[#413B32] font-mono"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#D9D1C5" />
              <XAxis dataKey="date" stroke="#413B32" fontSize={11} />
              <YAxis stroke="#413B32" fontSize={11} label={{ value: 'Error E_c (e)', angle: -90, position: 'insideLeft', fill: '#413B32', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9D1C5', color: '#413B32', fontSize: '12px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="error_e" stroke="#413B32" strokeWidth={2} dot={{ r: 4, fill: '#A7BABA' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
