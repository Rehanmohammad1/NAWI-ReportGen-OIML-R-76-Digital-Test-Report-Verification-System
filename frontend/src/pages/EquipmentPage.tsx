import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Equipment } from '../types';
import { Wrench, AlertTriangle, CheckCircle, Plus, CheckCircle2 } from 'lucide-react';

export const EquipmentPage: React.FC = () => {
  const { user, activeLabId } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEq, setNewEq] = useState({
    lab_id: activeLabId || user?.lab_id || 1, type: 'standard_weight', identifier: '',
    calibration_cert_no: '', calibration_date: '2025-01-01', calibration_due_date: '2027-01-01'
  });

  const loadEquip = async () => {
    try {
      setLoading(true);
      const data = await api.getEquipment(activeLabId);
      setEquipment(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNewEq(prev => ({ ...prev, lab_id: activeLabId || user?.lab_id || 1 }));
    loadEquip();
  }, [activeLabId]);

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

  if (loading) return <div className="p-12 text-center text-xs font-mono text-[#666059]">Loading Reference Standards equipment...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E6E2DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#C87A57]"></span>
            <span>ISO/IEC 17025 Reference Standards</span>
          </div>
          <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
            Calibration Reference Equipment Registry
          </h1>
          <p className="text-xs text-[#666059] mt-1">
            Tracking standard mass weight sets, thermometers, and pressure barometers with calibration alerts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#C87A57] hover:bg-[#B36846] text-white font-medium text-xs px-4 py-2 rounded-md transition shadow-xs inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Reference Equipment</span>
        </button>
      </div>

      {/* Equipment Register Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC]">
          <h2 className="text-sm font-semibold font-serif-header text-[#25221F]">Reference Standards Register</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">Identifier / Code</th>
                <th className="p-3">Equipment Type</th>
                <th className="p-3">Calibration Cert No</th>
                <th className="p-3">Calibration Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 pr-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {equipment.map(e => {
                const isExpired = new Date(e.calibration_due_date) < new Date();
                return (
                  <tr key={e.id} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{e.identifier}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059] uppercase">{e.type.replace('_', ' ')}</td>
                    <td className="p-3 font-mono font-medium">{e.calibration_cert_no}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">{e.calibration_date}</td>
                    <td className="p-3 font-mono text-[11px] font-semibold text-[#25221F]">{e.calibration_due_date}</td>
                    <td className="p-3 pr-5 text-right font-mono">
                      {isExpired ? (
                        <span className="bg-[#FFF5F5] text-[#9B2C2C] border border-[#F5C6C6] px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                          EXPIRED
                        </span>
                      ) : (
                        <span className="bg-[#EBF5F1] text-[#2D5A4B] border border-[#BDE3D5] px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
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
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Add Reference Standard Equipment</h3>
            <form onSubmit={handleCreateEquip} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Equipment Identifier</label>
                <input required type="text" placeholder="e.g. STD-MASS-F1-001" value={newEq.identifier} onChange={e => setNewEq({ ...newEq, identifier: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Equipment Type</label>
                <select value={newEq.type} onChange={e => setNewEq({ ...newEq, type: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  <option value="standard_weight">Standard Mass Weights (E2/F1/F2/M1)</option>
                  <option value="thermometer">Reference Thermometer</option>
                  <option value="barometer">Reference Barometer / Pressure Gauge</option>
                  <option value="hygrometer">Relative Humidity Meter</option>
                </select>
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Calibration Certificate No.</label>
                <input required type="text" value={newEq.calibration_cert_no} onChange={e => setNewEq({ ...newEq, calibration_cert_no: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Calibration Date</label>
                  <input required type="date" value={newEq.calibration_date} onChange={e => setNewEq({ ...newEq, calibration_date: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Due Date</label>
                  <input required type="date" value={newEq.calibration_due_date} onChange={e => setNewEq({ ...newEq, calibration_due_date: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                </div>
              </div>
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Save Equipment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

