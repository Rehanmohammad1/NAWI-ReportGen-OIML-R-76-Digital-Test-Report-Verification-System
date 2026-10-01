import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { InstrumentModel, Instrument, Manufacturer } from '../types';
import { Scale, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const InstrumentsPage: React.FC = () => {
  const [models, setModels] = useState<InstrumentModel[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [showAddMfg, setShowAddMfg] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddInst, setShowAddInst] = useState(false);
  const [selectedTestSuggestion, setSelectedTestSuggestion] = useState<any>(null);

  // Forms state
  const [newMfg, setNewMfg] = useState({ name: '', address: '', contact_email: '', contact_phone: '', country: 'India' });
  const [newModel, setNewModel] = useState({
    manufacturer_id: 1, model_name: '', accuracy_class: 'III',
    max_capacity: 30.0, min_capacity: 0.2, e: 0.01, d: 0.01,
    temperature_range_min: -10, temperature_range_max: 40, tare_range_max: 30, multi_interval: false
  });
  const [newInst, setNewInst] = useState({ model_id: 1, serial_number: '', year_of_manufacture: 2026, is_demo_data: false });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mfgData, modelData, instData] = await Promise.all([
        api.getManufacturers(),
        api.getModels(),
        api.getInstruments()
      ]);
      setManufacturers(mfgData);
      setModels(modelData);
      setInstruments(instData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMfg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createManufacturer(newMfg);
      setSuccess('Manufacturer created successfully');
      setShowAddMfg(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createModel(newModel);
      setSuccess('Instrument Model created successfully');
      setShowAddModel(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegisterInst = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.registerInstrument(newInst);
      setSuccess('Instrument registered successfully');
      setShowAddInst(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSuggestTests = async (modelId: number) => {
    try {
      const res = await api.suggestTests(modelId);
      setSelectedTestSuggestion(res);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">Loading instrument registry...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D1C5]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              Instrument & Technical Specification Registry
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              OIML R-76 MODELS
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            Registered NAWI models, accuracy classes (I, II, III, IIII), scale intervals (e, d, n, Max, Min).
          </p>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-xs">
          <button
            onClick={() => setShowAddMfg(true)}
            className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] px-3 py-1.5 rounded-xs border border-[#D9D1C5] font-semibold transition"
          >
            + Add Manufacturer
          </button>
          <button
            onClick={() => setShowAddModel(true)}
            className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] px-3 py-1.5 rounded-xs border border-[#D9D1C5] font-semibold transition"
          >
            + Add Model
          </button>
          <button
            onClick={() => setShowAddInst(true)}
            className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] px-3.5 py-1.5 rounded-xs font-semibold border border-[#413B32] transition"
          >
            + Register Instrument
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
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

      {/* Test Selection Rationale Modal */}
      {selectedTestSuggestion && (
        <div className="bg-[#F1EADE]/60 border border-[#D9D1C5] rounded-xs p-4 text-[#413B32]">
          <div className="flex items-center justify-between mb-2 border-b border-[#D9D1C5] pb-2">
            <h3 className="font-mono font-bold text-xs text-[#413B32] flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#413B32]" />
              <span>Automatic Test-Set Selection Rationale: {selectedTestSuggestion.model_name}</span>
            </h3>
            <button onClick={() => setSelectedTestSuggestion(null)} className="text-[#413B32]/60 hover:text-[#413B32] font-mono text-xs">✕ Close</button>
          </div>
          <p className="text-xs text-[#413B32]/80 font-mono mb-3">
            Class <b>{selectedTestSuggestion.accuracy_class}</b> Instrument │ Max Capacity: <b>{selectedTestSuggestion.max_capacity} kg</b> │ e: <b>{selectedTestSuggestion.e} kg</b> │ n: <b>{selectedTestSuggestion.n}</b> scale intervals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
            {selectedTestSuggestion.suggested_tests.map((t: any) => (
              <div key={t.code} className="bg-[#FFFFFF] border border-[#D9D1C5] p-2.5 rounded-xs">
                <span className="font-bold text-[#413B32] block">{t.code} — {t.name}</span>
                <span className="text-[#413B32]/70 text-[11px] block mt-1">{t.rationale}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Models Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#F1EADE]/40 border-b border-[#D9D1C5]">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase">Approved Instrument Models Catalog</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Model Name</th>
                <th className="p-2.5">Manufacturer</th>
                <th className="p-2.5">Class</th>
                <th className="p-2.5">Max (kg)</th>
                <th className="p-2.5">Min (kg)</th>
                <th className="p-2.5">e (kg)</th>
                <th className="p-2.5">d (kg)</th>
                <th className="p-2.5">n = Max/e</th>
                <th className="p-2.5 text-right">Applicable Test Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-[#F1EADE]/30 transition">
                  <td className="p-2.5 font-bold text-[#413B32]">{m.model_name}</td>
                  <td className="p-2.5">{m.manufacturer_name}</td>
                  <td className="p-2.5">
                    <span className="bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs font-mono font-bold text-[10px]">
                      Class {m.accuracy_class}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono">{m.max_capacity}</td>
                  <td className="p-2.5 font-mono">{m.min_capacity}</td>
                  <td className="p-2.5 font-mono">{m.e}</td>
                  <td className="p-2.5 font-mono">{m.d}</td>
                  <td className="p-2.5 font-mono font-bold text-[#413B32]">{m.n}</td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => handleSuggestTests(m.id)}
                      className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] px-2 py-0.5 rounded-xs border border-[#D9D1C5] font-mono font-semibold text-[10px] transition"
                    >
                      Show Prescribed Tests →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[#F1EADE]/40 border-b border-[#D9D1C5]">
          <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase">Registered Physical Instruments (Serial Number Registry)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Serial Number</th>
                <th className="p-2.5">Model Name</th>
                <th className="p-2.5">Manufacturer</th>
                <th className="p-2.5">Accuracy Class</th>
                <th className="p-2.5">Manufacture Year</th>
                <th className="p-2.5">Data Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {instruments.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#F1EADE]/30 transition">
                  <td className="p-2.5 font-mono font-bold text-[#413B32]">{inst.serial_number}</td>
                  <td className="p-2.5 font-semibold text-[#413B32]">{inst.model_name}</td>
                  <td className="p-2.5">{inst.manufacturer_name}</td>
                  <td className="p-2.5 font-mono">Class {inst.accuracy_class}</td>
                  <td className="p-2.5 font-mono">{inst.year_of_manufacture}</td>
                  <td className="p-2.5 font-mono">
                    {inst.is_demo_data ? (
                      <span className="bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs text-[10px] font-bold">
                        SYSTEM SEED
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                        REGISTERED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manufacturer Modal */}
      {showAddMfg && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Register New Manufacturer</h3>
            <form onSubmit={handleCreateMfg} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Company Name</label>
                <input required type="text" value={newMfg.name} onChange={e => setNewMfg({ ...newMfg, name: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Factory Address</label>
                <input required type="text" value={newMfg.address} onChange={e => setNewMfg({ ...newMfg, address: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Contact Email</label>
                <input required type="email" value={newMfg.contact_email} onChange={e => setNewMfg({ ...newMfg, contact_email: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Contact Phone</label>
                <input required type="text" value={newMfg.contact_phone} onChange={e => setNewMfg({ ...newMfg, contact_phone: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setShowAddMfg(false)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Save Manufacturer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModel && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-lg w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Register New Instrument Model</h3>
            <form onSubmit={handleCreateModel} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Manufacturer</label>
                <select value={newModel.manufacturer_id} onChange={e => setNewModel({ ...newModel, manufacturer_id: parseInt(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Model Designation</label>
                <input required type="text" value={newModel.model_name} onChange={e => setNewModel({ ...newModel, model_name: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Accuracy Class</label>
                  <select value={newModel.accuracy_class} onChange={e => setNewModel({ ...newModel, accuracy_class: e.target.value as any })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                    <option value="I">Class I (Special)</option>
                    <option value="II">Class II (Fine)</option>
                    <option value="III">Class III (Medium)</option>
                    <option value="IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Max Capacity (kg)</label>
                  <input required type="number" step="any" value={newModel.max_capacity} onChange={e => setNewModel({ ...newModel, max_capacity: parseFloat(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Min Cap (kg)</label>
                  <input required type="number" step="any" value={newModel.min_capacity} onChange={e => setNewModel({ ...newModel, min_capacity: parseFloat(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
                <div>
                  <label className="block text-[#413B32]/70 mb-1">e (kg)</label>
                  <input required type="number" step="any" value={newModel.e} onChange={e => setNewModel({ ...newModel, e: parseFloat(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
                <div>
                  <label className="block text-[#413B32]/70 mb-1">d (kg)</label>
                  <input required type="number" step="any" value={newModel.d} onChange={e => setNewModel({ ...newModel, d: parseFloat(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setShowAddModel(false)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Save Model</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Instrument Modal */}
      {showAddInst && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Register Physical Instrument (Unique Serial)</h3>
            <form onSubmit={handleRegisterInst} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Instrument Model</label>
                <select value={newInst.model_id} onChange={e => setNewInst({ ...newInst, model_id: parseInt(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  {models.map(m => <option key={m.id} value={m.id}>{m.model_name} (Class {m.accuracy_class})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Serial Number (Unique)</label>
                <input required type="text" placeholder="e.g. SN-AVERY-2026-99" value={newInst.serial_number} onChange={e => setNewInst({ ...newInst, serial_number: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Year of Manufacture</label>
                <input required type="number" value={newInst.year_of_manufacture} onChange={e => setNewInst({ ...newInst, year_of_manufacture: parseInt(e.target.value) })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setShowAddInst(false)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Register Instrument</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
