import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from './NawiLogo';
import type { Role } from '../types';
import { 
  LayoutDashboard, Scale, FileText, CheckSquare, 
  BookOpen, BarChart3, Wrench, ShieldCheck, PlusCircle, Users,
  Bell, LogOut, User as UserIcon, ChevronDown, Menu, X, CheckCircle2
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  exact?: boolean;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

export const Navbar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<any>(null);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data))
        .catch(() => {});
    }
  }, [user]);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setShowNotifications(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#F1EADE] text-[#413B32] border-[#D9D1C5] font-bold';
      case 'lab_manager':
        return 'bg-[#A7BABA]/20 text-[#F1EADE] border-[#A7BABA]';
      case 'reviewer':
        return 'bg-[#A7BABA]/30 text-[#F1EADE] border-[#A7BABA]';
      case 'inspector':
        return 'bg-[#D9D1C5]/20 text-[#F1EADE] border-[#D9D1C5]/40';
      default:
        return 'bg-[#F1EADE] text-[#413B32] border-[#D9D1C5]';
    }
  };

  const categories: NavCategory[] = [
    {
      id: 'testing',
      label: 'Testing',
      icon: CheckSquare,
      items: [
        { to: '/sessions/new', label: 'New Evaluation', icon: PlusCircle, roles: ['admin', 'lab_manager', 'inspector'] },
        { to: '/review-queue', label: 'Active & Review Queue', icon: CheckSquare, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/repository', label: 'Test History & Reports', icon: FileText, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      id: 'instruments',
      label: 'Instruments',
      icon: Scale,
      items: [
        { to: '/instruments', label: 'Instruments & Models', icon: Scale, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] },
        { to: '/equipment', label: 'Reference Standards', icon: Wrench, roles: ['admin', 'lab_manager', 'inspector'] }
      ]
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: BookOpen,
      items: [
        { to: '/rules', label: 'OIML Rule Engine', icon: BookOpen, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/analytics', label: 'Drift & Compliance', icon: BarChart3, roles: ['admin', 'lab_manager', 'reviewer'] },
        { to: '/verify-public', label: 'QR Public Verification', icon: ShieldCheck, roles: ['admin', 'lab_manager', 'inspector', 'reviewer'] }
      ]
    },
    {
      id: 'administration',
      label: 'Administration',
      icon: Users,
      items: [
        { to: '/users', label: 'Users & Authority Roles', icon: Users, roles: ['admin'] }
      ]
    }
  ];

  const isPathActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some(item => hasRole(item.roles) && isPathActive(item.to, item.exact));
  };

  const handleMouseEnterCategory = (catId: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveDropdown(catId);
  };

  const handleMouseLeaveCategory = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <header className="bg-[#413B32] text-[#F1EADE] border-b border-[#D9D1C5]/30 sticky top-0 z-50 shadow-md font-sans" ref={navRef}>
      {/* Calibration Ruler Top Motif */}
      <div className="h-1 w-full bg-gradient-to-r from-[#A7BABA] via-[#D9D1C5] to-[#A7BABA]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="h-14 flex items-center justify-between">
          
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded bg-[#A7BABA]/20 border border-[#A7BABA]/40 flex items-center justify-center font-mono text-[#F1EADE] shadow-xs">
              <NawiLogo className="w-5 h-5 text-[#F1EADE]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-[#F1EADE] text-sm font-sans uppercase">
                  OIML R-76 LEGAL METROLOGY SYSTEM
                </span>
                <span className="bg-[#A7BABA]/20 text-[#F1EADE] text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border border-[#A7BABA]/40 hidden sm:inline-block">
                  DoCA Govt. of India
                </span>
              </div>
              <p className="text-[10px] text-[#D9D1C5]/80 font-mono hidden md:block">
                NAWI Evaluation & Digital Certificate Verification (SIH26035)
              </p>
            </div>
          </div>

          {/* Desktop Right Side Controls: Notifications & User Profile */}
          {user && (
            <div className="flex items-center space-x-3">
              {/* Role Badge */}
              <div className={`hidden lg:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
                {user.role.toUpperCase().replace('_', ' ')}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 text-[#D9D1C5] hover:text-[#FFFFFF] rounded hover:bg-[#A7BABA]/20 transition border border-transparent hover:border-[#A7BABA]/30"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm shadow-xl py-2 z-50 text-[#413B32] font-mono text-xs">
                    <div className="px-4 py-2 border-b border-[#D9D1C5] font-bold text-[#413B32] flex justify-between items-center bg-[#F1EADE]/50">
                      <span>NOTIFICATIONS</span>
                      <span className="text-[10px] bg-[#413B32] text-[#F1EADE] px-1.5 py-0.5 rounded">
                        {unreadCount} UNREAD
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#D9D1C5]/40 font-sans">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-xs text-[#413B32]/60 text-center font-mono">No new notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-[#F1EADE]/60 transition ${!n.read ? 'bg-[#F1EADE] font-medium' : 'text-[#413B32]/70'}`}
                          >
                            <p className="leading-snug font-mono">{n.message}</p>
                            <span className="text-[10px] text-[#413B32]/50 font-mono mt-1 block">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Info */}
              <div className="hidden sm:flex items-center space-x-2 border-l border-[#D9D1C5]/30 pl-3">
                <div className="w-7 h-7 rounded bg-[#F1EADE] text-[#413B32] flex items-center justify-center text-xs font-bold border border-[#D9D1C5]">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left font-mono">
                  <p className="text-xs font-bold text-[#F1EADE] leading-tight">{user.name}</p>
                  <p className="text-[9px] text-[#D9D1C5]/80 uppercase">{user.lab_name || 'Central Metrology Lab'}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 text-[#D9D1C5] hover:text-red-300 rounded hover:bg-red-900/30 transition border border-transparent hover:border-red-500/30"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-[#F1EADE] hover:bg-[#A7BABA]/20 rounded border border-[#A7BABA]/30 ml-1"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP TOP HORIZONTAL NAVIGATION BAR */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 border-t border-[#D9D1C5]/20 py-1 font-mono text-xs">
            
            {/* Direct Link: Dashboard */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xs transition flex items-center space-x-1.5 font-bold ${
                  isActive
                    ? 'bg-[#F1EADE] text-[#413B32] shadow-xs'
                    : 'text-[#F1EADE] hover:bg-[#F1EADE]/10 hover:text-[#FFFFFF]'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>

            {/* Categorized Dropdowns */}
            {categories.map(category => {
              // Check if user has permission for at least one item in category
              const visibleItems = category.items.filter(item => hasRole(item.roles));
              if (visibleItems.length === 0) return null;

              const isCatActive = isCategoryActive(category);
              const isOpen = activeDropdown === category.id;
              const CatIcon = category.icon;

              return (
                <div
                  key={category.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnterCategory(category.id)}
                  onMouseLeave={handleMouseLeaveCategory}
                >
                  <button
                    onClick={() => setActiveDropdown(isOpen ? null : category.id)}
                    aria-expanded={isOpen}
                    className={`px-3 py-1.5 rounded-xs transition flex items-center space-x-1.5 font-bold focus:outline-none ${
                      isCatActive
                        ? 'bg-[#A7BABA]/30 text-[#FFFFFF] border-b-2 border-[#F1EADE]'
                        : isOpen
                        ? 'bg-[#F1EADE]/20 text-[#FFFFFF]'
                        : 'text-[#F1EADE]/90 hover:bg-[#F1EADE]/10 hover:text-[#FFFFFF]'
                    }`}
                  >
                    <CatIcon className="w-3.5 h-3.5 text-[#A7BABA]" />
                    <span>{category.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Panel */}
                  {isOpen && (
                    <div className="absolute left-0 mt-1 w-56 bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs shadow-xl py-1.5 z-50 text-[#413B32] font-mono text-xs">
                      {visibleItems.map(item => {
                        const ItemIcon = item.icon;
                        const active = isPathActive(item.to, item.exact);
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setActiveDropdown(null)}
                            className={`px-3.5 py-2 flex items-center space-x-2 transition ${
                              active
                                ? 'bg-[#F1EADE] text-[#413B32] font-bold border-l-2 border-[#413B32]'
                                : 'hover:bg-[#F1EADE]/40 text-[#413B32]'
                            }`}
                          >
                            <ItemIcon className={`w-3.5 h-3.5 ${active ? 'text-[#413B32]' : 'text-[#413B32]/70'}`} />
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* MOBILE RESPONSIVE NAVIGATION DRAWER */}
      {user && mobileMenuOpen && (
        <div className="md:hidden bg-[#413B32] border-t border-[#D9D1C5]/30 px-4 py-3 space-y-3 font-mono text-xs shadow-lg">
          
          {/* User info strip on mobile */}
          <div className="bg-[#A7BABA]/10 p-2.5 rounded border border-[#A7BABA]/30 flex items-center justify-between">
            <div>
              <p className="font-bold text-[#F1EADE]">{user.name}</p>
              <p className="text-[10px] text-[#D9D1C5]/80">{user.lab_name || 'Central Metrology Lab'}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getRoleBadgeStyle(user.role)}`}>
              {user.role.toUpperCase().replace('_', ' ')}
            </span>
          </div>

          {/* Mobile Direct Dashboard Link */}
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `w-full p-2.5 rounded flex items-center space-x-2 font-bold ${
                isActive ? 'bg-[#F1EADE] text-[#413B32]' : 'text-[#F1EADE] hover:bg-[#F1EADE]/10'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          {/* Mobile Accordion Categories */}
          {categories.map(category => {
            const visibleItems = category.items.filter(item => hasRole(item.roles));
            if (visibleItems.length === 0) return null;

            const isExpanded = mobileExpandedCategory === category.id;
            const CatIcon = category.icon;
            const isCatActive = isCategoryActive(category);

            return (
              <div key={category.id} className="border border-[#D9D1C5]/20 rounded overflow-hidden">
                <button
                  onClick={() => setMobileExpandedCategory(isExpanded ? null : category.id)}
                  className={`w-full p-2.5 flex items-center justify-between font-bold ${
                    isCatActive ? 'bg-[#A7BABA]/20 text-[#FFFFFF]' : 'bg-[#413B32] text-[#F1EADE]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CatIcon className="w-4 h-4 text-[#A7BABA]" />
                    <span>{category.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="bg-[#FFFFFF] text-[#413B32] divide-y divide-[#D9D1C5]/40">
                    {visibleItems.map(item => {
                      const ItemIcon = item.icon;
                      const active = isPathActive(item.to, item.exact);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`p-2.5 flex items-center space-x-2 font-semibold ${
                            active ? 'bg-[#F1EADE] font-bold text-[#413B32]' : 'hover:bg-[#F1EADE]/40'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 text-[#413B32]" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile Sign Out Button */}
          <button
            onClick={() => { setMobileMenuOpen(false); logout(); }}
            className="w-full p-2.5 bg-red-950/60 text-red-200 border border-red-800/40 rounded flex items-center justify-center space-x-2 font-bold mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      )}
    </header>
  );
};
