import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { 
  FileText, Clock, CheckCircle2, Package, Search, 
  ArrowRight, Activity, Plus, Scale, ChevronRight, BookOpen
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, activeLabId, activeLabName } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDashboardSummary(activeLabId).catch(() => null),
      (user?.role === 'reviewer' || user?.role === 'lab_manager' || user?.role === 'admin') 
        ? api.getSessions('under_review', activeLabId).catch(() => []) 
        : Promise.resolve([])
    ]).then(([dashData, rQueue]) => {
      setSummary(dashData);
      setReviewQueue(rQueue || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user?.role, activeLabId]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
      case 'submitted':
      case 'in_progress':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#E1F0FF] text-[#1E56A0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E56A0]"></span>
            <span>In Progress</span>
          </span>
        );
      case 'under_review': 
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#FFF0E0] text-[#D97706]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            <span>Pending Review</span>
          </span>
        );
      case 'finalized': 
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#E2F4EA] text-[#2D5A4B]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A4B]"></span>
            <span>Completed</span>
          </span>
        );
      default: 
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#E5DDD2] text-[#5C554E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5C554E]"></span>
            <span>{status}</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-sm text-[#5C554E] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-7 h-7 border-2 border-[#9C5A3C] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-mono text-xs uppercase tracking-wider text-[#8C8275]">Loading NAWI Laboratory Workspace...</span>
      </div>
    );
  }

  const recentSessions = summary?.recent_sessions || [
    { id: 1, session_number: 'TS-2025-084', model_name: 'Avery ABW-220', test_type: 'Weighing Performance', status: 'submitted', created_at: '2025-08-14' },
    { id: 2, session_number: 'TS-2025-083', model_name: 'Sartorius BSA224', test_type: 'Repeatability', status: 'under_review', created_at: '2025-08-14' },
    { id: 3, session_number: 'TS-2025-082', model_name: 'Essae DS-252', test_type: 'Eccentricity', status: 'finalized', created_at: '2025-08-13' },
    { id: 4, session_number: 'TS-2025-081', model_name: 'Mettler ME204', test_type: 'Discrimination', status: 'finalized', created_at: '2025-08-12' },
  ];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto font-sans text-[#24211D]">
      <DemoWatermark />

      {/* Greeting Banner & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <p className="text-xs font-sans text-[#6B6359] font-medium">Welcome back,</p>
          <h1 className="font-serif-header text-3xl md:text-4xl font-bold text-[#24211D] tracking-tight leading-tight">
            {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : 'Inspector'}
          </h1>
          <p className="text-xs text-[#6B6359] mt-0.5">
            {user?.lab_name || 'Delhi Central Legal Metrology Laboratory'} &nbsp;|&nbsp; <strong className="text-[#24211D]">{user?.role ? user.role.toUpperCase().replace('_', ' ') : 'INSPECTOR'}</strong>
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8C8275] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search instruments, reports, sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl pl-9 pr-4 py-2 text-xs text-[#24211D] placeholder-[#8C8275] focus:outline-none focus:border-[#9C5A3C] shadow-2xs"
          />
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Test Sessions */}
        <div 
          onClick={() => navigate('/sessions/new')}
          className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#9C5A3C] transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#D4E3DC] text-[#2D5A4B] flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B6359]">Active Test Sessions</p>
              <p className="text-2xl font-serif-header font-bold text-[#24211D]">
                {summary?.draft_count != null ? summary.draft_count + (summary.submitted_count || 0) : 12}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#8C8275]" />
        </div>

        {/* Card 2: Pending Reviews */}
        <div 
          onClick={() => navigate('/review-queue')}
          className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#9C5A3C] transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#F7DFCE] text-[#B86200] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B6359]">Pending Reviews</p>
              <p className="text-2xl font-serif-header font-bold text-[#24211D]">
                {summary?.under_review_count != null ? summary.under_review_count : reviewQueue.length || 5}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#8C8275]" />
        </div>

        {/* Card 3: Completed Reports */}
        <div 
          onClick={() => navigate('/repository')}
          className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#9C5A3C] transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#D8E6DF] text-[#2D5A4B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B6359]">Completed Reports</p>
              <p className="text-2xl font-serif-header font-bold text-[#24211D]">
                {summary?.finalized_count != null ? summary.finalized_count : 48}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#8C8275]" />
        </div>

        {/* Card 4: Registered Instruments */}
        <div 
          onClick={() => navigate('/instruments')}
          className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-[#9C5A3C] transition-all"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg bg-[#EBDDCF] text-[#864B30] flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B6359]">Registered Instruments</p>
              <p className="text-2xl font-serif-header font-bold text-[#24211D]">
                {summary?.total_sessions != null ? summary.total_sessions : 27}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[#8C8275]" />
        </div>

      </div>

      {/* Middle Row: Recent Test Sessions Table & Today's Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3: Recent Test Sessions Table */}
        <div className="lg:col-span-2 bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-[#E2DDD5] flex items-center justify-between">
              <h2 className="text-base font-bold font-serif-header text-[#24211D] flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-[#9C5A3C]" />
                Recent Test Sessions
              </h2>
              <NavLink to="/repository" className="text-xs font-semibold text-[#9C5A3C] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EFEAE2] text-[#6B6359] font-mono font-semibold uppercase text-[10px] border-b border-[#E2DDD5]">
                  <tr>
                    <th className="p-3.5 pl-5">Session No.</th>
                    <th className="p-3.5">Instrument</th>
                    <th className="p-3.5">Test Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DDD5] text-[#24211D]">
                  {recentSessions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#EFEAE2]/60 transition">
                      <td className="p-3.5 pl-5 font-mono font-bold text-[#24211D]">{s.session_number}</td>
                      <td className="p-3.5 font-medium">{s.model_name}</td>
                      <td className="p-3.5 text-[#6B6359]">{s.test_type || 'Weighing Performance'}</td>
                      <td className="p-3.5">{renderStatusBadge(s.status)}</td>
                      <td className="p-3.5 font-mono text-[11px] text-[#6B6359]">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '14 Aug 2025'}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <NavLink to={`/sessions/${s.id}`} className="text-[#9C5A3C] font-bold hover:underline flex items-center justify-end gap-0.5">
                          {s.status === 'finalized' ? 'View' : 'Open'} <ArrowRight className="w-3 h-3" />
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1/3: Today's Activity Timeline */}
        <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-5 shadow-2xs flex flex-col">
          <h2 className="text-base font-bold font-serif-header text-[#24211D] flex items-center gap-2 mb-4 border-b border-[#E2DDD5] pb-3">
            <Activity className="w-4.5 h-4.5 text-[#9C5A3C]" />
            Today's Activity
          </h2>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#C7C0B4] flex-1">
            <div className="flex items-start space-x-3.5 relative pl-7">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] ring-4 ring-[#FAF7F2] absolute left-2 top-1.5"></span>
              <span className="font-mono text-[11px] font-bold text-[#8C8275] shrink-0 w-12">10:30</span>
              <p className="text-xs text-[#24211D] leading-snug">Test session <strong>TS-2025-084</strong> updated</p>
            </div>

            <div className="flex items-start space-x-3.5 relative pl-7">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] ring-4 ring-[#FAF7F2] absolute left-2 top-1.5"></span>
              <span className="font-mono text-[11px] font-bold text-[#8C8275] shrink-0 w-12">09:15</span>
              <p className="text-xs text-[#24211D] leading-snug">Evidence file uploaded (TS-2025-083)</p>
            </div>

            <div className="flex items-start space-x-3.5 relative pl-7">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] ring-4 ring-[#FAF7F2] absolute left-2 top-1.5"></span>
              <span className="font-mono text-[11px] font-bold text-[#8C8275] shrink-0 w-12">08:40</span>
              <p className="text-xs text-[#24211D] leading-snug">New instrument registered (<span className="font-mono">SN: ABC-1234</span>)</p>
            </div>

            <div className="flex items-start space-x-3.5 relative pl-7">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] ring-4 ring-[#FAF7F2] absolute left-2 top-1.5"></span>
              <span className="font-mono text-[11px] font-bold text-[#8C8275] shrink-0 w-12">08:30</span>
              <p className="text-xs text-[#24211D] leading-snug">Report RPT-2025-032 finalized</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Test Sessions Chart, Compliance Donut & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Test Sessions Bar Chart */}
        <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold font-serif-header text-[#24211D]">Test Sessions <span className="text-xs font-sans font-normal text-[#8C8275]">(Last 30 Days)</span></h3>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-[#6B6359]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3E7B66]"></span> Completed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> In Progress</span>
            </div>
          </div>

          {/* Simple Clean Bar Chart Representation */}
          <div className="h-36 flex items-end justify-between gap-1.5 pt-4 border-b border-[#E2DDD5] pb-2">
            {[
              { day: 'Jul 15', green: 2, blue: 4 },
              { day: 'Jul 20', green: 3, blue: 5 },
              { day: 'Jul 25', green: 5, blue: 7 },
              { day: 'Jul 30', green: 4, blue: 8 },
              { day: 'Aug 04', green: 6, blue: 9 },
              { day: 'Aug 09', green: 5, blue: 8 },
              { day: 'Aug 14', green: 6, blue: 7 },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  <div className="w-2.5 bg-[#3E7B66] rounded-t-xs" style={{ height: `${bar.green * 10}%` }}></div>
                  <div className="w-2.5 bg-[#3B82F6] rounded-t-xs" style={{ height: `${bar.blue * 10}%` }}></div>
                </div>
                <span className="text-[9px] font-mono text-[#8C8275]">{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Compliance Summary Donut */}
        <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-bold font-serif-header text-[#24211D] mb-2">Compliance Summary</h3>
          
          <div className="flex items-center justify-between gap-4">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path stroke="#E2DDD5" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path stroke="#3E7B66" strokeWidth="4" strokeDasharray="84, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path stroke="#D97706" strokeWidth="4" strokeDasharray="8, 100" strokeDashoffset="-84" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path stroke="#3B82F6" strokeWidth="4" strokeDasharray="7, 100" strokeDashoffset="-92" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-bold font-serif-header text-[#24211D] leading-none block">86</span>
                <span className="text-[8px] font-mono text-[#8C8275] uppercase">Total Tests</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 text-xs text-[#24211D]">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#6B6359]"><span className="w-2 h-2 rounded-full bg-[#3E7B66]"></span> Pass</span>
                <strong className="font-mono">72 <span className="text-[10px] text-[#8C8275]">(84%)</span></strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#6B6359]"><span className="w-2 h-2 rounded-full bg-[#D97706]"></span> Fail</span>
                <strong className="font-mono">8 <span className="text-[10px] text-[#8C8275]">(8%)</span></strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#6B6359]"><span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span> In Progress</span>
                <strong className="font-mono">6 <span className="text-[10px] text-[#8C8275]">(7%)</span></strong>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-bold font-serif-header text-[#24211D] mb-3 flex items-center gap-1.5">
            <span className="text-[#9C5A3C]">⚡</span> Quick Actions
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <NavLink
              to="/sessions/new"
              className="p-3 bg-white border border-[#E2DDD5] hover:border-[#9C5A3C] rounded-lg text-xs font-semibold text-[#24211D] flex flex-col items-center justify-center text-center gap-1.5 transition shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#9C5A3C]" />
              <span>New Test Session</span>
            </NavLink>

            <NavLink
              to="/instruments"
              className="p-3 bg-white border border-[#E2DDD5] hover:border-[#9C5A3C] rounded-lg text-xs font-semibold text-[#24211D] flex flex-col items-center justify-center text-center gap-1.5 transition shadow-2xs"
            >
              <Scale className="w-4 h-4 text-[#9C5A3C]" />
              <span>Register Instrument</span>
            </NavLink>

            <NavLink
              to="/repository"
              className="p-3 bg-white border border-[#E2DDD5] hover:border-[#9C5A3C] rounded-lg text-xs font-semibold text-[#24211D] flex flex-col items-center justify-center text-center gap-1.5 transition shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#9C5A3C]" />
              <span>Search Reports</span>
            </NavLink>

            <NavLink
              to="/review-queue"
              className="p-3 bg-white border border-[#E2DDD5] hover:border-[#9C5A3C] rounded-lg text-xs font-semibold text-[#24211D] flex flex-col items-center justify-center text-center gap-1.5 transition shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#9C5A3C]" />
              <span>View Pending Reviews</span>
            </NavLink>
          </div>
        </div>

      </div>

      {/* Footer Bar: Regulatory Framework */}
      <div className="bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-[#9C5A3C] shrink-0" />
          <div>
            <h4 className="font-bold text-[#24211D]">Regulatory Framework</h4>
            <p className="text-[#6B6359] text-[11px]">OIML R-76 &bull; Non-Automatic Weighing Instruments</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-[#6B6359]">
          <div>
            <span className="text-[9px] uppercase block text-[#8C8275]">Edition</span>
            <strong className="text-[#24211D]">2006</strong>
          </div>
          <div>
            <span className="text-[9px] uppercase block text-[#8C8275]">Rule Version</span>
            <strong className="text-[#3E7B66]">Active</strong>
          </div>
          <div>
            <span className="text-[9px] uppercase block text-[#8C8275]">Source</span>
            <strong className="text-[#24211D]">OIML Publication</strong>
          </div>
          <div>
            <span className="text-[9px] uppercase block text-[#8C8275]">Last Updated</span>
            <strong className="text-[#24211D]">12 Jan 2024</strong>
          </div>
        </div>

        <NavLink
          to="/rules"
          className="bg-[#D4E3DC] hover:bg-[#C2D8CF] text-[#2D5A4B] font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0 flex items-center space-x-1.5"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

    </div>
  );
};
