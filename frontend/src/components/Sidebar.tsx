import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NawiLogo } from './NawiLogo';
import { 
  LayoutDashboard, Scale, FileText, CheckSquare, 
  BookOpen, BarChart3, Wrench, ShieldCheck, PlusCircle, Users, X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

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

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { hasRole, user } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'], exact: true }
      ]
    },
    {
      title: 'EVALUATION & TESTING',
      items: [
        { to: '/sessions/new', label: 'New Evaluation', icon: PlusCircle, roles: ['admin', 'lab_manager', 'inspector'] },
        { to: '/review-queue', label: 'Active & Review Queue', icon: CheckSquare, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/repository', label: 'Test History & Reports', icon: FileText, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      title: 'INSTRUMENTS & STANDARDS',
      items: [
        { to: '/instruments', label: 'Instruments & Models', icon: Scale, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
        { to: '/equipment', label: 'Reference Standards', icon: Wrench, roles: ['admin', 'lab_manager', 'inspector'] }
      ]
    },
    {
      title: 'COMPLIANCE & RULES',
      items: [
        { to: '/rules', label: 'OIML Rule Engine', icon: BookOpen, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/analytics', label: 'Drift & Analytics', icon: BarChart3, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/verify-public', label: 'QR Verification', icon: ShieldCheck, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/users', label: 'Users & Permissions', icon: Users, roles: ['admin'] }
      ]
    }
  ];

  const sidebarContent = (
    <div className="relative h-full flex flex-col justify-between overflow-hidden bg-[#FAF6F0]/90 backdrop-blur-xs border-r border-[#E6E2DC] text-[#25221F] font-sans">
      
      {/* Subtle Metrology Technical Line Art Artwork inside/behind Sidebar */}
      <svg
        viewBox="0 0 260 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.055] text-[#25221F] select-none"
        aria-hidden="true"
      >
        {/* Beam Balance & Fulcrum Pivot */}
        <path d="M 20 120 L 240 120" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <polygon points="130,120 115,155 145,155" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="130" cy="120" r="3" fill="currentColor" />
        <path d="M 130 65 L 130 120" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Hanger Pans */}
        <path d="M 35 120 L 35 200 L 15 230 L 75 230 L 35 200" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M 225 120 L 225 200 L 205 230 L 260 230 L 225 200" stroke="currentColor" strokeWidth="1" fill="none" />
        
        {/* Standard Calibration Weights */}
        <rect x="25" y="215" width="22" height="15" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="33" y="210" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
        
        <rect x="215" y="210" width="24" height="20" rx="1" stroke="currentColor" strokeWidth="1" fill="none" />
        <rect x="224" y="204" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="0.8" fill="none" />

        {/* Graduated Arc Dial */}
        <path d="M 70 280 A 65 65 0 0 1 190 280" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" />
        <line x1="130" y1="280" x2="130" y2="235" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="130" cy="280" r="2.5" fill="currentColor" />
        
        {/* Graduated Scale Ticks */}
        {[...Array(17)].map((_, i) => (
          <line
            key={i}
            x1={15 + i * 14}
            y1={360}
            x2={15 + i * 14}
            y2={i % 5 === 0 ? 342 : 350}
            stroke="currentColor"
            strokeWidth={i % 5 === 0 ? "1.2" : "0.8"}
          />
        ))}
        <line x1="15" y1="360" x2="245" y2="360" stroke="currentColor" strokeWidth="1" />
        
        {/* Technical Text Labels & Crosshairs */}
        <text x="25" y="380" fontSize="7" fontFamily="monospace" fill="currentColor">MAX 3000g • e=0.1g</text>
        <text x="25" y="392" fontSize="7" fontFamily="monospace" fill="currentColor">OIML R-76 ACCURACY CLASS III</text>
        
        {/* Lower Calibration Diagram */}
        <circle cx="130" cy="580" r="50" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" fill="none" />
        <line x1="80" y1="580" x2="180" y2="580" stroke="currentColor" strokeWidth="0.8" />
        <line x1="130" y1="530" x2="130" y2="630" stroke="currentColor" strokeWidth="0.8" />
        <text x="35" y="655" fontSize="7" fontFamily="monospace" fill="currentColor">DIRECTORATE OF LEGAL METROLOGY</text>
        <text x="35" y="668" fontSize="7" fontFamily="monospace" fill="currentColor">OIML R-76 TECHNICAL AUDIT VERIFIED</text>

        <path d="M 10 30 L 30 30 M 20 20 L 20 40" stroke="currentColor" strokeWidth="0.6" />
        <path d="M 230 30 L 250 30 M 240 20 L 240 40" stroke="currentColor" strokeWidth="0.6" />
        <path d="M 10 770 L 30 770 M 20 760 L 20 780" stroke="currentColor" strokeWidth="0.6" />
      </svg>

      {/* Sidebar Header / Brand Strip */}
      <div className="p-4 border-b border-[#E6E2DC] flex items-center justify-between bg-[#F4EFEA]/60 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-[#C87A57] flex items-center justify-center text-white shadow-xs">
            <NawiLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif-header font-bold text-sm text-[#25221F] tracking-wide leading-tight">
              OIML R-76
            </h1>
            <p className="text-[10px] font-mono text-[#666059] uppercase tracking-wider">
              Legal Metrology System
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded text-[#666059] hover:text-[#25221F] hover:bg-[#E6E2DC]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto relative z-10">
        {sections.map((sec, secIdx) => {
          const visibleItems = sec.items.filter(item => hasRole(item.roles as any));
          if (visibleItems.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#8C8275] uppercase tracking-widest border-b border-[#E6E2DC]/50 mb-1.5">
                {sec.title}
              </div>

              {visibleItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={onCloseMobile}
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs sm:text-sm transition-all font-medium ${
                        isActive
                          ? 'bg-[#C87A57]/15 text-[#8C3A16] font-bold border-l-4 border-[#C87A57] shadow-2xs'
                          : 'text-[#4A443F] hover:text-[#25221F] hover:bg-[#E6E2DC]/50'
                      }`
                    }
                  >
                    {({ isActive }: { isActive: boolean }) => (
                      <>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#C87A57]' : 'text-[#666059]'}`} />
                        <span className="truncate tracking-tight">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Metrology Authority Badge at Sidebar Footer */}
      <div className="p-3.5 border-t border-[#E6E2DC] bg-[#F4EFEA]/70 relative z-10 text-[10px] font-mono text-[#666059] space-y-1">
        <div className="flex items-center justify-between font-bold text-[#25221F]">
          <span>OIML R-76:2006(E)</span>
          <span className="bg-[#C87A57]/20 text-[#8C3A16] px-1.5 py-0.5 rounded text-[9px]">
            SIH26035
          </span>
        </div>
        <p className="text-[9px] text-[#8C8275] leading-tight">
          Dept. of Consumer Affairs • Govt. of India
        </p>
        {user && (
          <div className="pt-1.5 border-t border-[#E6E2DC]/60 flex items-center justify-between text-[9px]">
            <span className="font-semibold text-[#25221F] truncate max-w-[120px]">{user.name}</span>
            <span className="uppercase text-[#C87A57] font-bold">{user.role}</span>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 min-h-[calc(100vh-3.5rem)] sticky top-14 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-full h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
