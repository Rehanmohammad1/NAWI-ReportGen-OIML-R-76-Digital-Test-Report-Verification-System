import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TechnicalSketchBg } from './TechnicalSketchBg';
import { 
  LayoutDashboard, Scale, FileText, BookOpen, Building2, Users, ShieldCheck, Settings, Folder, X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  exact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { hasRole } = useAuth();

  const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'], exact: true },
    { to: '/instruments', label: 'Instruments', icon: Scale, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
    { to: '/sessions/new', label: 'Test Sessions', icon: FileText, roles: ['admin', 'lab_manager', 'inspector'] },
    { to: '/repository', label: 'Reports', icon: FileText, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
    { to: '/review-queue', label: 'Repository', icon: Folder, roles: ['admin', 'lab_manager', 'reviewer'] },
    { to: '/rules', label: 'OIML R-76', icon: BookOpen, roles: ['admin', 'lab_manager', 'reviewer'] },
    { to: '/equipment', label: 'Laboratories', icon: Building2, roles: ['admin', 'lab_manager', 'inspector'] },
    { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
    { to: '/analytics', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin', 'lab_manager', 'reviewer'] },
    { to: '/verify-public', label: 'Settings', icon: Settings, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
  ];

  const visibleNavItems = navItems.filter(item => hasRole(item.roles as any));

  const sidebarContent = (
    <div className="relative h-full flex flex-col justify-between overflow-hidden bg-[#F0EAE1]/80 backdrop-blur-xs border-r border-[#E2DDD5] text-[#24211D] font-sans">
      
      {/* Background Technical Drawing of Mechanical Scale */}
      <TechnicalSketchBg className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Navigation Header / Mobile Close Strip */}
      <div className="p-3 border-b border-[#E2DDD5]/60 flex items-center justify-between relative z-10 md:hidden">
        <span className="text-xs font-mono font-bold uppercase text-[#5C554E]">Navigation Menu</span>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="p-1 rounded text-[#5C554E] hover:text-[#24211D]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Sidebar Nav Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto relative z-10 pt-4">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onCloseMobile}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 font-medium ${
                  isActive
                    ? 'bg-[#9C5A3C] text-white font-semibold shadow-xs'
                    : 'text-[#3D3731] hover:text-[#24211D] hover:bg-[#E5DDD2]/70'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#5C554E]'}`} />
                  <span className="truncate tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Metadata */}
      <div className="p-4 border-t border-[#E2DDD5]/80 bg-[#E8E1D7]/50 relative z-10 text-[10px] font-mono text-[#8C8275] space-y-1">
        <div className="flex items-center justify-between font-bold text-[#24211D]">
          <span>OIML R-76:2006</span>
          <span className="bg-[#9C5A3C]/15 text-[#9C5A3C] px-1.5 py-0.5 rounded font-mono text-[9px]">
            CLASS I-IV
          </span>
        </div>
        <p className="text-[9px] text-[#5C554E] leading-tight">
          Dept. of Consumer Affairs &bull; Govt. of India
        </p>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Permanent Left Sidebar */}
      <aside className="hidden md:block w-56 lg:w-64 flex-shrink-0 min-h-[calc(100vh-4rem)] sticky top-16 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-full h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
