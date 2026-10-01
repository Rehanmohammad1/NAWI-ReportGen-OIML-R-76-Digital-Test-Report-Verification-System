const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('nawi_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Network response was not ok' }));
    throw new Error(errorData.detail || `HTTP Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  registerUser: (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getPublicLaboratories: () => fetchApi('/auth/laboratories'),

  // Instruments
  getManufacturers: () => fetchApi('/instruments/manufacturers'),
  createManufacturer: (data: any) => fetchApi('/instruments/manufacturers', { method: 'POST', body: JSON.stringify(data) }),
  getModels: () => fetchApi('/instruments/models'),
  createModel: (data: any) => fetchApi('/instruments/models', { method: 'POST', body: JSON.stringify(data) }),
  getInstruments: () => fetchApi('/instruments'),
  registerInstrument: (data: any) => fetchApi('/instruments', { method: 'POST', body: JSON.stringify(data) }),
  suggestTests: (modelId: number) => fetchApi(`/instruments/suggest-tests/${modelId}`),

  // Sessions
  getSessions: (statusFilter?: string) => fetchApi(`/sessions${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  getSession: (id: number) => fetchApi(`/sessions/${id}`),
  createSession: (data: any) => fetchApi('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  enterObservation: (sessionId: number, data: any) => fetchApi(`/sessions/${sessionId}/observations`, { method: 'POST', body: JSON.stringify(data) }),
  submitSession: (sessionId: number) => fetchApi(`/sessions/${sessionId}/submit`, { method: 'POST' }),
  reviewSession: (sessionId: number, data: any) => fetchApi(`/sessions/${sessionId}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  searchReports: (params?: string) => fetchApi(`/reports${params ? `?${params}` : ''}`),
  getReportPdfUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/download/pdf`,
  getReportDocxUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/download/docx`,
  getReportCsvUrl: () => `${API_BASE_URL}/reports/export/csv`,
  getReportJsonUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/export/json`,

  // Rules
  getRuleVersions: () => fetchApi('/rules/versions'),
  getRuleLimits: (versionId?: number) => fetchApi(`/rules/limits${versionId ? `?version_id=${versionId}` : ''}`),

  // Equipment
  getEquipment: () => fetchApi('/equipment'),
  createEquipment: (data: any) => fetchApi('/equipment', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getDashboardSummary: () => fetchApi('/analytics/dashboard-summary'),
  getFailurePatterns: () => fetchApi('/analytics/failure-patterns'),
  getInstrumentHistory: (modelId: number) => fetchApi(`/analytics/instrument-history/${modelId}`),

  // Notifications
  getNotifications: () => fetchApi('/notifications'),
  markNotificationRead: (id: number) => fetchApi(`/notifications/${id}/read`, { method: 'POST' }),

  // Public Verify
  publicVerify: (reportNum: string) => fetchApi(`/verify/${reportNum}`),

  // User Management
  getUsers: (params?: string) => fetchApi(`/users${params ? `?${params}` : ''}`),
  getUsersSummary: () => fetchApi('/users/summary'),
  getLaboratories: () => fetchApi('/users/laboratories'),
  getPendingUsers: () => fetchApi('/users/pending'),
  getUser: (id: number) => fetchApi(`/users/${id}`),
  createUser: (data: any) => fetchApi('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => fetchApi(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleUserStatus: (id: number, active: boolean) => fetchApi(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  resetUserPassword: (id: number, new_password: string) => fetchApi(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  approveUser: (id: number, data?: any) => fetchApi(`/users/${id}/approve`, { method: 'POST', body: JSON.stringify(data || {}) }),
  rejectUser: (id: number, reason?: string) => fetchApi(`/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Evidence Management
  uploadEvidence: async (sessionId: number, formData: FormData) => {
    const token = localStorage.getItem('nawi_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Evidence upload failed' }));
      throw new Error(errorData.detail || `HTTP Error ${res.status}`);
    }
    return res.json();
  },
  deleteEvidence: (sessionId: number, evidenceId: number) => fetchApi(`/sessions/${sessionId}/evidence/${evidenceId}`, { method: 'DELETE' }),
  getEvidenceDownloadUrl: (sessionId: number, evidenceId: number) => `${API_BASE_URL}/sessions/${sessionId}/evidence/${evidenceId}/download`,
};
