import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { 
  Users, UserCheck, Shield, Plus, Search, Filter, 
  Edit, Key, Power, AlertCircle, CheckCircle2, XCircle, Building2, RefreshCw,
  Clock, Check, X
} from 'lucide-react';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  lab_id: number | null;
  lab_name: string;
  status?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface LabItem {
  id: number;
  name: string;
  code: string;
}

const ROLE_DISPLAY_MAP: Record<string, string> = {
  admin: 'Administrator',
  lab_manager: 'Laboratory Manager',
  inspector: 'Inspector / Tester',
  reviewer: 'Reviewer / Approver',
};

const ROLE_BADGE_MAP: Record<string, string> = {
  admin: 'bg-[#413B32] text-[#F1EADE] border-[#413B32]',
  lab_manager: 'bg-[#F1EADE] text-[#413B32] border-[#D9D1C5]',
  inspector: 'bg-[#A7BABA]/20 text-[#413B32] border-[#A7BABA]',
  reviewer: 'bg-emerald-50 text-emerald-900 border-emerald-300',
};

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [laboratories, setLaboratories] = useState<LabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab: 'all' | 'pending'
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [labFilter, setLabFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [toggleUser, setToggleUser] = useState<UserItem | null>(null);
  const [resetPassUser, setResetPassUser] = useState<UserItem | null>(null);
  const [approvingUser, setApprovingUser] = useState<UserItem | null>(null);
  const [rejectingUser, setRejectingUser] = useState<UserItem | null>(null);

  // Forms state
  const [approveRole, setApproveRole] = useState('inspector');
  const [approveLabId, setApproveLabId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'inspector',
    lab_id: '',
    active: true,
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    lab_id: '',
    active: true,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassError, setResetPassError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queryParams: string[] = [];
      if (searchQuery) queryParams.push(`search_query=${encodeURIComponent(searchQuery)}`);
      if (roleFilter) queryParams.push(`role_filter=${encodeURIComponent(roleFilter)}`);
      if (labFilter) queryParams.push(`lab_filter=${encodeURIComponent(labFilter)}`);

      const [usersData, pendingData, summaryData, labsData] = await Promise.all([
        api.getUsers(queryParams.join('&')),
        api.getPendingUsers(),
        api.getUsersSummary(),
        api.getLaboratories()
      ]);
      setUsers(usersData);
      setPendingUsers(pendingData);
      setSummary(summaryData);
      setLaboratories(labsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, labFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addForm.name.trim()) errors.name = 'Full name is required';
    if (!addForm.email.trim() || !addForm.email.includes('@')) errors.email = 'Valid official email is required';
    if (!addForm.password || addForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!addForm.role) errors.role = 'Role selection is required';
    if (addForm.role !== 'admin' && !addForm.lab_id) {
      errors.lab_id = 'Laboratory assignment is required for lab-bound roles';
    }

    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    try {
      await api.createUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
        lab_id: addForm.lab_id ? parseInt(addForm.lab_id, 10) : null,
        active: addForm.active,
      });

      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'inspector', lab_id: '', active: true });
      setAddFormErrors({});
      showNotification('New authority member created successfully!');
      loadData();
    } catch (err: any) {
      setAddFormErrors({ api: err.message || 'Failed to create user' });
    }
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      lab_id: user.lab_id ? String(user.lab_id) : '',
      active: user.active,
    });
    setEditFormErrors({});
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const errors: Record<string, string> = {};
    if (!editForm.name.trim()) errors.name = 'Full name is required';
    if (!editForm.email.trim() || !editForm.email.includes('@')) errors.email = 'Valid email is required';
    if (!editForm.role) errors.role = 'Role selection is required';
    if (editForm.role !== 'admin' && !editForm.lab_id) {
      errors.lab_id = 'Laboratory assignment is required for lab-bound roles';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    try {
      await api.updateUser(editingUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        lab_id: editForm.lab_id ? parseInt(editForm.lab_id, 10) : null,
        active: editForm.active,
      });

      setEditingUser(null);
      showNotification('User profile updated successfully!');
      loadData();
    } catch (err: any) {
      setEditFormErrors({ api: err.message || 'Failed to update user profile' });
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleUser) return;
    try {
      const newStatus = !toggleUser.active;
      await api.toggleUserStatus(toggleUser.id, newStatus);
      showNotification(`User account ${newStatus ? 'reactivated' : 'deactivated'} successfully!`);
      setToggleUser(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user status', true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    if (!newPassword || newPassword.length < 6) {
      setResetPassError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetPassError('Passwords do not match');
      return;
    }

    try {
      await api.resetUserPassword(resetPassUser.id, newPassword);
      showNotification(`Password for ${resetPassUser.name} reset successfully!`);
      setResetPassUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setResetPassError('');
    } catch (err: any) {
      setResetPassError(err.message || 'Failed to reset password');
    }
  };

  const openApproveModal = (user: UserItem) => {
    setApprovingUser(user);
    setApproveRole(user.role || 'inspector');
    setApproveLabId(user.lab_id ? String(user.lab_id) : (laboratories[0]?.id ? String(laboratories[0].id) : ''));
  };

  const handleApproveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser) return;

    try {
      await api.approveUser(approvingUser.id, {
        role: approveRole,
        lab_id: approveRole !== 'admin' && approveLabId ? parseInt(approveLabId, 10) : null
      });

      showNotification(`User registration for ${approvingUser.name} APPROVED and activated!`);
      setApprovingUser(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to approve user registration', true);
    }
  };

  const handleRejectRegistration = async () => {
    if (!rejectingUser) return;

    try {
      await api.rejectUser(rejectingUser.id, rejectReason);
      showNotification(`User registration for ${rejectingUser.name} REJECTED.`);
      setRejectingUser(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to reject user registration', true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-sans text-[#413B32]">
      <DemoWatermark />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#D9D1C5]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#413B32] inline-block rounded-xs"></span>
            <h1 className="text-base font-bold tracking-tight uppercase font-mono text-[#413B32]">
              USER & AUTHORITY REGISTER
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5]">
              ADMINISTRATION
            </span>
          </div>
          <p className="text-xs text-[#413B32]/70 font-mono mt-0.5">
            Manage authority accounts, review self-registrations, confirm lab scoping, and enforce credentials security.
          </p>
        </div>

        <button
          onClick={() => {
            setAddForm({ name: '', email: '', password: '', role: 'inspector', lab_id: laboratories[0]?.id ? String(laboratories[0].id) : '', active: true });
            setAddFormErrors({});
            setShowAddModal(true);
          }}
          className="bg-[#413B32] hover:bg-[#413B32]/90 text-[#F1EADE] font-mono text-xs px-3.5 py-1.5 rounded-xs transition inline-flex items-center space-x-1.5 border border-[#413B32]"
        >
          <Plus className="w-3.5 h-3.5 text-[#A7BABA]" />
          <span>+ Add User (Admin Created)</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xs text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-900 p-3 rounded-xs text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Metrics Strip */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3 shadow-2xs font-mono">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D9D1C5]/60 gap-2 md:gap-0">
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-[#413B32]/70 block">Total Users</span>
            <span className="text-lg font-bold text-[#413B32]">{summary?.total_users || 0}</span>
          </div>
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-emerald-900 block">Active Members</span>
            <span className="text-lg font-bold text-emerald-900">{summary?.active_users || 0}</span>
          </div>
          <div
            onClick={() => setActiveTab('pending')}
            className="px-3 py-0.5 flex items-center justify-between md:block cursor-pointer hover:bg-[#F1EADE]/40 transition"
          >
            <span className="text-[10px] font-semibold uppercase text-amber-900 block">Pending Registrations</span>
            <span className="text-lg font-bold text-amber-900">{summary?.pending_users || 0}</span>
          </div>
          <div className="px-3 py-0.5 flex items-center justify-between md:block">
            <span className="text-[10px] font-semibold uppercase text-[#413B32]/70 block">Laboratories</span>
            <span className="text-lg font-bold text-[#413B32]">{laboratories.length}</span>
          </div>
        </div>
      </div>

      {/* PENDING SELF-REGISTRATIONS REGISTER SECTION */}
      {pendingUsers.length > 0 && (
        <div className="bg-[#FFFFFF] border border-amber-300 rounded-sm p-4 space-y-3 shadow-2xs font-mono">
          <div className="flex items-center justify-between border-b border-amber-300 pb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-800" />
              <h2 className="text-xs font-bold uppercase text-amber-900">
                PENDING SELF-REGISTRATION REQUESTS ({pendingUsers.length})
              </h2>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs border border-amber-300 font-bold">
              ACTION REQUIRED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-amber-50 text-amber-950 font-mono font-semibold uppercase text-[10px] border-b border-amber-300">
                <tr>
                  <th className="p-2.5">Applicant Name</th>
                  <th className="p-2.5">Email Address</th>
                  <th className="p-2.5">Requested Role</th>
                  <th className="p-2.5">Assigned Laboratory</th>
                  <th className="p-2.5">Submitted Date</th>
                  <th className="p-2.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200 text-[#413B32]">
                {pendingUsers.map(u => (
                  <tr key={u.id} className="hover:bg-amber-50/50 transition font-mono">
                    <td className="p-2.5 font-bold text-[#413B32]">{u.name}</td>
                    <td className="p-2.5">{u.email}</td>
                    <td className="p-2.5 font-bold">
                      {ROLE_DISPLAY_MAP[u.role] || u.role}
                    </td>
                    <td className="p-2.5 text-[#413B32]/80">{u.lab_name || 'N/A'}</td>
                    <td className="p-2.5 text-[11px] text-[#413B32]/70">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5">
                      <button
                        onClick={() => openApproveModal(u)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-xs text-[11px] transition inline-flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3 text-emerald-200" />
                        <span>APPROVE</span>
                      </button>
                      <button
                        onClick={() => { setRejectingUser(u); setRejectReason(''); }}
                        className="bg-red-700 hover:bg-red-800 text-white font-bold px-2.5 py-1 rounded-xs text-[11px] transition inline-flex items-center space-x-1"
                      >
                        <X className="w-3 h-3 text-red-200" />
                        <span>REJECT</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Users Table Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-3 flex flex-col sm:flex-row gap-2.5 items-center font-mono">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative w-full">
          <Search className="w-3.5 h-3.5 text-[#413B32]/50 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search authority members by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F1EADE]/40 border border-[#D9D1C5] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#413B32] focus:outline-none focus:border-[#413B32]"
          />
        </form>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-2.5 py-1.5 text-xs font-mono text-[#413B32] w-full sm:w-auto"
        >
          <option value="">All Authority Roles</option>
          <option value="admin">Administrator</option>
          <option value="lab_manager">Laboratory Manager</option>
          <option value="inspector">Inspector / Tester</option>
          <option value="reviewer">Reviewer / Approver</option>
        </select>

        <select
          value={labFilter}
          onChange={e => setLabFilter(e.target.value)}
          className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs px-2.5 py-1.5 text-xs font-mono text-[#413B32] w-full sm:w-auto"
        >
          <option value="">All Laboratories</option>
          {laboratories.map(lab => (
            <option key={lab.id} value={lab.id}>{lab.name}</option>
          ))}
        </select>
      </div>

      {/* Main Users Register Table */}
      <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm overflow-hidden">
        <div className="px-3.5 py-2 bg-[#F1EADE]/40 border-b border-[#D9D1C5] flex items-center justify-between font-mono text-[11px]">
          <span className="font-bold text-[#413B32] uppercase">AUTHORITY USERS REGISTER</span>
          <span className="text-[#413B32]/70 text-[10px]">
            Showing {users.length} active authority members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F1EADE] text-[#413B32] font-mono font-semibold uppercase text-[10px] border-b border-[#D9D1C5]">
              <tr>
                <th className="p-2.5">User Name & Email</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Assigned Laboratory</th>
                <th className="p-2.5">Account Status</th>
                <th className="p-2.5">Registration Date</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D1C5]/50 text-[#413B32]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    Loading authority register...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-[#413B32]/60 font-mono">
                    No matching authority user records found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[#F1EADE]/30 transition">
                    <td className="p-2.5">
                      <p className="font-bold text-[#413B32]">{u.name}</p>
                      <p className="text-[10px] font-mono text-[#413B32]/60">{u.email}</p>
                    </td>
                    <td className="p-2.5 font-mono">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border uppercase ${ROLE_BADGE_MAP[u.role] || 'bg-[#F1EADE] text-[#413B32]'}`}>
                        {ROLE_DISPLAY_MAP[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/80">
                      {u.lab_name || 'Central Metrology Authority'}
                    </td>
                    <td className="p-2.5 font-mono">
                      {u.active ? (
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-900 border border-red-300 px-2 py-0.5 rounded-xs text-[10px] font-bold">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-[#413B32]/70">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2.5 text-right space-x-1 font-mono">
                      <button
                        onClick={() => openEditModal(u)}
                        className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs text-[10px] font-semibold inline-flex items-center space-x-1"
                        title="Edit User Profile"
                      >
                        <Edit className="w-3 h-3 text-[#413B32]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setResetPassUser(u)}
                        className="bg-[#FFFFFF] hover:bg-[#F1EADE] text-[#413B32] border border-[#D9D1C5] px-2 py-0.5 rounded-xs text-[10px] font-semibold inline-flex items-center space-x-1"
                        title="Reset Password"
                      >
                        <Key className="w-3 h-3 text-[#413B32]" />
                        <span>Pass</span>
                      </button>

                      <button
                        onClick={() => setToggleUser(u)}
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold border inline-flex items-center space-x-1 ${
                          u.active
                            ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={u.active ? 'Deactivate Account' : 'Reactivate Account'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{u.active ? 'Disable' : 'Enable'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Create New Authority Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Full Name</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                {addFormErrors.name && <p className="text-[10px] text-red-700 mt-0.5">{addFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[#413B32]/70 mb-1">Official Email</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                {addFormErrors.email && <p className="text-[10px] text-red-700 mt-0.5">{addFormErrors.email}</p>}
              </div>

              <div>
                <label className="block text-[#413B32]/70 mb-1">Temporary Password</label>
                <input required type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
                {addFormErrors.password && <p className="text-[10px] text-red-700 mt-0.5">{addFormErrors.password}</p>}
              </div>

              <div>
                <label className="block text-[#413B32]/70 mb-1">Authority Role</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {addForm.role !== 'admin' && (
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Assigned Laboratory</label>
                  <select value={addForm.lab_id} onChange={e => setAddForm({ ...addForm, lab_id: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                    <option value="">Select Laboratory...</option>
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                    ))}
                  </select>
                  {addFormErrors.lab_id && <p className="text-[10px] text-red-700 mt-0.5">{addFormErrors.lab_id}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Create Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Edit Authority User: {editingUser.name}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#413B32]/70 mb-1">Full Name</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Email</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]" />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {editForm.role !== 'admin' && (
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Assigned Laboratory</label>
                  <select value={editForm.lab_id} onChange={e => setEditForm({ ...editForm, lab_id: e.target.value })} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setEditingUser(null)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve User Modal */}
      {approvingUser && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono">
            <h3 className="font-bold text-xs uppercase text-[#413B32] mb-3 border-b border-[#D9D1C5] pb-2">Approve Registration: {approvingUser.name}</h3>
            <form onSubmit={handleApproveRegistration} className="space-y-3 text-xs">
              <p className="text-[#413B32]/80">Confirm authority role and laboratory scoping for this self-registered user:</p>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Approved Role</label>
                <select value={approveRole} onChange={e => setApproveRole(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {approveRole !== 'admin' && (
                <div>
                  <label className="block text-[#413B32]/70 mb-1">Laboratory Scoping</label>
                  <select value={approveLabId} onChange={e => setApproveLabId(e.target.value)} className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]">
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#D9D1C5]">
                <button type="button" onClick={() => setApprovingUser(null)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
                <button type="submit" className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]">Confirm & Activate Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject User Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase text-red-900 border-b border-[#D9D1C5] pb-2">Reject Registration: {rejectingUser.name}</h3>
            <p className="text-[#413B32]/80">Provide optional rejection rationale for logging:</p>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Unverified laboratory email domain"
              className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-2 text-[#413B32]"
            />
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#D9D1C5]">
              <button type="button" onClick={() => setRejectingUser(null)} className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]">Cancel</button>
              <button type="button" onClick={handleRejectRegistration} className="px-3.5 py-1 bg-red-800 rounded-xs text-white font-bold border border-red-800">Reject Application</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Passphrase Modal (Pass Button Action) */}
      {resetPassUser && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase text-[#413B32] border-b border-[#D9D1C5] pb-2">
              Reset Passphrase: {resetPassUser.name}
            </h3>
            <p className="text-[#413B32]/80">
              Set a new secure password for account <span className="font-bold">{resetPassUser.email}</span>:
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[#413B32]/70 mb-1">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                />
              </div>
              <div>
                <label className="block text-[#413B32]/70 mb-1">Confirm New Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#FFFFFF] border border-[#D9D1C5] rounded-xs p-1.5 text-[#413B32]"
                />
              </div>
              {resetPassError && (
                <p className="text-[10px] text-red-700 bg-red-50 border border-red-200 p-1.5 rounded-xs">
                  {resetPassError}
                </p>
              )}
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#D9D1C5]">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetPassError('');
                  }}
                  className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-[#413B32] rounded-xs text-[#F1EADE] font-bold border border-[#413B32]"
                >
                  Update Passphrase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Active/Inactive Status Modal (Disable/Enable Button Action) */}
      {toggleUser && (
        <div className="fixed inset-0 bg-[#413B32]/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#D9D1C5] rounded-sm p-5 max-w-md w-full text-[#413B32] shadow-md font-mono space-y-3 text-xs">
            <h3 className="font-bold text-xs uppercase text-[#413B32] border-b border-[#D9D1C5] pb-2">
              {toggleUser.active ? 'Disable Account' : 'Enable Account'}: {toggleUser.name}
            </h3>
            <p className="text-[#413B32]/80">
              Are you sure you want to {toggleUser.active ? 'deactivate' : 'reactivate'} the authority account for <span className="font-bold">{toggleUser.name}</span> ({toggleUser.email})?
            </p>
            {toggleUser.active ? (
              <div className="bg-red-50 border border-red-200 text-red-900 p-2 rounded-xs text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-red-700" />
                Deactivating this user will prevent them from signing in or conducting evaluations until reactivated by an Administrator.
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded-xs text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-700" />
                Reactivating this user will grant them access according to their assigned role and laboratory.
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#D9D1C5]">
              <button
                type="button"
                onClick={() => setToggleUser(null)}
                className="px-3 py-1 bg-[#F1EADE] rounded-xs border border-[#D9D1C5] text-[#413B32]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`px-3.5 py-1 rounded-xs font-bold text-white border ${
                  toggleUser.active
                    ? 'bg-red-700 hover:bg-red-800 border-red-700'
                    : 'bg-emerald-700 hover:bg-emerald-800 border-emerald-700'
                }`}
              >
                {toggleUser.active ? 'Confirm Disable' : 'Confirm Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

