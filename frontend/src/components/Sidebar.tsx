import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Scale, FileText, CheckSquare, 
  BookOpen, BarChart3, Wrench, ShieldCheck, PlusCircle, Users
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
    roles: string[];
    exact?: boolean;
  }[];
}

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'], exact: true }
      ]
    },
    {
      title: 'TESTING WORKFLOW',
      items: [
        { to: '/sessions/new', label: 'New Evaluation', icon: PlusCircle, roles: ['admin', 'lab_manager', 'inspector'] },
        { to: '/review-queue', label: 'Active & Review Queue', icon: CheckSquare, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/repository', label: 'Test History & Reports', icon: FileText, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      title: 'INSTRUMENTS & ASSETS',
      items: [
        { to: '/instruments', label: 'Instruments & Models', icon: Scale, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
        { to: '/equipment', label: 'Reference Standards', icon: Wrench, roles: ['admin', 'lab_manager', 'inspector'] }
      ]
    },
    {
      title: 'COMPLIANCE & VERIFICATION',
      items: [
        { to: '/rules', label: 'OIML Rule Engine', icon: BookOpen, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/analytics', label: 'Drift & Compliance', icon: BarChart3, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/verify-public', label: 'QR Public Verification', icon: ShieldCheck, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/users', label: 'Users & Authority Roles', icon: Users, roles: ['admin'] }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#FFFFFF] border-r border-[#D9D1C5] flex-shrink-0 min-h-[calc(100vh-3.8rem)] shadow-xs">
      {/* Top Sidebar Header Badge */}
      <div className="p-3.5 border-b border-[#D9D1C5]/60 bg-[#F1EADE]/40">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#413B32]"></span>
          <span className="text-[11px] font-mono font-bold text-[#413B32] uppercase tracking-wider">
            Legal Metrology Portal
          </span>
        </div>
        <p className="text-[10px] text-[#413B32]/70 font-mono mt-0.5">
          OIML R-76 Testing Laboratory
        </p>
      </div>

      <nav className="p-3 space-y-4">
        {sections.map((sec, secIdx) => {
          // Filter items allowed by role
          const visibleItems = sec.items.filter(item => hasRole(item.roles as any));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono font-semibold text-[#413B32]/60 uppercase tracking-wider border-b border-[#D9D1C5]/30">
                {sec.title}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded text-xs transition font-medium ${
                        isActive
                          ? 'bg-[#F1EADE] text-[#413B32] font-semibold border-l-3 border-[#413B32] shadow-2xs'
                          : 'text-[#413B32]/80 hover:text-[#413B32] hover:bg-[#F1EADE]/50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 text-[#413B32]/80" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Metrology Badge */}
      <div className="p-3 border-t border-[#D9D1C5]/60 mt-auto bg-[#F1EADE]/20 text-[10px] font-mono text-[#413B32]/60 text-center">
        <span>OIML R-76 Ed. 2006 (E)</span>
      </div>
    </aside>
  );
};
