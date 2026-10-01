import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Instrument, Equipment } from '../types';
import { TestSessionProgress } from '../components/TestSessionProgress';
import { PlusCircle, AlertTriangle, Info, ArrowRight, ArrowLeft } from 'lucide-react';

export const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedInstId, setSelectedInstId] = useState<number | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<any>(null);
  const [selectedEquipIds, setSelectedEquipIds] = useState<number[]>([]);
  const [env, setEnv] = useState({ temp_c: 20.5, humidity_pct: 55.0, pressure_hpa: 1013.25 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getInstruments(), api.getEquipment()])
      .then(([insts, eq]) => {
        setInstruments(insts);
        setEquipmentList(eq);
        if (insts.length > 0) {
          setSelectedInstId(insts[0].id);
        }
      })
      .catch(console.error);
  }, []);

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
      const res = await api.createSession({
        instrument_id: selectedInstId,
        lab_id: 1,
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
    <div className="max-w-5xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Header */}
      <div className="pb-2 border-b border-[#D9D1C5] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-mono text-[#413B32]/70 hover:text-[#413B32] inline-flex items-center space-x-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              New NAWI Type-Evaluation Test Session Entry
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              FORM 01
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            Initialize an official OIML R-76 evaluation session with target instrument parameters and environmental conditions.
          </p>
        </div>
      </div>

      {/* OIML R-76 Workflow Progress */}
      <TestSessionProgress currentStep="instrument" />

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center space-x-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Official Form Surface */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 space-y-6 shadow-2xs font-mono">

        {/* Section 01: Instrument Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-1.5">
            <h2 className="text-xs font-bold uppercase text-[#413B32] tracking-wider">
              01. Instrument & Model Selection
            </h2>
            <span className="text-[10px] text-[#413B32]/60">STEP 01 OF 04</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#413B32] mb-1">
              Select Registered NAWI Instrument (Serial Number Register):
            </label>
            <select
              value={selectedInstId || ''}
              onChange={e => setSelectedInstId(parseInt(e.target.value))}
              className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-2 text-xs text-[#413B32] font-mono focus:outline-none focus:border-[#413B32]"
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
            <div className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-3 rounded-xs space-y-1.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#D9D1C5]/60 pb-1">
                <span className="font-bold text-[#413B32]">METROLOGICAL SPECIFICATION REGISTER</span>
                <span className="bg-[#FFFFFF] text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 text-[10px] font-bold">
                  Class {selectedInstrument.accuracy_class}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">MAX CAPACITY (Max):</span>
                  <span className="font-bold">{selectedInstrument.max_capacity} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">MIN CAPACITY (Min):</span>
                  <span className="font-bold">{selectedInstrument.min_capacity || 0.2} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">VERIFICATION INTERVAL (e):</span>
                  <span className="font-bold">{selectedInstrument.e} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">SCALE INTERVAL (d):</span>
                  <span className="font-bold">{selectedInstrument.d} kg</span>
                </div>
                <div>
                  <span className="text-[#413B32]/60 block text-[10px]">INTERVAL COUNT (n):</span>
                  <span className="font-bold">{selectedInstrument.n}</span>
                </div>
              </div>
            </div>
          )}

          {/* Prescribed OIML Tests Auto-Suggestion */}
          {suggestedTests && (
            <div className="bg-[#FFFFFF] border border-[#D9D1C5] p-3 rounded-xs space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-[#413B32] text-[11px] border-b border-[#D9D1C5]/50 pb-1">
                <Info className="w-3.5 h-3.5 text-[#413B32]" />
                <span>PRESCRIBED OIML R-76 TEST PROCEDURES (CLASS {suggestedTests.accuracy_class})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                {suggestedTests.suggested_tests.map((t: any) => (
                  <div key={t.code} className="bg-[#F1EADE]/40 border border-[#D9D1C5] p-2 rounded-xs">
                    <span className="font-bold text-[#413B32] block">{t.code}</span>
                    <span className="text-[10px] text-[#413B32]/70 block truncate">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 02: Environmental Conditions */}
        <div className="space-y-3 pt-3 border-t border-[#D9D1C5]">
          <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-1.5">
            <h2 className="text-xs font-bold uppercase text-[#413B32] tracking-wider">
              02. Environmental & Laboratory Conditions
            </h2>
            <span className="text-[10px] text-[#413B32]/60">STEP 02 OF 04</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#413B32]/70 mb-1">Ambient Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={env.temp_c}
                onChange={e => setEnv({ ...env, temp_c: parseFloat(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-xs text-[#413B32]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#413B32]/70 mb-1">Relative Humidity (%)</label>
              <input
                type="number"
                step="0.1"
                value={env.humidity_pct}
                onChange={e => setEnv({ ...env, humidity_pct: parseFloat(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-xs text-[#413B32]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#413B32]/70 mb-1">Barometric Pressure (hPa)</label>
              <input
                type="number"
                step="0.1"
                value={env.pressure_hpa}
                onChange={e => setEnv({ ...env, pressure_hpa: parseFloat(e.target.value) })}
                className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-xs text-[#413B32]"
              />
            </div>
          </div>
        </div>

        {/* Section 03: Reference Calibration Equipment */}
        <div className="space-y-3 pt-3 border-t border-[#D9D1C5]">
          <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-1.5">
            <h2 className="text-xs font-bold uppercase text-[#413B32] tracking-wider">
              03. Reference Standards & Equipment Selection
            </h2>
            <span className="text-[10px] text-[#413B32]/60">STEP 03 OF 04</span>
          </div>

          {expiredEquipSelected && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded-xs text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>CALIBRATION WARNING: One or more selected standard mass weight sets have EXPIRED calibration certificates!</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto border border-[#D9D1C5] rounded-xs p-2 bg-[#FFFFFF]">
            {equipmentList.map(eq => (
              <label key={eq.id} className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F1EADE]/40 cursor-pointer text-xs border border-[#D9D1C5]/40">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedEquipIds.includes(eq.id)}
                    onChange={() => handleToggleEquip(eq.id)}
                    className="rounded-xs border-[#D9D1C5] text-[#413B32]"
                  />
                  <span className="font-bold text-[#413B32]">{eq.identifier} ({eq.type})</span>
                  <span className="text-[#413B32]/60 text-[11px]">Cert: {eq.calibration_cert_no}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-xs border ${eq.is_expired ? 'bg-red-50 text-red-900 border-red-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300'}`}>
                  {eq.is_expired ? `EXPIRED (${eq.calibration_due_date})` : `CALIBRATED DUE: ${eq.calibration_due_date}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-[#D9D1C5] flex items-center justify-between">
          <span className="text-[11px] text-[#413B32]/60">
            Form 01 │ Legal Metrology Laboratory Evaluation Entry
          </span>
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-bold px-5 py-2 rounded-xs text-xs flex items-center space-x-2 transition border border-[#413B32] disabled:opacity-50"
          >
            <span>{loading ? 'Initializing Session...' : 'Initialize Test Session & Enter Observations →'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
