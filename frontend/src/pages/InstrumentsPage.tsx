import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { InstrumentModel, Instrument, Manufacturer } from '../types';
import { Scale, AlertCircle, CheckCircle, Info, Plus, CheckCircle2, Building, Layers } from 'lucide-react';

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
    return <div className="p-12 text-center text-xs font-mono text-[#666059]">Loading instrument registry...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E6E2DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#C87A57]"></span>
            <span>Legal Metrology Registry</span>
          </div>
          <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
            Instrument & Technical Specification Registry
          </h1>
          <p className="text-xs text-[#666059] mt-1">
            Registered NAWI models, accuracy classes (I, II, III, IIII), scale intervals (e, d, n, Max, Min).
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 text-xs">
          <button
            onClick={() => setShowAddMfg(true)}
            className="bg-white hover:bg-[#FAF6F0] text-[#25221F] px-3.5 py-2 rounded-md border border-[#E6E2DC] font-medium transition shadow-2xs"
          >
            + Add Manufacturer
          </button>
          <button
            onClick={() => setShowAddModel(true)}
            className="bg-white hover:bg-[#FAF6F0] text-[#25221F] px-3.5 py-2 rounded-md border border-[#E6E2DC] font-medium transition shadow-2xs"
          >
            + Add Model
          </button>
          <button
            onClick={() => setShowAddInst(true)}
            className="bg-[#C87A57] hover:bg-[#B36846] text-white px-4 py-2 rounded-md font-medium transition shadow-xs"
          >
            + Register Instrument
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#C54B4B] flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-[#25221F]/60 hover:text-[#25221F]">✕</button>
        </div>
      )}

      {success && (
        <div className="bg-[#EBF5F1] border border-[#BDE3D5] text-[#2D5A4B] p-3.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#3E7B66] flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-[#25221F]/60 hover:text-[#25221F]">✕</button>
        </div>
      )}

      {/* Test Selection Rationale Modal */}
      {selectedTestSuggestion && (
        <div className="bg-[#FAF6F0] border border-[#E6E2DC] rounded-lg p-5 text-[#25221F] shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-2">
            <h3 className="font-serif-header text-sm font-semibold text-[#25221F] flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#C87A57]" />
              <span>Automatic Test-Set Selection Rationale: {selectedTestSuggestion.model_name}</span>
            </h3>
            <button onClick={() => setSelectedTestSuggestion(null)} className="text-[#666059] hover:text-[#25221F] text-xs font-medium">✕ Close</button>
          </div>
          <p className="text-xs text-[#666059]">
            Class <strong>{selectedTestSuggestion.accuracy_class}</strong> Instrument &nbsp;&bull;&nbsp; Max Capacity: <strong>{selectedTestSuggestion.max_capacity} kg</strong> &nbsp;&bull;&nbsp; e: <strong>{selectedTestSuggestion.e} kg</strong> &nbsp;&bull;&nbsp; n: <strong>{selectedTestSuggestion.n}</strong> scale intervals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {selectedTestSuggestion.suggested_tests.map((t: any) => (
              <div key={t.code} className="bg-white border border-[#E6E2DC] p-3 rounded-md">
                <span className="font-semibold text-[#25221F] block">{t.code} — {t.name}</span>
                <span className="text-[#666059] text-xs block mt-1">{t.rationale}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Models Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC]">
          <h2 className="text-sm font-semibold font-serif-header text-[#25221F]">Approved Instrument Models Catalog</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Model Name</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Class</th>
                <th className="p-3">Max (kg)</th>
                <th className="p-3">Min (kg)</th>
                <th className="p-3">e (kg)</th>
                <th className="p-3">d (kg)</th>
                <th className="p-3">n = Max/e</th>
                <th className="p-3 pr-5 text-right">Applicable Test Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {models.map((m) => (
                <tr key={m.id} className="hover:bg-[#FAF6F0]/60 transition">
                  <td className="p-3 pl-5 font-semibold text-[#25221F]">{m.model_name}</td>
                  <td className="p-3">{m.manufacturer_name}</td>
                  <td className="p-3">
                    <span className="bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold">
                      Class {m.accuracy_class}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{m.max_capacity}</td>
                  <td className="p-3 font-mono">{m.min_capacity}</td>
                  <td className="p-3 font-mono">{m.e}</td>
                  <td className="p-3 font-mono">{m.d}</td>
                  <td className="p-3 font-mono font-semibold text-[#25221F]">{m.n}</td>
                  <td className="p-3 pr-5 text-right">
                    <button
                      onClick={() => handleSuggestTests(m.id)}
                      className="bg-white hover:bg-[#FAF6F0] text-[#C87A57] px-2.5 py-1 rounded-md border border-[#E6E2DC] font-medium text-xs transition"
                    >
                      Prescribed Tests →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC]">
          <h2 className="text-sm font-semibold font-serif-header text-[#25221F]">Registered Physical Instruments (Serial Number Registry)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Serial Number</th>
                <th className="p-3">Model Name</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Accuracy Class</th>
                <th className="p-3">Manufacture Year</th>
                <th className="p-3 pr-5">Data Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {instruments.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#FAF6F0]/60 transition">
                  <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{inst.serial_number}</td>
                  <td className="p-3 font-medium text-[#25221F]">{inst.model_name}</td>
                  <td className="p-3 text-[#666059]">{inst.manufacturer_name}</td>
                  <td className="p-3 font-mono">Class {inst.accuracy_class}</td>
                  <td className="p-3 font-mono text-[#666059]">{inst.year_of_manufacture}</td>
                  <td className="p-3 pr-5">
                    {inst.is_demo_data ? (
                      <span className="bg-[#FAF6F0] text-[#666059] border border-[#E6E2DC] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-medium">
                        SYSTEM SEED
                      </span>
                    ) : (
                      <span className="bg-[#EBF5F1] text-[#2D5A4B] border border-[#BDE3D5] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold">
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
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Register New Manufacturer</h3>
            <form onSubmit={handleCreateMfg} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Company Name</label>
                <input required type="text" value={newMfg.name} onChange={e => setNewMfg({ ...newMfg, name: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Factory Address</label>
                <input required type="text" value={newMfg.address} onChange={e => setNewMfg({ ...newMfg, address: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Contact Email</label>
                <input required type="email" value={newMfg.contact_email} onChange={e => setNewMfg({ ...newMfg, contact_email: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Contact Phone</label>
                <input required type="text" value={newMfg.contact_phone} onChange={e => setNewMfg({ ...newMfg, contact_phone: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setShowAddMfg(false)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Save Manufacturer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModel && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-lg w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Register New Instrument Model</h3>
            <form onSubmit={handleCreateModel} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Manufacturer</label>
                <select value={newModel.manufacturer_id} onChange={e => setNewModel({ ...newModel, manufacturer_id: parseInt(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Model Designation</label>
                <input required type="text" value={newModel.model_name} onChange={e => setNewModel({ ...newModel, model_name: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Accuracy Class</label>
                  <select value={newModel.accuracy_class} onChange={e => setNewModel({ ...newModel, accuracy_class: e.target.value as any })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                    <option value="I">Class I (Special)</option>
                    <option value="II">Class II (Fine)</option>
                    <option value="III">Class III (Medium)</option>
                    <option value="IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Max Capacity (kg)</label>
                  <input required type="number" step="any" value={newModel.max_capacity} onChange={e => setNewModel({ ...newModel, max_capacity: parseFloat(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Min Cap (kg)</label>
                  <input required type="number" step="any" value={newModel.min_capacity} onChange={e => setNewModel({ ...newModel, min_capacity: parseFloat(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">e (kg)</label>
                  <input required type="number" step="any" value={newModel.e} onChange={e => setNewModel({ ...newModel, e: parseFloat(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">d (kg)</label>
                  <input required type="number" step="any" value={newModel.d} onChange={e => setNewModel({ ...newModel, d: parseFloat(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
              </div>
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setShowAddModel(false)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Save Model</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Instrument Modal */}
      {showAddInst && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Register Physical Instrument</h3>
            <form onSubmit={handleRegisterInst} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Instrument Model</label>
                <select value={newInst.model_id} onChange={e => setNewInst({ ...newInst, model_id: parseInt(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  {models.map(m => <option key={m.id} value={m.id}>{m.model_name} (Class {m.accuracy_class})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Serial Number (Unique)</label>
                <input required type="text" placeholder="e.g. SN-AVERY-2026-99" value={newInst.serial_number} onChange={e => setNewInst({ ...newInst, serial_number: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Year of Manufacture</label>
                <input required type="number" value={newInst.year_of_manufacture} onChange={e => setNewInst({ ...newInst, year_of_manufacture: parseInt(e.target.value) })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setShowAddInst(false)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Register Instrument</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

