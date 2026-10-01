import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DemoWatermark } from '../components/DemoWatermark';
import { 
  Users, UserCheck, Shield, Plus, Search, Filter, 
  Edit, Key, Power, AlertCircle, CheckCircle2, XCircle, Building2, RefreshCw,
  Clock, Check, X, ShieldAlert, UserPlus
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
  admin: 'bg-[#25221F] text-white border-[#25221F]',
  lab_manager: 'bg-[#FAF6F0] text-[#25221F] border-[#E6E2DC]',
  inspector: 'bg-blue-50 text-blue-900 border-blue-200',
  reviewer: 'bg-[#EBF5F1] text-[#2D5A4B] border-[#BDE3D5]',
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
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-[#25221F]">
      <DemoWatermark />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E6E2DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#666059] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#C87A57]"></span>
            <span>Administration & System Governance</span>
          </div>
          <h1 className="font-serif-header text-2xl md:text-3xl font-semibold text-[#25221F] tracking-tight">
            User Authority & Role Management
          </h1>
          <p className="text-xs text-[#666059] mt-1">
            Manage authority accounts, review self-registrations, confirm lab scoping, and enforce credentials security.
          </p>
        </div>

        <button
          onClick={() => {
            setAddForm({ name: '', email: '', password: '', role: 'inspector', lab_id: laboratories[0]?.id ? String(laboratories[0].id) : '', active: true });
            setAddFormErrors({});
            setShowAddModal(true);
          }}
          className="bg-[#C87A57] hover:bg-[#B36846] text-white font-medium text-xs px-4 py-2 rounded-md transition shadow-xs inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add User (Admin Created)</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-[#EBF5F1] border border-[#BDE3D5] text-[#2D5A4B] p-3.5 rounded-lg text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#3E7B66] flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3.5 rounded-lg text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#C54B4B] flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#666059] block mb-1">Total Users</span>
          <span className="text-2xl font-serif-header font-bold text-[#25221F]">{summary?.total_users || 0}</span>
        </div>
        <div className="bg-white border border-[#BDE3D5] rounded-lg p-4 shadow-2xs bg-[#F7FCFA]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2D5A4B] block mb-1">Active Members</span>
          <span className="text-2xl font-serif-header font-bold text-[#2D5A4B]">{summary?.active_users || 0}</span>
        </div>
        <div
          onClick={() => setActiveTab('pending')}
          className="bg-white border border-[#FBE3B5] rounded-lg p-4 shadow-2xs bg-[#FFFDF9] cursor-pointer hover:border-[#D9822B] transition"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-[#B86200] block mb-1">Pending Registrations</span>
          <span className="text-2xl font-serif-header font-bold text-[#B86200]">{summary?.pending_users || 0}</span>
        </div>
        <div className="bg-white border border-[#E6E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-medium uppercase tracking-wider text-[#666059] block mb-1">Laboratories</span>
          <span className="text-2xl font-serif-header font-bold text-[#25221F]">{laboratories.length}</span>
        </div>
      </div>

      {/* PENDING SELF-REGISTRATIONS REGISTER SECTION */}
      {pendingUsers.length > 0 && (
        <div className="bg-white border border-[#FBE3B5] rounded-lg p-5 space-y-4 shadow-2xs bg-[#FFFDF9]">
          <div className="flex items-center justify-between border-b border-[#FBE3B5] pb-3">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-[#B86200]" />
              <h2 className="font-serif-header text-sm font-semibold text-[#B86200]">
                Pending Self-Registration Requests ({pendingUsers.length})
              </h2>
            </div>
            <span className="text-xs bg-[#FFF8EE] text-[#B86200] px-3 py-1 rounded-full border border-[#FBE3B5] font-mono font-semibold">
              ACTION REQUIRED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
                <tr>
                  <th className="p-3 pl-4">Applicant Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Requested Role</th>
                  <th className="p-3">Assigned Laboratory</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3 pr-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
                {pendingUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white transition">
                    <td className="p-3 pl-4 font-semibold text-[#25221F]">{u.name}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">{u.email}</td>
                    <td className="p-3 font-medium">
                      {ROLE_DISPLAY_MAP[u.role] || u.role}
                    </td>
                    <td className="p-3 text-[#666059]">{u.lab_name || 'N/A'}</td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-4 text-right space-x-2">
                      <button
                        onClick={() => openApproveModal(u)}
                        className="bg-[#3E7B66] hover:bg-[#326453] text-white font-medium px-3 py-1 rounded-md text-xs transition inline-flex items-center space-x-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE</span>
                      </button>
                      <button
                        onClick={() => { setRejectingUser(u); setRejectReason(''); }}
                        className="bg-[#C54B4B] hover:bg-[#A83D3D] text-white font-medium px-3 py-1 rounded-md text-xs transition inline-flex items-center space-x-1 shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5" />
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
      <div className="bg-white border border-[#E6E2DC] rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-center shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-[#666059] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search authority members by name, email, or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9F8F6] border border-[#E6E2DC] rounded-md pl-9 pr-3 py-2 text-xs text-[#25221F] focus:outline-none focus:border-[#C87A57]"
          />
        </form>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-white border border-[#E6E2DC] rounded-md px-3 py-2 text-xs text-[#25221F] w-full sm:w-auto focus:outline-none focus:border-[#C87A57]"
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
          className="bg-white border border-[#E6E2DC] rounded-md px-3 py-2 text-xs text-[#25221F] w-full sm:w-auto focus:outline-none focus:border-[#C87A57]"
        >
          <option value="">All Laboratories</option>
          {laboratories.map(lab => (
            <option key={lab.id} value={lab.id}>{lab.name}</option>
          ))}
        </select>
      </div>

      {/* Main Users Register Table */}
      <div className="bg-white border border-[#E6E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E6E2DC] flex items-center justify-between text-xs">
          <span className="font-serif-header font-semibold text-[#25221F]">Authority Users Register</span>
          <span className="text-[#666059] text-xs font-mono">
            Showing {users.length} active authority members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9F8F6] text-[#666059] font-mono font-semibold uppercase text-[10px] border-b border-[#E6E2DC]">
              <tr>
                <th className="p-3 pl-5">User Name & Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Assigned Laboratory</th>
                <th className="p-3">Account Status</th>
                <th className="p-3">Registration Date</th>
                <th className="p-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DC] text-[#25221F]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#666059]">
                    Loading authority register...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[#666059]">
                    No matching authority user records found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[#FAF6F0]/60 transition">
                    <td className="p-3 pl-5">
                      <p className="font-semibold text-[#25221F]">{u.name}</p>
                      <p className="text-[11px] font-mono text-[#666059]">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border uppercase ${ROLE_BADGE_MAP[u.role] || 'bg-[#FAF6F0] text-[#25221F]'}`}>
                        {ROLE_DISPLAY_MAP[u.role] || u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[#666059]">
                      {u.lab_name || 'Central Metrology Authority'}
                    </td>
                    <td className="p-3">
                      {u.active ? (
                        <span className="bg-[#EBF5F1] text-[#2D5A4B] border border-[#BDE3D5] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="bg-[#FFF5F5] text-[#9B2C2C] border border-[#F5C6C6] px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#666059]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 pr-5 text-right space-x-1.5 font-sans">
                      <button
                        onClick={() => openEditModal(u)}
                        className="bg-white hover:bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center space-x-1 transition"
                        title="Edit User Profile"
                      >
                        <Edit className="w-3 h-3 text-[#666059]" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setResetPassUser(u)}
                        className="bg-white hover:bg-[#FAF6F0] text-[#25221F] border border-[#E6E2DC] px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center space-x-1 transition"
                        title="Reset Password"
                      >
                        <Key className="w-3 h-3 text-[#666059]" />
                        <span>Pass</span>
                      </button>

                      <button
                        onClick={() => setToggleUser(u)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border inline-flex items-center space-x-1 transition ${
                          u.active
                            ? 'bg-[#FFF5F5] text-[#9B2C2C] border-[#F5C6C6] hover:bg-[#FFEBEB]'
                            : 'bg-[#EBF5F1] text-[#2D5A4B] border-[#BDE3D5] hover:bg-[#E1F1EC]'
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
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Create New Authority Member</h3>
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Full Name</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                {addFormErrors.name && <p className="text-[10px] text-[#C54B4B] mt-0.5">{addFormErrors.name}</p>}
              </div>

              <div>
                <label className="block text-[#25221F] font-medium mb-1">Official Email</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                {addFormErrors.email && <p className="text-[10px] text-[#C54B4B] mt-0.5">{addFormErrors.email}</p>}
              </div>

              <div>
                <label className="block text-[#25221F] font-medium mb-1">Temporary Password</label>
                <input required type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
                {addFormErrors.password && <p className="text-[10px] text-[#C54B4B] mt-0.5">{addFormErrors.password}</p>}
              </div>

              <div>
                <label className="block text-[#25221F] font-medium mb-1">Authority Role</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {addForm.role !== 'admin' && (
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Assigned Laboratory</label>
                  <select value={addForm.lab_id} onChange={e => setAddForm({ ...addForm, lab_id: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                    <option value="">Select Laboratory...</option>
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                    ))}
                  </select>
                  {addFormErrors.lab_id && <p className="text-[10px] text-[#C54B4B] mt-0.5">{addFormErrors.lab_id}</p>}
                </div>
              )}

              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Create Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-4 border-b border-[#E6E2DC] pb-2.5">Edit Authority User: {editingUser.name}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Full Name</label>
                <input required type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Email</label>
                <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]" />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {editForm.role !== 'admin' && (
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Assigned Laboratory</label>
                  <select value={editForm.lab_id} onChange={e => setEditForm({ ...editForm, lab_id: e.target.value })} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve User Modal */}
      {approvingUser && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] mb-3 border-b border-[#E6E2DC] pb-2.5">Approve Registration: {approvingUser.name}</h3>
            <form onSubmit={handleApproveRegistration} className="space-y-3.5 text-xs">
              <p className="text-[#666059]">Confirm authority role and laboratory scoping for this self-registered user:</p>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Approved Role</label>
                <select value={approveRole} onChange={e => setApproveRole(e.target.value)} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                  <option value="inspector">Inspector / Tester</option>
                  <option value="reviewer">Reviewer / Approver</option>
                  <option value="lab_manager">Laboratory Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {approveRole !== 'admin' && (
                <div>
                  <label className="block text-[#25221F] font-medium mb-1">Laboratory Scoping</label>
                  <select value={approveLabId} onChange={e => setApproveLabId(e.target.value)} className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]">
                    {laboratories.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-[#E6E2DC]">
                <button type="button" onClick={() => setApprovingUser(null)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#3E7B66] hover:bg-[#326453] rounded-md text-white font-medium shadow-xs">Confirm & Activate Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject User Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg space-y-4 text-xs">
            <h3 className="font-serif-header text-base font-semibold text-[#C54B4B] border-b border-[#E6E2DC] pb-2.5">Reject Registration: {rejectingUser.name}</h3>
            <p className="text-[#666059]">Provide optional rejection rationale for logging:</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Unverified laboratory email domain"
              className="w-full bg-white border border-[#E6E2DC] rounded-md p-2.5 text-[#25221F] focus:outline-none focus:border-[#C54B4B]"
            />
            <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#E6E2DC]">
              <button type="button" onClick={() => setRejectingUser(null)} className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium">Cancel</button>
              <button type="button" onClick={handleRejectRegistration} className="px-4 py-2 bg-[#C54B4B] hover:bg-[#A83D3D] rounded-md text-white font-medium shadow-xs">Reject Application</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Passphrase Modal (Pass Button Action) */}
      {resetPassUser && (
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg space-y-4 text-xs">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-2.5">
              Reset Passphrase: {resetPassUser.name}
            </h3>
            <p className="text-[#666059]">
              Set a new secure password for account <span className="font-semibold text-[#25221F]">{resetPassUser.email}</span>:
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[#25221F] font-medium mb-1">New Password</label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                />
              </div>
              <div>
                <label className="block text-[#25221F] font-medium mb-1">Confirm New Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-white border border-[#E6E2DC] rounded-md p-2 text-[#25221F] focus:outline-none focus:border-[#C87A57]"
                />
              </div>
              {resetPassError && (
                <p className="text-[11px] text-[#C54B4B] bg-[#FFF5F5] border border-[#F5C6C6] p-2 rounded-md">
                  {resetPassError}
                </p>
              )}
              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#E6E2DC]">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setResetPassError('');
                  }}
                  className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C87A57] hover:bg-[#B36846] rounded-md text-white font-medium shadow-xs"
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
        <div className="fixed inset-0 bg-[#25221F]/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#E6E2DC] rounded-xl p-6 max-w-md w-full text-[#25221F] shadow-lg space-y-4 text-xs">
            <h3 className="font-serif-header text-base font-semibold text-[#25221F] border-b border-[#E6E2DC] pb-2.5">
              {toggleUser.active ? 'Disable Account' : 'Enable Account'}: {toggleUser.name}
            </h3>
            <p className="text-[#666059]">
              Are you sure you want to {toggleUser.active ? 'deactivate' : 'reactivate'} the authority account for <span className="font-semibold text-[#25221F]">{toggleUser.name}</span> ({toggleUser.email})?
            </p>
            {toggleUser.active ? (
              <div className="bg-[#FFF5F5] border border-[#F5C6C6] text-[#9B2C2C] p-3 rounded-md text-[11px]">
                <AlertCircle className="w-4 h-4 inline mr-1.5 text-[#C54B4B]" />
                Deactivating this user will prevent them from signing in or conducting evaluations until reactivated by an Administrator.
              </div>
            ) : (
              <div className="bg-[#EBF5F1] border border-[#BDE3D5] text-[#2D5A4B] p-3 rounded-md text-[11px]">
                <CheckCircle2 className="w-4 h-4 inline mr-1.5 text-[#3E7B66]" />
                Reactivating this user will grant them access according to their assigned role and laboratory.
              </div>
            )}
            <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#E6E2DC]">
              <button
                type="button"
                onClick={() => setToggleUser(null)}
                className="px-4 py-2 bg-white rounded-md border border-[#E6E2DC] text-[#25221F] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-md font-medium text-white shadow-xs ${
                  toggleUser.active
                    ? 'bg-[#C54B4B] hover:bg-[#A83D3D]'
                    : 'bg-[#3E7B66] hover:bg-[#326453]'
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


