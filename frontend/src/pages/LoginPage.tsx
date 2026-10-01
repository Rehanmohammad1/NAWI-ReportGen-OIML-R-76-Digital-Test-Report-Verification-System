import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from '../components/NawiLogo';
import { Shield, UserCheck, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('inspector.delhi@nawi.gov.in');
  const [password, setPassword] = useState('Inspector@123');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('inspector');
  const [regLabId, setRegLabId] = useState('');
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    api.getPublicLaboratories()
      .then(labs => {
        setLaboratories(labs);
        if (labs.length > 0) setRegLabId(String(labs[0].id));
      })
      .catch(console.error);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrors({});
    const errs: Record<string, string> = {};

    if (!regName.trim()) errs.name = 'Full name is required';
    if (!regEmail.trim() || !regEmail.includes('@')) errs.email = 'Valid official email is required';
    if (!regPassword || regPassword.length < 6) errs.password = 'Password must be at least 6 characters';
    if (regPassword !== regConfirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (regRole !== 'admin' && !regLabId) errs.lab_id = 'Laboratory selection is required';

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        requested_role: regRole,
        lab_id: regRole !== 'admin' && regLabId ? parseInt(regLabId, 10) : null
      });

      setSuccessMsg(res.message || 'Self-registration submitted successfully!');
      setMode('login');
      setEmail(regEmail.trim());
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegErrors({});
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Registration failed');
      setRegErrors({ api: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { role: 'Administrator', email: 'admin@nawi.gov.in', pass: 'Admin@123' },
    { role: 'Lab Manager', email: 'manager.delhi@nawi.gov.in', pass: 'Manager@123' },
    { role: 'Inspector / Tester', email: 'inspector.delhi@nawi.gov.in', pass: 'Inspector@123' },
    { role: 'Reviewer / Approver', email: 'reviewer.delhi@nawi.gov.in', pass: 'Reviewer@123' },
  ];

  return (
    <div className="min-h-screen bg-[#F1EADE] text-[#413B32] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xs bg-[#413B32] flex items-center justify-center text-[#F1EADE] shadow-xs mb-3 border border-[#413B32]">
            <NawiLogo className="w-7 h-7 text-[#F1EADE]" />
          </div>
          <h1 className="text-base font-bold text-[#413B32] tracking-tight uppercase font-mono">
            SIH26035 — NAWI Compliance System
          </h1>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            OIML R-76 Digital Test Report Generation Portal
          </p>
          <div className="inline-block mt-1.5 bg-[#FFFFFF] text-[#413B32] text-[10px] px-2.5 py-0.5 rounded-xs border border-[#D9D1C5] font-mono font-semibold">
            Department of Consumer Affairs (DoCA), Govt. of India
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-6 shadow-2xs space-y-4">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xs text-xs flex items-start space-x-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' ? (
            <div>
              <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-2 mb-3">
                <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center space-x-1.5">
                  <LogIn className="w-3.5 h-3.5 text-[#413B32]" />
                  <span>Portal Account Sign In</span>
                </h2>
                <span className="text-[10px] font-mono text-[#413B32]/60 uppercase">Secure Auth</span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3 font-mono">
                <div>
                  <label className="block text-xs font-semibold text-[#413B32] mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-3 py-1.5 text-xs text-[#413B32] focus:outline-none focus:border-[#413B32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#413B32] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-3 py-1.5 text-xs text-[#413B32] focus:outline-none focus:border-[#413B32]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-bold py-2 px-4 rounded-xs text-xs transition border border-[#413B32]"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>

              {/* Registration Prompt Link */}
              <div className="mt-3 pt-2.5 border-t border-[#D9D1C5] text-center font-mono">
                <p className="text-xs text-[#413B32]/80">
                  Don't have an authority account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                    className="text-[#413B32] font-bold underline hover:text-[#413B32]/80"
                  >
                    Register / Create Account
                  </button>
                </p>
              </div>

              {/* Quick Role Switcher */}
              <div className="mt-4 border-t border-[#D9D1C5] pt-3 font-mono">
                <p className="text-[10px] text-[#413B32]/70 uppercase tracking-wider mb-2 font-bold text-center">
                  System Evaluation Role Accounts:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {quickLogins.map((ql) => (
                    <button
                      key={ql.role}
                      type="button"
                      onClick={() => {
                        setEmail(ql.email);
                        setPassword(ql.pass);
                      }}
                      className="text-[10px] p-1.5 rounded-xs border border-[#D9D1C5] bg-[#F1EADE]/40 hover:bg-[#F1EADE] text-[#413B32] font-semibold text-center transition"
                    >
                      <span>{ql.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: REGISTER */
            <div>
              <div className="flex items-center justify-between border-b border-[#D9D1C5] pb-2 mb-3">
                <h2 className="text-xs font-bold font-mono text-[#413B32] uppercase flex items-center space-x-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#413B32]" />
                  <span>Authority Account Registration</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[10px] font-mono text-[#413B32] underline"
                >
                  ← Back to Sign In
                </button>
              </div>

              {regErrors.api && (
                <div className="bg-red-50 border border-red-300 text-red-900 p-2.5 rounded-xs text-xs mb-3 font-mono">
                  {regErrors.api}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-2.5 font-mono text-xs">
                <div>
                  <label className="block text-[#413B32] mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                  />
                  {regErrors.name && <p className="text-[10px] text-red-700 mt-0.5">{regErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[#413B32] mb-1 font-semibold">Official Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                  />
                  {regErrors.email && <p className="text-[10px] text-red-700 mt-0.5">{regErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#413B32] mb-1 font-semibold">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#413B32] mb-1 font-semibold">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#413B32] mb-1 font-semibold">Requested Authority Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                  >
                    <option value="inspector">Inspector / Tester</option>
                    <option value="reviewer">Reviewer / Approver</option>
                    <option value="lab_manager">Laboratory Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {regRole !== 'admin' && (
                  <div>
                    <label className="block text-[#413B32] mb-1 font-semibold">Assigned Laboratory</label>
                    <select
                      value={regLabId}
                      onChange={e => setRegLabId(e.target.value)}
                      className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                    >
                      {laboratories.map(lab => (
                        <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-bold py-2 px-4 rounded-xs text-xs transition border border-[#413B32] mt-2"
                >
                  {loading ? 'Submitting Registration...' : 'Submit Registration for Approval'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
