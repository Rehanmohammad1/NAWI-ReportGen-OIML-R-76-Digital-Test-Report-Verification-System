import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeLabId: number | null;
  activeLabName: string;
  setActiveLabContext: (labId: number | null, labName?: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nawi_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('nawi_user');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nawi_token'));

  // Active Laboratory Context State
  const [activeLabId, setActiveLabIdState] = useState<number | null>(() => {
    try {
      const savedUser = localStorage.getItem('nawi_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      if (parsedUser && parsedUser.role !== 'admin' && parsedUser.lab_id) {
        return parsedUser.lab_id;
      }
      const savedLabId = localStorage.getItem('nawi_active_lab_id');
      if (savedLabId === 'null' || savedLabId === null) return null;
      return parseInt(savedLabId, 10);
    } catch {
      return null;
    }
  });

  const [activeLabName, setActiveLabNameState] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('nawi_user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      if (parsedUser && parsedUser.role !== 'admin' && parsedUser.lab_name) {
        return parsedUser.lab_name;
      }
      return localStorage.getItem('nawi_active_lab_name') || 'All Laboratories (System-Wide)';
    } catch {
      return 'All Laboratories (System-Wide)';
    }
  });

  const setActiveLabContext = (labId: number | null, labName?: string) => {
    // Non-admin users are locked to their assigned laboratory
    if (user && user.role !== 'admin' && user.lab_id) {
      const lockedId = user.lab_id;
      const lockedName = user.lab_name || 'Delhi Central Legal Metrology Laboratory';
      setActiveLabIdState(lockedId);
      setActiveLabNameState(lockedName);
      localStorage.setItem('nawi_active_lab_id', String(lockedId));
      localStorage.setItem('nawi_active_lab_name', lockedName);
      return;
    }

    // Admin users can switch freely
    const finalName = labName || (labId === null ? 'All Laboratories (System-Wide)' : `Laboratory #${labId}`);
    setActiveLabIdState(labId);
    setActiveLabNameState(finalName);
    if (labId === null) {
      localStorage.setItem('nawi_active_lab_id', 'null');
    } else {
      localStorage.setItem('nawi_active_lab_id', String(labId));
    }
    localStorage.setItem('nawi_active_lab_name', finalName);
  };

  // Keep active lab context in sync when user logs in/changes
  useEffect(() => {
    if (user) {
      if (user.role !== 'admin' && user.lab_id) {
        setActiveLabIdState(user.lab_id);
        setActiveLabNameState(user.lab_name || 'Delhi Central Legal Metrology Laboratory');
      }
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (!res || !res.access_token || !res.user) {
      throw new Error('Invalid authentication response received from backend');
    }
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('nawi_token', res.access_token);
    localStorage.setItem('nawi_user', JSON.stringify(res.user));

    if (res.user.role !== 'admin' && res.user.lab_id) {
      setActiveLabIdState(res.user.lab_id);
      setActiveLabNameState(res.user.lab_name || 'Delhi Central Legal Metrology Laboratory');
      localStorage.setItem('nawi_active_lab_id', String(res.user.lab_id));
      localStorage.setItem('nawi_active_lab_name', res.user.lab_name || 'Delhi Central Legal Metrology Laboratory');
    } else if (res.user.role === 'admin') {
      const savedLabId = localStorage.getItem('nawi_active_lab_id');
      const savedLabName = localStorage.getItem('nawi_active_lab_name');
      if (savedLabId && savedLabId !== 'null') {
        setActiveLabIdState(parseInt(savedLabId, 10));
        setActiveLabNameState(savedLabName || 'Delhi Central Legal Metrology Laboratory');
      } else {
        setActiveLabIdState(null);
        setActiveLabNameState('All Laboratories (System-Wide)');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveLabIdState(null);
    setActiveLabNameState('All Laboratories (System-Wide)');
    localStorage.removeItem('nawi_token');
    localStorage.removeItem('nawi_user');
    localStorage.removeItem('nawi_active_lab_id');
    localStorage.removeItem('nawi_active_lab_name');
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeLabId,
        activeLabName,
        setActiveLabContext,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
