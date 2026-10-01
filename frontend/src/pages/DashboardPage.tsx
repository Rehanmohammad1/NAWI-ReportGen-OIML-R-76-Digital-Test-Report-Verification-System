import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { TestSessionProgress } from '../components/TestSessionProgress';
import { TechnicalSketchBg } from '../components/TechnicalSketchBg';
import { 
  FileText, Clock, AlertTriangle, CheckCircle2, 
  PlusCircle, ShieldCheck, ArrowRight, Users, Scale, AlertOctagon, Activity, ChevronRight, Layers, FileCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      user?.role === 'admin' ? api.getUsersSummary().catch(() => null) : Promise.resolve(null),
      (user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') 
        ? api.getSessions('under_review').catch(() => []) 
        : Promise.resolve([])
    ]).then(([dashData, uStats, rQueue]) => {
      setSummary(dashData);
      setUserStats(uStats);
      setReviewQueue(rQueue || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user?.role]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': 
        return 'bg-[#F3EFEA] text-[#554F47] border-[#E6E2DC] font-medium';
      case 'submitted': 
        return 'bg-blue-50 text-blue-800 border-blue-200 font-medium';
      case 'under_review': 
        return 'bg-[#FFF8EE] text-[#B86200] border-[#FBE3B5] font-semibold';
      case 'finalized': 
        return 'bg-[#EBF5F1] text-[#2D5A4B] border-[#BDE3D5] font-semibold';
      default: 
        return 'bg-[#F3EFEA] text-[#666059] border-[#E6E2DC]';
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-[#666059] flex flex-col items-center justify-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#C87A57] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-wider">Loading Legal Metrology Workspace...</span>
      </div>
    );
  }

  const activeSessions = summary?.recent_sessions?.filter(
    (s: any) => s.status === 'draft' || s.status === 'submitted'
  ) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-[#25221F] relative">
      <TechnicalSketchBg className="absolute top-0 right-0 w-96 h-64 pointer-events-none" />
      <DemoWatermark />

      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E6E2DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#C87A57]"></span>
            <span>Legal Metrology Testing Laboratory</span>
            <span className="text-[#999289]">|</span>
            <span className="bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#E6E2DC] text-[#25221F] font-semibold">
              OIML R-76 ED. 2006
            </span>
          </div>
          <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
            Laboratory Executive Dashboard
          </h1>
          <p className="text-xs text-[#666059] mt-1">
            Operator: <strong className="text-[#25221F]">{user?.name}</strong> ({user?.role.toUpperCase().replace('_', ' ')}) &nbsp;&bull;&nbsp; Facility: <strong className="text-[#25221F]">{user?.lab_name || 'Central Metrology Lab'}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {(user?.role === 'inspector' || user?.role === 'lab_manager' || user?.role === 'admin') && (
            <NavLink
              to="/sessions/new"
              className="bg-[#C87A57] hover:bg-[#B36846] text-white font-medium text-xs px-4 py-2 rounded-md transition shadow-xs flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Evaluation</span>
            </NavLink>
          )}

          {(user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') && (
            <NavLink
              to="/review-queue"
              className="bg-white hover:bg-[#FAF6F0] text-[#25221F] font-medium text-xs px-4 py-2 rounded-md transition border border-[#E6E2DC] shadow-2xs flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C87A57]" />
              <span>Review Queue ({reviewQueue.length || summary?.under_review_count || 0})</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#666059] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total Evaluations</span>
            <FileText className="w-4 h-4 text-[#C87A57]" />
          </div>
          <div className="text-2xl font-serif-header font-bold text-[#25221F]">
            {summary?.total_sessions || 0}
          </div>
          <span className="text-[10px] text-[#666059] font-sans">Registered test records</span>
        </div>

        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#666059] mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Draft Sessions</span>
            <Clock className="w-4 h-4 text-[#666059]" />
          </div>
          <div className="text-2xl font-serif-header font-bold text-[#25221F]">
            {summary?.draft_count || 0}
          </div>
          <span className="text-[10px] text-[#666059] font-sans">In-progress evaluations</span>
        </div>

        <div className="bg-white border border-[#FBE3B5] rounded-lg p-4 shadow-2xs bg-[#FFFDF9]">
          <div className="flex items-center justify-between text-[#B86200] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <AlertTriangle className="w-4 h-4 text-[#D9822B]" />
          </div>
          <div className="text-2xl font-serif-header font-bold text-[#B86200]">
            {summary?.under_review_count || 0}
          </div>
          <span className="text-[10px] text-[#B86200]/80 font-sans">Awaiting approval</span>
        </div>

        <div className="bg-white border border-[#BDE3D5] rounded-lg p-4 shadow-2xs bg-[#F7FCFA]">
          <div className="flex items-center justify-between text-[#2D5A4B] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Finalized Reports</span>
            <ShieldCheck className="w-4 h-4 text-[#3E7B66]" />
          </div>
          <div className="text-2xl font-serif-header font-bold text-[#2D5A4B]">
            {summary?.finalized_count || 0}
          </div>
          <span className="text-[10px] text-[#2D5A4B]/80 font-sans">Issued & signed</span>
        </div>

        <div className="bg-white border border-[#F5C6C6] rounded-lg p-4 shadow-2xs bg-[#FFFDFD]">
          <div className="flex items-center justify-between text-[#C54B4B] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired Standards</span>
            <AlertOctagon className="w-4 h-4 text-[#C54B4B]" />
          </div>
          <div className="text-2xl font-serif-header font-bold text-[#C54B4B]">
            {summary?.expired_equipment_count || 0}
          </div>
          <span className="text-[10px] text-[#C54B4B]/80 font-sans">Calibration overdue</span>
        </div>
      </div>

      {/* OIML R-76 Workflow Stage Bar */}
      <TestSessionProgress currentStep="tests" />

      {/* Reference Standards Calibration Warning */}
      {summary?.expired_equipment_count > 0 && (
        <div className="bg-[#FFF5F5] border border-[#F5C6C6] rounded-md p-3 text-xs text-[#9B2C2C] flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <AlertOctagon className="w-4 h-4 text-[#C54B4B] flex-shrink-0" />
            <span>
              <strong>Calibration Alert:</strong> {summary.expired_equipment_count} reference standard weight equipment item(s) are past calibration due date.
            </span>
          </div>
          <NavLink to="/equipment" className="text-xs font-medium text-[#C54B4B] hover:underline flex items-center gap-1">
            View Standards <ArrowRight className="w-3 h-3" />
          </NavLink>
        </div>
      )}

      {/* Workspace Tables & Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2-Column: Active Sessions & Recent Test Reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Test Sessions Table */}
          <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#E6E2DC] bg-[#FAF6F0] flex items-center justify-between">
              <h2 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C87A57]" />
                Active Evaluation Sessions
              </h2>
              <NavLink
                to="/sessions/new"
                className="text-xs font-medium text-[#C87A57] hover:underline flex items-center gap-1"
              >
                + Create Session
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
                  <tr>
                    <th className="p-3 pl-5">Session Ref</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Serial No</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-xs text-[#666059]">
                        No active in-progress test sessions. Click "+ New Evaluation" to start.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#FAF6F0]/60 transition">
                        <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{s.session_number}</td>
                        <td className="p-3">{s.model_name}</td>
                        <td className="p-3 font-mono text-[11px] text-[#666059]">{s.serial_number}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${getStatusBadgeClass(s.status)}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 pr-5 text-right">
                          <NavLink
                            to={`/sessions/${s.id}`}
                            className="text-[#C87A57] font-medium hover:underline text-xs"
                          >
                            Open →
                          </NavLink>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Reports Register */}
          <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#E6E2DC] bg-[#FAF6F0] flex items-center justify-between">
              <h2 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3E7B66]" />
                Recent Test Certificates
              </h2>
              <NavLink
                to="/repository"
                className="text-xs font-medium text-[#C87A57] hover:underline"
              >
                View Repository Register →
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
                  <tr>
                    <th className="p-3 pl-5">Session Ref</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
                  {summary?.recent_sessions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FAF6F0]/60 transition">
                      <td className="p-3 pl-5 font-mono font-semibold text-[#25221F]">{s.session_number}</td>
                      <td className="p-3">{s.model_name}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${getStatusBadgeClass(s.status)}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#666059]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <NavLink
                          to={`/sessions/${s.id}`}
                          className="text-[#C87A57] font-medium hover:underline text-xs"
                        >
                          View →
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1-Column: Review Queue & Quick Controls */}
        <div className="space-y-6">

          {/* Review Queue Register Box */}
          <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-[#E6E2DC] bg-[#FAF6F0] flex items-center justify-between">
              <h3 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D9822B]" />
                Pending Review Queue
              </h3>
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF8EE] text-[#B86200] border border-[#FBE3B5]">
                {reviewQueue.length}
              </span>
            </div>

            <div className="divide-y divide-[#E6E2DC]">
              {reviewQueue.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#666059]">
                  No items in review queue.
                </div>
              ) : (
                reviewQueue.slice(0, 4).map((rq: any) => (
                  <div key={rq.id} className="p-3.5 hover:bg-[#FAF6F0]/60 transition space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#25221F]">{rq.session_number}</span>
                      <span className="text-[10px] font-mono text-[#666059]">
                        {new Date(rq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#25221F]">{rq.model_name || 'NAWI Instrument'}</p>
                    <div className="flex items-center justify-between pt-1.5 text-xs">
                      <span className="text-[11px] text-[#666059]">Inspector: {rq.inspector_name || 'Staff'}</span>
                      <NavLink
                        to={`/sessions/${rq.id}`}
                        className="font-medium text-[#C87A57] hover:underline text-xs flex items-center gap-0.5"
                      >
                        Review <ChevronRight className="w-3 h-3" />
                      </NavLink>
                    </div>
                  </div>
                ))
              )}
            </div>

            {(user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') && (
              <div className="p-2.5 border-t border-[#E6E2DC] bg-[#FAF6F0]/50 text-center">
                <NavLink
                  to="/review-queue"
                  className="text-xs font-medium text-[#C87A57] hover:underline"
                >
                  Full Review Queue ({reviewQueue.length}) →
                </NavLink>
              </div>
            )}
          </div>

          {/* Authority Quick Links */}
          <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#666059] border-b border-[#E6E2DC] pb-2">
              Laboratory Quick Actions
            </h3>
            
            <div className="space-y-2 text-xs">
              <NavLink
                to="/instruments"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#FAF6F0] border border-[#E6E2DC] text-[#25221F] transition"
              >
                <span className="font-medium">Instrument Registry</span>
                <ChevronRight className="w-4 h-4 text-[#666059]" />
              </NavLink>

              <NavLink
                to="/equipment"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#FAF6F0] border border-[#E6E2DC] text-[#25221F] transition"
              >
                <span className="font-medium">Reference Standards</span>
                <ChevronRight className="w-4 h-4 text-[#666059]" />
              </NavLink>

              <NavLink
                to="/rules"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#FAF6F0] border border-[#E6E2DC] text-[#25221F] transition"
              >
                <span className="font-medium">OIML Rule Engine</span>
                <ChevronRight className="w-4 h-4 text-[#666059]" />
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/users"
                  className="flex items-center justify-between p-2.5 rounded-md bg-[#25221F] text-white hover:bg-[#38332F] transition font-medium"
                >
                  <span>User Authority ({userStats?.active_users || 0} Active)</span>
                  <ChevronRight className="w-4 h-4 text-[#C87A57]" />
                </NavLink>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

