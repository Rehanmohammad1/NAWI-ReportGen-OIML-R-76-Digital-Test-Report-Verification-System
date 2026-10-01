import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Equipment } from '../types';
import { Wrench, AlertTriangle, CheckCircle, Plus } from 'lucide-react';

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEq, setNewEq] = useState({
    lab_id: 1, type: 'standard_weight', identifier: '',
    calibration_cert_no: '', calibration_date: '2025-01-01', calibration_due_date: '2027-01-01'
  });

  const loadEquip = async () => {
    try {
      setLoading(true);
      const data = await api.getEquipment();
      setEquipment(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquip();
  }, []);

  const handleCreateEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment(newEq);
      setShowModal(false);
      loadEquip();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-mono text-[#413B32]/70">Loading Reference Standards equipment...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D1C5]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              Calibration Reference Equipment Registry
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              ISO/IEC 17025 STANDARDS
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            Tracking standard mass weight sets, thermometers, and pressure barometers with calibration alerts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs px-3.5 py-1.5 rounded-xs transition inline-flex items-center space-x-1.5 border border-[#413B32]"
        >
          <Plus className="w-3.5 h-3.5 text-[#A7BABA]" />
          <span>+ Add Reference Equipment</span>
        </button>
      </div>

      {/* Equipment Register Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">Identifier / Code</th>
                <th className="p-2.5">Equipment Type</th>
                <th className="p-2.5">Calibration Cert No</th>
                <th className="p-2.5">Calibration Date</th>
                <th className="p-2.5">Due Date</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {equipment.map(e => {
                const isExpired = new Date(e.calibration_due_date) < new Date();
                return (
                  <tr key={e.id} className="hover:bg-[#F1EADE]/30 transition">
                    <td className="p-2.5 font-mono font-bold text-[#413B32]">{e.identifier}</td>
                    <td className="p-2.5 uppercase font-mono text-[11px]">{e.type.replace('_', ' ')}</td>
                    <td className="p-2.5 font-mono">{e.calibration_cert_no}</td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/70">{e.calibration_date}</td>
                    <td className="p-2.5 font-mono text-[11px] font-bold">{e.calibration_due_date}</td>
                    <td className="p-2.5 text-right font-mono">
                      {isExpired ? (
                        <span className="bg-red-50 text-red-900 border border-red-300 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                          VALID & CALIBRATED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Add Reference Standard Equipment</h3>
            <form onSubmit={handleCreateEquip} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Equipment Identifier</label>
                <input required type="text" placeholder="e.g. STD-MASS-F1-001" value={newEq.identifier} onChange={e => setNewEq({ ...newEq, identifier: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Equipment Type</label>
                <select value={newEq.type} onChange={e => setNewEq({ ...newEq, type: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  <option value="standard_weight">Standard Mass Weights (E2/F1/F2/M1)</option>
                  <option value="thermometer">Reference Thermometer</option>
                  <option value="barometer">Reference Barometer / Pressure Gauge</option>
                  <option value="hygrometer">Relative Humidity Meter</option>
                </select>
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Calibration Certificate No.</label>
                <input required type="text" value={newEq.calibration_cert_no} onChange={e => setNewEq({ ...newEq, calibration_cert_no: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Calibration Date</label>
                  <input required type="date" value={newEq.calibration_date} onChange={e => setNewEq({ ...newEq, calibration_date: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Due Date</label>
                  <input required type="date" value={newEq.calibration_due_date} onChange={e => setNewEq({ ...newEq, calibration_due_date: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
