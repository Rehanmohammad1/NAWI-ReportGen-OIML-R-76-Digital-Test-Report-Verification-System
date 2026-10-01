import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bell, LogOut, Building2, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const currentTimeFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <header className="bg-[#FAF7F2] text-[#24211D] border-b border-[#E2DDD5] sticky top-0 z-40 shadow-xs font-sans" ref={headerRef}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Ashoka Pillar Emblem & System Authority Branding */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Ashoka Pillar State Emblem SVG */}
          <svg className="w-9 h-11 text-[#24211D] shrink-0" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 30 5 L 34 14 L 43 14 L 36 20 L 39 29 L 30 23 L 21 29 L 24 20 L 17 14 L 26 14 Z" fill="currentColor" opacity="0.9" />
            <rect x="20" y="32" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="30" cy="44" r="7" stroke="currentColor" strokeWidth="1.5" />
            <line x1="30" y1="37" x2="30" y2="51" stroke="currentColor" strokeWidth="1" />
            <line x1="23" y1="44" x2="37" y2="44" stroke="currentColor" strokeWidth="1" />
            <path d="M 12 60 Q 30 56 48 60 L 45 68 L 15 68 Z" fill="currentColor" opacity="0.85" />
            <text x="30" y="76" fontSize="6" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill="currentColor">Satyameva Jayate</text>
          </svg>

          <div>
            <h1 className="font-serif-header font-bold text-xl sm:text-2xl text-[#24211D] tracking-tight leading-tight">
              SIH26035
            </h1>
            <p className="text-[11px] font-sans font-bold tracking-wider text-[#5C554E] uppercase leading-none mt-0.5">
              NAWI TEST REPORTING SYSTEM
            </p>
            <p className="text-[9px] font-mono text-[#8C8275] tracking-widest uppercase mt-0.5">
              OIML R-76 &bull; LEGAL METROLOGY
            </p>
          </div>
        </div>

        {/* Center: Integrated Graduated Measurement Ruler & Official OIML Seal */}
        <div className="hidden lg:flex items-center space-x-6 flex-1 max-w-2xl justify-center px-4">
          
          {/* Graduated Ruler Scale */}
          <div className="flex-1 max-w-md flex flex-col items-center">
            <div className="w-full flex justify-between text-[8px] font-mono text-[#8C8275] px-1 mb-0.5">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>200</span>
              <span>250</span>
              <span>300</span>
              <span>350</span>
            </div>
            <div className="w-full h-3 border-t border-b border-[#C7C0B4] flex justify-between items-start relative px-1">
              {[...Array(36)].map((_, i) => (
                <div
                  key={i}
                  className={`w-px bg-[#8C8275] ${i % 5 === 0 ? 'h-3 bg-[#24211D]' : 'h-1.5'}`}
                />
              ))}
            </div>
          </div>

          {/* Official OIML Oval Seal SVG */}
          <div className="flex items-center space-x-1 shrink-0 border-l border-[#E2DDD5] pl-6">
            <svg className="w-12 h-12 text-[#24211D]" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="30" cy="30" rx="26" ry="24" stroke="currentColor" strokeWidth="1.5" />
              <ellipse cx="30" cy="30" rx="22" ry="20" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
              {/* Globe Lines */}
              <ellipse cx="30" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="0.8" />
              <line x1="4" y1="30" x2="56" y2="30" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="20" x2="50" y2="20" stroke="currentColor" strokeWidth="0.7" />
              <line x1="10" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="0.7" />
              {/* Center OIML Text */}
              <rect x="14" y="22" width="32" height="16" fill="#FAF7F2" rx="2" />
              <text x="30" y="34" fontSize="11" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#24211D" letterSpacing="1">OIML</text>
              <text x="30" y="49" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill="#5C554E">R-76</text>
            </svg>
          </div>

        </div>

        {/* Right: Lab Selector, Notifications, User Profile & Date/Time */}
        {user && (
          <div className="flex items-center space-x-4 shrink-0">
            
            {/* Laboratory Selector */}
            <div className="hidden xl:flex items-center space-x-2 text-xs font-medium text-[#24211D] bg-[#EFEAE2] px-3 py-1.5 rounded-md border border-[#E2DDD5]">
              <Building2 className="w-4 h-4 text-[#8C8275]" />
              <span>{user.lab_name || 'Delhi Central Laboratory'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8275]" />
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-[#5C554E] hover:text-[#24211D] hover:bg-[#EFEAE2] rounded-full transition relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#D97706] rounded-full ring-2 ring-[#FAF7F2]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E2DDD5] rounded-lg shadow-xl py-2 z-50 text-[#24211D] font-mono text-xs">
                  <div className="px-4 py-2 border-b border-[#E2DDD5] font-bold flex justify-between items-center bg-[#FAF7F2]">
                    <span>NOTIFICATIONS</span>
                    <span className="text-[10px] bg-[#9C5A3C] text-white px-1.5 py-0.5 rounded">
                      {unreadCount} UNREAD
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E2DDD5] font-sans">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-[#8C8275] text-center font-mono">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[#FAF7F2] transition ${!n.read ? 'bg-[#FAF7F2] font-medium' : 'text-[#8C8275]'}`}
                        >
                          <p className="leading-snug font-mono">{n.message}</p>
                          <span className="text-[10px] text-[#8C8275] font-mono mt-1 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Avatar Pill */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 hover:bg-[#EFEAE2] rounded-full transition text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#8C8275]/40 text-[#24211D] flex items-center justify-center font-bold text-xs border border-[#C7C0B4]">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'I'}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-[#24211D] leading-tight">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#8C8275]" />
                  </div>
                  <p className="text-[10px] text-[#8C8275] font-mono leading-none">
                    {currentDateFormatted} &bull; {currentTimeFormatted}
                  </p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E2DDD5] rounded-lg shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-[#E2DDD5] bg-[#FAF7F2]">
                    <p className="font-bold text-[#24211D]">{user.name}</p>
                    <p className="text-[10px] font-mono text-[#8C8275] uppercase">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </header>
  );
};
