import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { TestSessionProgress } from '../components/TestSessionProgress';
import { 
  FileText, Clock, AlertTriangle, CheckCircle, 
  PlusCircle, ShieldCheck, ArrowRight, Users, Scale, AlertOctagon, Activity
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
        return 'bg-[#F1EADE] text-[#413B32] border-[#D9D1C5]';
      case 'submitted': 
        return 'bg-[#A7BABA]/20 text-[#413B32] border-[#A7BABA]';
      case 'under_review': 
        return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
      case 'finalized': 
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
      default: 
        return 'bg-[#F1EADE]/50 text-[#413B32]/70 border-[#D9D1C5]';
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-xs text-[#413B32]/70 flex flex-col items-center justify-center space-y-3">
        <div className="w-5 h-5 border-2 border-[#413B32] border-t-transparent rounded-full animate-spin"></div>
        <span>INITIALIZING LEGAL METROLOGY LABORATORY WORKSPACE...</span>
      </div>
    );
  }

  const activeSessions = summary?.recent_sessions?.filter(
    (s: any) => s.status === 'draft' || s.status === 'submitted'
  ) || [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-[#413B32]">
      <DemoWatermark />

      {/* Institutional Header & Workspace Metadata */}
      <div className="border-b border-[#D9D1C5] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              Legal Metrology Testing Laboratory Workspace
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              OIML R-76 ED. 2006
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-1">
            OPERATOR: <span className="font-semibold text-[#413B32]">{user?.name}</span> ({user?.role.toUpperCase().replace('_', ' ')}) │ LAB: <span className="font-semibold text-[#413B32]">{user?.lab_name || 'Central Metrology Lab'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {(user?.role === 'inspector' || user?.role === 'lab_manager' || user?.role === 'admin') && (
            <NavLink
              to="/sessions/new"
              className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs px-3.5 py-1.5 rounded-sm transition flex items-center space-x-1.5 border border-[#413B32]"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#A7BABA]" />
              <span>+ New Evaluation</span>
            </NavLink>
          )}

          {(user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') && (
            <NavLink
              to="/review-queue"
              className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] font-mono text-xs px-3.5 py-1.5 rounded-sm transition flex items-center space-x-1.5 border border-[#D9D1C5]"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#413B32]" />
              <span>Review Queue ({reviewQueue.length || summary?.under_review_count || 0})</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Compact Laboratory Metric Strip (Replaces 5 floating cards) */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#D9D1C5]/60 gap-3 md:gap-0">
          <div className="px-3 py-1 flex items-center justify-between md:block">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#413B32]/70 block">Total Evaluations</span>
            <span className="text-lg font-bold font-mono text-[#413B32]">{summary?.total_sessions || 0}</span>
          </div>

          <div className="px-3 py-1 flex items-center justify-between md:block">
            <span className="text-[10px] font-mono font-semibold uppercase text-[#413B32]/70 block">Draft Sessions</span>
            <span className="text-lg font-bold font-mono text-[#413B32]">{summary?.draft_count || 0}</span>
          </div>

          <div className="px-3 py-1 flex items-center justify-between md:block">
            <span className="text-[10px] font-mono font-semibold uppercase text-amber-900 block">Pending Review</span>
            <span className="text-lg font-bold font-mono text-amber-900">{summary?.under_review_count || 0}</span>
          </div>

          <div className="px-3 py-1 flex items-center justify-between md:block">
            <span className="text-[10px] font-mono font-semibold uppercase text-emerald-900 block">Finalized Reports</span>
            <span className="text-lg font-bold font-mono text-emerald-900">{summary?.finalized_count || 0}</span>
          </div>

          <div className="px-3 py-1 flex items-center justify-between md:block">
            <span className="text-[10px] font-mono font-semibold uppercase text-red-900 block">Expired Standards</span>
            <span className="text-lg font-bold font-mono text-red-800">{summary?.expired_equipment_count || 0}</span>
          </div>
        </div>
      </div>

      {/* OIML R-76 Workflow Stage Bar */}
      <TestSessionProgress currentStep="tests" />

      {/* Reference Standards Calibration Warning */}
      {summary?.expired_equipment_count > 0 && (
        <div className="bg-red-50/80 border border-red-200 rounded-sm p-2.5 text-xs text-red-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span>
              <strong>Calibration Alert:</strong> {summary.expired_equipment_count} reference standard weight equipment item(s) are past calibration due date.
            </span>
          </div>
          <NavLink to="/equipment" className="font-mono text-[11px] underline hover:text-red-700 font-semibold">
            View Standards →
          </NavLink>
        </div>
      )}

      {/* Workspace Register Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left 2-Column: Active Sessions & Recent Test Reports */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Active Test Sessions Table */}
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#D9D1C5] bg-[#F1EADE]/40 flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#413B32]" />
                Active Evaluation Sessions
              </h2>
              <NavLink
                to="/sessions/new"
                className="text-[11px] font-mono text-[#413B32] hover:underline"
              >
                + Create Session
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
                  <tr>
                    <th className="p-2.5">Session Ref</th>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Serial No</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-xs text-[#413B32]/60 font-mono">
                        No active in-progress test sessions. Click "+ New Evaluation" to start.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#F1EADE]/30 transition">
                        <td className="p-2.5 font-mono font-bold">{s.session_number}</td>
                        <td className="p-2.5">{s.model_name}</td>
                        <td className="p-2.5 font-mono text-[11px]">{s.serial_number}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase border ${getStatusBadgeClass(s.status)}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          <NavLink
                            to={`/sessions/${s.id}`}
                            className="text-[#413B32] font-mono font-semibold hover:underline text-[11px]"
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
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#D9D1C5] bg-[#F1EADE]/40 flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#413B32]" />
                Recent Test Certificates
              </h2>
              <NavLink
                to="/repository"
                className="text-[11px] font-mono text-[#413B32] hover:underline"
              >
                View Repository Register →
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
                  <tr>
                    <th className="p-2.5">Session Ref</th>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
                  {summary?.recent_sessions?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#F1EADE]/30 transition">
                      <td className="p-2.5 font-mono font-bold">{s.session_number}</td>
                      <td className="p-2.5">{s.model_name}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase border ${getStatusBadgeClass(s.status)}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-[#413B32]/70">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2.5 text-right">
                        <NavLink
                          to={`/sessions/${s.id}`}
                          className="text-[#413B32] font-mono font-semibold hover:underline text-[11px]"
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
        <div className="space-y-5">

          {/* Review Queue Register Box */}
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-[#D9D1C5] bg-[#F1EADE]/40 flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-[#413B32] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-amber-800" />
                Pending Review Queue
              </h3>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-xs bg-amber-100 text-amber-900 border border-amber-300">
                {reviewQueue.length}
              </span>
            </div>

            <div className="divide-y divide-[#D9D1C5]/50">
              {reviewQueue.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#413B32]/60 font-mono">
                  No items in review queue.
                </div>
              ) : (
                reviewQueue.slice(0, 4).map((rq: any) => (
                  <div key={rq.id} className="p-2.5 hover:bg-[#F1EADE]/30 transition space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{rq.session_number}</span>
                      <span className="text-[10px] font-mono text-[#413B32]/60">
                        {new Date(rq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#413B32]">{rq.model_name || 'NAWI Instrument'}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="font-mono text-[#413B32]/70">{rq.inspector_name || 'Staff'}</span>
                      <NavLink
                        to={`/sessions/${rq.id}`}
                        className="font-mono font-semibold text-[#413B32] hover:underline"
                      >
                        Review →
                      </NavLink>
                    </div>
                  </div>
                ))
              )}
            </div>

            {(user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') && (
              <div className="p-2 border-t border-[#D9D1C5] bg-[#F1EADE]/20 text-center">
                <NavLink
                  to="/review-queue"
                  className="font-mono text-xs font-semibold text-[#413B32] hover:underline"
                >
                  Full Review Queue ({reviewQueue.length}) →
                </NavLink>
              </div>
            )}
          </div>

          {/* Authority Quick Links */}
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3.5 space-y-2.5">
            <h3 className="text-xs font-bold font-mono text-[#413B32] uppercase tracking-wider border-b border-[#D9D1C5]/60 pb-1.5">
              Laboratory Management Quick Actions
            </h3>
            
            <div className="space-y-1.5 font-mono text-xs">
              <NavLink
                to="/instruments"
                className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F1EADE]/50 border border-[#D9D1C5]/40 text-[#413B32] transition"
              >
                <span>Instrument Registry</span>
                <span>→</span>
              </NavLink>

              <NavLink
                to="/equipment"
                className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F1EADE]/50 border border-[#D9D1C5]/40 text-[#413B32] transition"
              >
                <span>Reference Standards</span>
                <span>→</span>
              </NavLink>

              <NavLink
                to="/rules"
                className="flex items-center justify-between p-2 rounded-xs hover:bg-[#F1EADE]/50 border border-[#D9D1C5]/40 text-[#413B32] transition"
              >
                <span>OIML Rule Engine</span>
                <span>→</span>
              </NavLink>

              {user?.role === 'admin' && (
                <NavLink
                  to="/users"
                  className="flex items-center justify-between p-2 rounded-xs bg-[#413B32] text-[#F1EADE] hover:bg-[#413B32]/90 transition"
                >
                  <span>User Authority ({userStats?.active_users || 0} Active)</span>
                  <span>→</span>
                </NavLink>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
