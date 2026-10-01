import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from './NawiLogo';
import { Bell, LogOut, User as UserIcon, Menu, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#C87A57] text-white border-[#C87A57] font-bold';
      case 'lab_manager':
        return 'bg-[#3E7B66] text-white border-[#3E7B66]';
      case 'reviewer':
        return 'bg-[#25221F] text-white border-[#25221F]';
      case 'inspector':
        return 'bg-[#8C8275] text-white border-[#8C8275]';
      default:
        return 'bg-[#E6E2DC] text-[#25221F] border-[#D4CEC5]';
    }
  };

  return (
    <header className="bg-[#FFFFFF] text-[#25221F] border-b border-[#E6E2DC] sticky top-0 z-40 shadow-2xs font-sans" ref={headerRef}>
      
      {/* Graduated Metrology Scale / Measurement Ruler Visual Element */}
      <div className="h-6 bg-[#FAF6F0] border-b border-[#E6E2DC] flex items-center px-4 overflow-hidden select-none font-mono text-[9px] text-[#666059]">
        <span className="font-bold text-[#C87A57] uppercase mr-3 tracking-wider flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C87A57]"></span>
          METROLOGY RULER SCALE:
        </span>
        <div className="flex-1 flex items-end h-4 relative overflow-hidden">
          <div className="w-full flex justify-between items-end pb-0.5 border-b border-[#D4CEC5]">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[7.5px] leading-none mb-0.5 text-[#8C8275] font-mono">{val}e</span>
                <div className="w-px h-2.5 bg-[#8C8275]"></div>
              </div>
            ))}
          </div>
        </div>
        <span className="ml-3 text-[9px] font-mono text-[#8C8275] shrink-0 hidden lg:inline-block">
          Class (I)(II)(III)(IIII) • e_min = 1mg • OIML R-76:2006
        </span>
      </div>

      {/* Main Header Bar Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Header Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-[#25221F] hover:bg-[#F9F8F6] rounded border border-[#E6E2DC]"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="font-serif-header font-bold text-base sm:text-lg text-[#25221F] tracking-tight">
              NAWI Digital Test Report System
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1 bg-[#FAF6F0] text-[#666059] border border-[#E6E2DC] px-2 py-0.5 rounded text-[10px] font-mono">
              <ShieldCheck className="w-3 h-3 text-[#C87A57]" />
              <span>OIML R-76 VERIFIED</span>
            </span>
          </div>
        </div>

        {/* Right: Notifications, User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-3">
            
            {/* User Role Badge */}
            <span className={`hidden lg:inline-block px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
              {user.role.replace('_', ' ')}
            </span>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-[#666059] hover:text-[#25221F] hover:bg-[#FAF6F0] rounded border border-[#E6E2DC] transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#C87A57] rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E6E2DC] rounded-lg shadow-xl py-2 z-50 text-[#25221F] font-mono text-xs">
                  <div className="px-4 py-2 border-b border-[#E6E2DC] font-bold flex justify-between items-center bg-[#FAF6F0]">
                    <span>NOTIFICATIONS</span>
                    <span className="text-[10px] bg-[#C87A57] text-white px-1.5 py-0.5 rounded">
                      {unreadCount} UNREAD
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E2DC] font-sans">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-[#666059] text-center font-mono">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[#FAF6F0] transition ${!n.read ? 'bg-[#FAF6F0] font-medium' : 'text-[#666059]'}`}
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

            {/* User Identity Info */}
            <div className="hidden sm:flex items-center space-x-2 border-l border-[#E6E2DC] pl-3">
              <div className="w-7 h-7 rounded-full bg-[#C87A57] text-white flex items-center justify-center text-xs font-bold">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left font-mono">
                <p className="text-xs font-bold text-[#25221F] leading-tight">{user.name}</p>
                <p className="text-[9px] text-[#666059] uppercase truncate max-w-[140px]">{user.lab_name || 'Central Metrology Lab'}</p>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="p-1.5 text-[#666059] hover:text-red-600 hover:bg-red-50 rounded border border-[#E6E2DC] hover:border-red-200 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
