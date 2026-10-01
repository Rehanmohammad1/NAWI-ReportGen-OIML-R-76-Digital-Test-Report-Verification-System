import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from './NawiLogo';
import { Bell, LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(data => setNotifications(data))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#413B32] text-[#F1EADE] border-[#A7BABA]';
      case 'lab_manager':
        return 'bg-[#A7BABA]/20 text-[#413B32] border-[#A7BABA]';
      case 'reviewer':
        return 'bg-[#A7BABA]/30 text-[#413B32] border-[#413B32]';
      case 'inspector':
        return 'bg-[#D9D1C5] text-[#413B32] border-[#413B32]/40';
      default:
        return 'bg-[#F1EADE] text-[#413B32] border-[#D9D1C5]';
    }
  };

  return (
    <header className="bg-[#413B32] text-[#F1EADE] border-b border-[#D9D1C5]/40 sticky top-0 z-50 shadow-sm">
      {/* Calibration Ruler Top Border Motif */}
      <div className="h-1 w-full bg-gradient-to-r from-[#A7BABA] via-[#D9D1C5] to-[#A7BABA]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Institutional Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded bg-[#A7BABA]/20 border border-[#A7BABA]/40 flex items-center justify-center font-mono text-[#F1EADE] shadow-xs">
            <NawiLogo className="w-5 h-5 text-[#F1EADE]" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-semibold tracking-tight text-[#F1EADE] text-sm font-sans">
                OIML R-76 Legal Metrology System
              </span>
              <span className="bg-[#A7BABA]/20 text-[#F1EADE] text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-[#A7BABA]/40">
                DoCA Govt. of India
              </span>
              <span className="bg-emerald-950/60 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40 hidden md:inline-flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 mr-1" />
                <span>Supabase Live</span>
              </span>
            </div>
            <p className="text-[11px] text-[#D9D1C5]/80 font-mono">
              NAWI Evaluation & Certificate Generation (SIH26035)
            </p>
          </div>
        </div>

        {/* User Info & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wide border ${getRoleBadgeStyle(user.role)}`}>
              {user.role.toUpperCase().replace('_', ' ')}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 text-[#D9D1C5] hover:text-[#FFFFFF] rounded hover:bg-[#A7BABA]/20 relative transition border border-transparent hover:border-[#A7BABA]/30"
                title="Laboratory Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#D9D1C5] rounded shadow-lg py-2 z-50 text-[#413B32]">
                  <div className="px-4 py-2 border-b border-[#D9D1C5] font-mono text-[11px] font-bold text-[#413B32] flex justify-between items-center bg-[#F1EADE]/50">
                    <span>LAB NOTIFICATIONS</span>
                    <span className="text-xs bg-[#413B32] text-[#F1EADE] px-1.5 py-0.5 rounded font-mono">
                      {unreadCount} UNREAD
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#D9D1C5]/40">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-[#413B32]/60 text-center font-mono">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-[#F1EADE]/60 transition ${!n.read ? 'bg-[#F1EADE] font-medium' : 'text-[#413B32]/70'}`}
                        >
                          <p className="leading-snug">{n.message}</p>
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

            {/* User Profile */}
            <div className="flex items-center space-x-2.5 border-l border-[#D9D1C5]/30 pl-4">
              <div className="w-7 h-7 rounded bg-[#F1EADE] text-[#413B32] flex items-center justify-center text-xs font-bold border border-[#D9D1C5]">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#F1EADE] leading-tight">{user.name}</p>
                <p className="text-[10px] text-[#D9D1C5]/80 font-mono">{user.lab_name || 'Central Metrology Lab'}</p>
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
          </div>
        )}
      </div>
    </header>
  );
};
