import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NawiLogo } from '../components/NawiLogo';
import { TechnicalSketchBg } from '../components/TechnicalSketchBg';
import { AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

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
        if (Array.isArray(labs) && labs.length > 0) {
          setLaboratories(labs);
          setRegLabId(String(labs[0].id));
        }
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
    <div className="min-h-screen bg-[#EBE5DC] text-[#24211D] flex flex-col justify-between p-4 md:p-8 font-sans tech-grid-bg relative overflow-hidden">
      
      {/* Background Metrology Technical Drawing (Layered safely behind page content) */}
      <TechnicalSketchBg className="absolute inset-0 max-w-4xl mx-auto my-auto opacity-[0.045] pointer-events-none z-0" />

      {/* Top Institutional Branding */}
      <div className="max-w-md w-full mx-auto text-center pt-4 relative z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white border border-[#E2DDD5] shadow-sm mb-4">
          <NawiLogo className="w-10 h-10 text-[#9C5A3C]" />
        </div>
        <h1 className="font-serif-header text-2xl md:text-3xl font-bold text-[#24211D] tracking-tight">
          NAWI TEST REPORTING SYSTEM
        </h1>
        <p className="text-xs font-mono text-[#8C8275] tracking-widest uppercase mt-1">
          Legal Metrology &bull; OIML R-76
        </p>
        <div className="inline-block mt-2 bg-[#FAF7F2] text-[#5C554E] text-[11px] px-3.5 py-1 rounded-full border border-[#E2DDD5] font-medium shadow-2xs">
          Department of Consumer Affairs (DoCA), Govt. of India
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-6 relative z-10">
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 md:p-8 shadow-xl space-y-5 opacity-100">
          {successMsg && (
            <div className="bg-[#E2F4EA] border border-[#BDE3D5] text-[#2D5A4B] p-3.5 rounded-lg text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#2D5A4B] mt-0.5 flex-shrink-0" />
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
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 mb-4">
                <h2 className="text-sm font-bold font-serif-header text-[#24211D] flex items-center space-x-2">
                  <LogIn className="w-4 h-4 text-[#9C5A3C]" />
                  <span>Authority Account Sign In</span>
                </h2>
                <span className="text-[10px] font-mono text-[#8C8275] uppercase tracking-wider bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E2DDD5]">
                  Secure Auth
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#24211D] mb-1.5">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg px-3.5 py-2.5 text-xs text-[#24211D] focus:outline-none focus:border-[#9C5A3C] focus:bg-white focus:ring-1 focus:ring-[#9C5A3C] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24211D] mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
                    className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg px-3.5 py-2.5 text-xs text-[#24211D] focus:outline-none focus:border-[#9C5A3C] focus:bg-white focus:ring-1 focus:ring-[#9C5A3C] transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#9C5A3C] hover:bg-[#864B30] text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition shadow-xs mt-2"
                >
                  {loading ? 'Authenticating Workspace...' : 'Sign In to Portal'}
                </button>
              </form>

              {/* Registration Prompt Link */}
              <div className="mt-4 pt-3 border-t border-[#E2DDD5] text-center">
                <p className="text-xs text-[#6B6359]">
                  Don't have an authority account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                    className="text-[#9C5A3C] font-semibold hover:underline"
                  >
                    Register / Create Account
                  </button>
                </p>
              </div>

              {/* Quick Role Switcher */}
              <div className="mt-5 border-t border-[#E2DDD5] pt-4">
                <p className="text-[11px] text-[#6B6359] uppercase tracking-wider mb-2 font-mono text-center">
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
                      className="text-[11px] p-2 rounded-lg border border-[#E2DDD5] bg-[#FAF7F2] hover:bg-[#EFEAE2] text-[#24211D] font-medium text-center transition"
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
              <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3 mb-4">
                <h2 className="text-sm font-bold font-serif-header text-[#24211D] flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#9C5A3C]" />
                  <span>Authority Registration</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-semibold text-[#9C5A3C] hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>

              {regErrors.api && (
                <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3 rounded-lg text-xs mb-3">
                  {regErrors.api}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#24211D] mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
                  />
                  {regErrors.name && <p className="text-[10px] text-[#C54B4B] mt-0.5">{regErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[#24211D] mb-1 font-semibold">Official Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
                  />
                  {regErrors.email && <p className="text-[10px] text-[#C54B4B] mt-0.5">{regErrors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#24211D] mb-1 font-semibold">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#24211D] mb-1 font-semibold">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#24211D] mb-1 font-semibold">Requested Authority Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
                  >
                    <option value="inspector">Inspector / Tester</option>
                    <option value="reviewer">Reviewer / Approver</option>
                    <option value="lab_manager">Laboratory Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {regRole !== 'admin' && (
                  <div>
                    <label className="block text-[#24211D] mb-1 font-semibold">Assigned Laboratory</label>
                    <select
                      value={regLabId}
                      onChange={e => setRegLabId(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E2DDD5] rounded-lg p-2 text-[#24211D] focus:outline-none focus:border-[#9C5A3C]"
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
                  className="w-full bg-[#9C5A3C] hover:bg-[#864B30] text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition shadow-xs mt-3"
                >
                  {loading ? 'Submitting Registration...' : 'Submit Registration for Approval'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[#8C8275] font-mono pb-2 relative z-10">
        <span>Legal Metrology &bull; OIML R-76 Regulatory Platform</span>
      </div>
    </div>
  );
};
