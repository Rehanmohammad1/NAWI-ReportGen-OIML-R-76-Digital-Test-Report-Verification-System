import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Bell, LogOut, Building2, ChevronDown, Check } from 'lucide-react';
import { IndianNationalEmblem } from './IndianNationalEmblem';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Laboratory selector state
  const [selectedLab, setSelectedLab] = useState<string>(user?.lab_name || 'Delhi Central Legal Metrology Laboratory');
  const [showLabDropdown, setShowLabDropdown] = useState(false);
  const [laboratories, setLaboratories] = useState<any[]>([]);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data))
        .catch(() => {});

      api.getPublicLaboratories()
        .then(labs => {
          if (Array.isArray(labs) && labs.length > 0) {
            setLaboratories(labs);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowLabDropdown(false);
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

  const availableLabs = laboratories.length > 0 ? laboratories : [
    { id: 1, name: 'Delhi Central Legal Metrology Laboratory', code: 'DEL-01' },
    { id: 2, name: 'Mumbai Regional Metrology Laboratory', code: 'MUM-02' },
    { id: 3, name: 'Kolkata Metrology Testing Center', code: 'KOL-03' }
  ];

  return (
    <header className="bg-[#FAF7F2] text-[#24211D] border-b border-[#E2DDD5] sticky top-0 z-40 shadow-xs font-sans" ref={headerRef}>
      <div
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
        style={{ height: '94px', minHeight: '94px', maxHeight: '94px' }}
      >
        
        {/* Left: Ashoka Pillar Emblem & Official Unified System Branding */}
        <div className="flex items-center space-x-3 shrink-0">
          <IndianNationalEmblem
            className="text-black shrink-0"
            style={{
              width: '40px',
              height: '48px',
              minWidth: '40px',
              minHeight: '48px',
              maxWidth: '40px',
              maxHeight: '48px',
              flex: '0 0 40px',
              objectFit: 'contain'
            }}
          />

          <div>
            <h1 className="font-serif-header font-bold text-lg sm:text-xl text-[#24211D] tracking-tight leading-tight">
              NAWI TEST REPORTING SYSTEM
            </h1>
            <p className="text-[10px] font-mono text-[#8C8275] tracking-wider uppercase mt-0.5 font-semibold">
              Legal Metrology &bull; OIML R-76
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
            <svg className="w-11 h-11 text-[#24211D]" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="30" cy="30" rx="26" ry="24" stroke="currentColor" strokeWidth="1.5" />
              <ellipse cx="30" cy="30" rx="22" ry="20" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 2" />
              <ellipse cx="30" cy="30" rx="14" ry="20" stroke="currentColor" strokeWidth="0.8" />
              <line x1="4" y1="30" x2="56" y2="30" stroke="currentColor" strokeWidth="1" />
              <line x1="10" y1="20" x2="50" y2="20" stroke="currentColor" strokeWidth="0.7" />
              <line x1="10" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="0.7" />
              <rect x="14" y="22" width="32" height="16" fill="#FAF7F2" rx="2" />
              <text x="30" y="34" fontSize="11" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#24211D" letterSpacing="1">OIML</text>
              <text x="30" y="49" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" fill="#5C554E">R-76</text>
            </svg>
          </div>

        </div>

        {/* Right: Functional Laboratory Selector, Notifications, User Profile & Date/Time */}
        {user && (
          <div className="flex items-center space-x-4 shrink-0">
            
            {/* Functional Laboratory Context Selector */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setShowLabDropdown(!showLabDropdown)}
                className="flex items-center space-x-2 text-xs font-semibold text-[#24211D] bg-[#EFEAE2] hover:bg-[#E5DDD2] px-3 py-1.5 rounded-md border border-[#E2DDD5] transition shadow-2xs"
                title="Select Active Laboratory Context"
              >
                <Building2 className="w-4 h-4 text-[#8C8275]" />
                <span className="truncate max-w-[200px]">{selectedLab}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C8275] shrink-0" />
              </button>

              {showLabDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2DDD5] rounded-xl shadow-xl py-2 z-50 text-xs text-[#24211D]">
                  <div className="px-4 py-2 border-b border-[#E2DDD5] font-mono text-[10px] uppercase font-bold text-[#8C8275] bg-[#FAF7F2]">
                    Active Laboratory Context
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-[#E2DDD5]">
                    {availableLabs.map(lab => (
                      <button
                        key={lab.id}
                        onClick={() => {
                          setSelectedLab(lab.name);
                          setShowLabDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-[#FAF7F2] transition flex items-center justify-between text-xs ${selectedLab === lab.name ? 'font-bold bg-[#FAF7F2] text-[#9C5A3C]' : ''}`}
                      >
                        <span className="truncate pr-2">{lab.name}</span>
                        {selectedLab === lab.name ? (
                          <Check className="w-4 h-4 text-[#9C5A3C] shrink-0" />
                        ) : (
                          lab.code && <span className="font-mono text-[10px] text-[#8C8275] shrink-0">{lab.code}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xl shadow-xl py-2 z-50 text-[#24211D] font-mono text-xs">
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
                <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xl shadow-xl py-2 z-50 text-xs">
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
