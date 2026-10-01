import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from '../components/NawiLogo';
import { Shield, UserCheck, AlertCircle, CheckCircle2, UserPlus, LogIn, Scale, Building2, KeyRound } from 'lucide-react';

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
    if (loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const errMsg = typeof err === 'string' ? err : (err?.message || 'Incorrect email or password');
      setError(errMsg);
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
    <div className="min-h-screen bg-[#F9F8F6] text-[#25221F] flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top institutional banner */}
      <div className="max-w-md w-full mx-auto text-center pt-4">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white border border-[#E6E2DC] shadow-sm mb-4">
          <NawiLogo className="w-10 h-10 text-[#C87A57]" />
        </div>
        <h1 className="font-serif-header text-2xl md:text-3xl font-bold text-[#25221F] tracking-tight">
          NAWI Digital Verification System
        </h1>
        <p className="text-xs text-[#666059] mt-1 font-medium">
          OIML R-76 Legal Metrology Digital Test Report & Verification Portal
        </p>
        <div className="inline-block mt-2 bg-[#FAF6F0] text-[#554F47] text-[11px] px-3 py-1 rounded-full border border-[#E6E2DC] font-medium">
          Department of Consumer Affairs (DoCA), Govt. of India
        </div>
      </div>

      {/* Main Form Box */}
      <div className="max-w-md w-full mx-auto my-6">
        <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 md:p-8 shadow-sm space-y-5">
          {successMsg && (
            <div className="bg-[#EBF5F1] border border-[#BDE3D5] text-[#2D5A4B] p-3.5 rounded-lg text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#3E7B66] mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3.5 rounded-lg text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-[#C54B4B] mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' ? (
            <div>
              <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3 mb-4">
                <h2 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center space-x-2">
                  <LogIn className="w-4 h-4 text-[#C87A57]" />
                  <span>Authority Account Sign In</span>
                </h2>
                <span className="text-[10px] font-mono text-[#666059] uppercase tracking-wider bg-[#F9F8F6] px-2 py-0.5 rounded border border-[#E6E2DC]">
                  Secure Authentication
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#25221F] mb-1.5">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md px-3.5 py-2 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57] focus:ring-1 focus:ring-[#C87A57] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#25221F] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md px-3.5 py-2 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57] focus:ring-1 focus:ring-[#C87A57] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#C87A57] hover:bg-[#B36846] text-white font-medium py-2.5 px-4 rounded-md text-xs transition shadow-xs mt-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </button>
              </form>

              {/* Registration Prompt Link */}
              <div className="mt-4 pt-3 border-t border-[#E6E2DC] text-center">
                <p className="text-xs text-[#666059]">
                  Don't have an authority account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                    className="text-[#C87A57] font-semibold hover:underline"
                  >
                    Register / Create Account
                  </button>
                </p>
              </div>

              {/* Quick Role Switcher */}
              <div className="mt-5 border-t border-[#E6E2DC] pt-4">
                <p className="text-[11px] text-[#666059] uppercase tracking-wider mb-2 font-medium text-center">
                  Evaluation Accounts Quick Access:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickLogins.map((ql) => (
                    <button
                      key={ql.role}
                      type="button"
                      onClick={() => {
                        setEmail(ql.email);
                        setPassword(ql.pass);
                      }}
                      className="text-[11px] p-2 rounded-md border border-[#E6E2DC] bg-[#FAF6F0]/60 hover:bg-[#FAF6F0] text-[#25221F] font-medium text-center transition"
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
              <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3 mb-4">
                <h2 className="text-sm font-semibold font-serif-header text-[#25221F] flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#C87A57]" />
                  <span>Authority Account Registration</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-medium text-[#C87A57] hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>

              {regErrors.api && (
                <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3 rounded-md text-xs mb-3">
                  {regErrors.api}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#25221F] mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                  />
                  {regErrors.name && <p className="text-[10px] text-[#C54B4B] mt-0.5">{regErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[#25221F] mb-1 font-medium">Official Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                  />
                  {regErrors.email && <p className="text-[10px] text-[#C54B4B] mt-0.5">{regErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#25221F] mb-1 font-medium">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#25221F] mb-1 font-medium">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#25221F] mb-1 font-medium">Requested Authority Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                  >
                    <option value="inspector">Inspector / Tester</option>
                    <option value="reviewer">Reviewer / Approver</option>
                    <option value="lab_manager">Laboratory Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {regRole !== 'admin' && (
                  <div>
                    <label className="block text-[#25221F] mb-1 font-medium">Assigned Laboratory</label>
                    <select
                      value={regLabId}
                      onChange={e => setRegLabId(e.target.value)}
                      className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
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
                  className="w-full bg-[#C87A57] hover:bg-[#B36846] text-white font-medium py-2.5 px-4 rounded-md text-xs transition shadow-xs mt-3"
                >
                  {loading ? 'Submitting Registration...' : 'Submit Registration for Approval'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#666059] font-mono pb-2">
        <span>OIML R-76 Edition 2006 (E) Legal Metrology Regulatory Platform</span>
      </div>
    </div>
  );
};

