import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Instrument, Equipment } from '../types';
import { TestSessionProgress } from '../components/TestSessionProgress';
import { PlusCircle, AlertTriangle, Info, ArrowRight, ArrowLeft } from 'lucide-react';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeLabId } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<any>(null);
  const [selectedEquipIds, setSelectedEquipIds] = useState<number[]>([]);
  const [env, setEnv] = useState({ temp_c: 20.5, humidity_pct: 55.0, pressure_hpa: 1013.25 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getInstruments(activeLabId), api.getEquipment(activeLabId)])
      .then(([insts, eq]) => {
        setInstruments(insts);
        setEquipmentList(eq);
        if (insts.length > 0) {
          setSelectedInstId(insts[0].id);
        } else {
          setSelectedInstId(null);
        }
      })
      .catch(console.error);
  }, [activeLabId]);

  useEffect(() => {
    if (selectedInstId) {
      const targetInst = instruments.find(i => i.id === selectedInstId);
      if (targetInst && targetInst.model_id) {
        api.suggestTests(targetInst.model_id)
          .then(data => setSuggestedTests(data))
          .catch(console.error);
      }
    }
  }, [selectedInstId, instruments]);

  const handleToggleEquip = (id: number) => {
    setSelectedEquipIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleCreateSession = async () => {
    if (!selectedInstId) return;
    setError('');
    setLoading(true);
    try {
      const instObj = instruments.find(i => i.id === selectedInstId);
      const targetLabId = activeLabId || user?.lab_id || 1;
      const res = await api.createSession({
        instrument_id: selectedInstId,
        lab_id: targetLabId,
        equipment_ids: selectedEquipIds,
        rule_version_id: 1,
        environmental_conditions: env,
        is_demo_data: instObj?.is_demo_data || false
      });
      navigate(`/sessions/${res.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedInstrument = instruments.find(i => i.id === selectedInstId);
  const expiredEquipSelected = equipmentList.some(eq => selectedEquipIds.includes(eq.id) && eq.is_expired);

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
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
              New NAWI Type-Evaluation Test Session Entry
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC]">
              FORM 01
            </span>
          </div>
          <p className="text-xs text-[#25221F]/70 font-sans mt-1">
            Initialize an official OIML R-76 evaluation session with target instrument parameters and environmental conditions.
          </p>
        </div>
      </div>

      {/* OIML R-76 Workflow Progress */}
      <TestSessionProgress currentStep="instrument" />

      {error && (
        <div className="bg-[#FAF6F0] border border-[#C54B4B] text-[#C54B4B] p-4 rounded-xs text-xs flex items-center space-x-2 font-sans">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Official Form Surface */}
      <div className="bg-white border border-[#E6E2DC] rounded-sm p-6 space-y-6 shadow-2xs font-sans">

        {/* Section 01: Instrument Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-2">
            <h2 className="text-xs font-bold uppercase text-[#25221F] tracking-wider font-mono">
              01. Instrument & Model Selection
            </h2>
            <span className="text-[10px] text-[#25221F]/60 font-mono">STEP 01 OF 04</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#25221F] mb-1">
              Select Registered NAWI Instrument (Serial Number Register):
            </label>
            <select
              value={selectedInstId || ''}
              onChange={e => setSelectedInstId(parseInt(e.target.value))}
              className="w-full bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs p-2.5 text-xs text-[#25221F] font-mono focus:outline-none focus:border-[#C87A57]"
            >
              {instruments.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.model_name} │ Serial: {inst.serial_number} │ Class {inst.accuracy_class} ({inst.manufacturer_name})
                </option>
              ))}
            </select>
          </div>

          {/* Instrument Metrological Parameters Register Summary */}
          {selectedInstrument && (
            <div className="bg-[#FAF6F0] border border-[#E6E2DC] p-4 rounded-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-1.5">
                <span className="font-bold text-[#25221F]">METROLOGICAL SPECIFICATION REGISTER</span>
                <span className="bg-white text-[#3E7B66] border border-[#3E7B66] px-2 py-0.5 text-[10px] font-bold">
                  Class {selectedInstrument.accuracy_class}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px]">
                <div>
                  <span className="text-[#25221F]/60 block text-[10px]">MAX CAPACITY (Max):</span>
                  <span className="font-bold">{selectedInstrument.max_capacity} kg</span>
                </div>
                <div>
                  <span className="text-[#25221F]/60 block text-[10px]">MIN CAPACITY (Min):</span>
                  <span className="font-bold">{selectedInstrument.min_capacity || 0.2} kg</span>
                </div>
                <div>
                  <span className="text-[#25221F]/60 block text-[10px]">VERIFICATION INTERVAL (e):</span>
                  <span className="font-bold">{selectedInstrument.e} kg</span>
                </div>
                <div>
                  <span className="text-[#25221F]/60 block text-[10px]">SCALE INTERVAL (d):</span>
                  <span className="font-bold">{selectedInstrument.d} kg</span>
                </div>
                <div>
                  <span className="text-[#25221F]/60 block text-[10px]">INTERVAL COUNT (n):</span>
                  <span className="font-bold">{selectedInstrument.n}</span>
                </div>
              </div>
            </div>
          )}

          {/* Prescribed OIML Tests Auto-Suggestion */}
          {suggestedTests && (
            <div className="bg-white border border-[#E6E2DC] p-4 rounded-xs space-y-3 text-xs font-mono">
              <div className="flex items-center space-x-2 font-bold text-[#25221F] text-[11px] border-b border-[#E6E2DC] pb-1.5">
                <Info className="w-4 h-4 text-[#C87A57]" />
                <span>PRESCRIBED OIML R-76 TEST PROCEDURES (CLASS {suggestedTests.accuracy_class})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                {suggestedTests.suggested_tests.map((t: any) => (
                  <div key={t.code} className="bg-[#FAF6F0] border border-[#E6E2DC] p-2.5 rounded-xs">
                    <span className="font-bold text-[#25221F] block">{t.code}</span>
                    <span className="text-[10px] text-[#25221F]/70 block truncate">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 02: Environmental Conditions */}
        <div className="space-y-3 pt-4 border-t border-[#E6E2DC]">
          <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-2">
            <h2 className="text-xs font-bold uppercase text-[#25221F] tracking-wider font-mono">
              02. Environmental & Laboratory Conditions
            </h2>
            <span className="text-[10px] text-[#25221F]/60 font-mono">STEP 02 OF 04</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
            <div>
              <label className="block text-[11px] font-semibold text-[#25221F]/80 mb-1">Ambient Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={env.temp_c}
                onChange={e => setEnv({ ...env, temp_c: parseFloat(e.target.value) })}
                className="w-full bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs p-2 text-xs text-[#25221F] font-mono focus:outline-none focus:border-[#C87A57]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#25221F]/80 mb-1">Relative Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                value={env.humidity_pct}
                onChange={e => setEnv({ ...env, humidity_pct: parseFloat(e.target.value) })}
                className="w-full bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs p-2 text-xs text-[#25221F] font-mono focus:outline-none focus:border-[#C87A57]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#25221F]/80 mb-1">Barometric Pressure (hPa)</label>
              <input
                type="number"
                step="0.1"
                value={env.pressure_hpa}
                onChange={e => setEnv({ ...env, pressure_hpa: parseFloat(e.target.value) })}
                className="w-full bg-[#FAF6F0] border border-[#E6E2DC] rounded-xs p-2 text-xs text-[#25221F] font-mono focus:outline-none focus:border-[#C87A57]"
              />
            </div>
          </div>
        </div>

        {/* Section 03: Reference Calibration Equipment */}
        <div className="space-y-3 pt-4 border-t border-[#E6E2DC]">
          <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-2">
            <h2 className="text-xs font-bold uppercase text-[#25221F] tracking-wider font-mono">
              03. Reference Standards & Equipment Selection
            </h2>
            <span className="text-[10px] text-[#25221F]/60 font-mono">STEP 03 OF 04</span>
          </div>

          {expiredEquipSelected && (
            <div className="bg-[#FAF6F0] border border-[#D9822B] text-[#D9822B] p-3 rounded-xs text-xs flex items-center space-x-2 font-sans">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#D9822B]" />
              <span>CALIBRATION WARNING: One or more selected standard mass weight sets have EXPIRED calibration certificates!</span>
            </div>
          )}

          <div className="space-y-2 max-h-52 overflow-y-auto border border-[#E6E2DC] rounded-xs p-3 bg-white">
            {equipmentList.map(eq => (
              <label key={eq.id} className="flex items-center justify-between p-2.5 rounded-xs hover:bg-[#FAF6F0] cursor-pointer text-xs border border-[#E6E2DC] transition">
                <div className="flex items-center space-x-2.5 font-sans">
                  <input
                    type="checkbox"
                    checked={selectedEquipIds.includes(eq.id)}
                    onChange={() => handleToggleEquip(eq.id)}
                    className="rounded-xs border-[#E6E2DC] text-[#C87A57]"
                  />
                  <span className="font-bold text-[#25221F]">{eq.identifier} ({eq.type})</span>
                  <span className="text-[#25221F]/60 text-[11px] font-mono">Cert: {eq.calibration_cert_no}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs font-mono uppercase border ${eq.is_expired ? 'bg-[#FAF6F0] text-[#C54B4B] border-[#C54B4B]' : 'bg-[#FAF6F0] text-[#3E7B66] border-[#3E7B66]'}`}>
                  {eq.is_expired ? `EXPIRED (${eq.calibration_due_date})` : `CALIBRATED DUE: ${eq.calibration_due_date}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-[#E6E2DC] flex items-center justify-between font-sans">
          <span className="text-[11px] text-[#25221F]/60 font-mono">
            Form 01 │ Legal Metrology Laboratory Evaluation Entry
          </span>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="bg-[#C87A57] hover:bg-[#b56b49] text-white font-semibold px-6 py-2.5 rounded-xs text-xs flex items-center space-x-2 transition border border-[#C87A57] shadow-2xs disabled:opacity-50"
          >
            <span>{loading ? 'Initializing Session...' : 'Initialize Test Session & Enter Observations →'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
