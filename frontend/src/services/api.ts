const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api/v1';
  }
  return 'https://nawi-backend-7l75.onrender.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export function extractErrorMessage(errorData: any, defaultMsg: string = 'An error occurred'): string {
  if (!errorData) return defaultMsg;
  if (typeof errorData === 'string') return errorData;
  if (typeof errorData.detail === 'string') return errorData.detail;
  if (Array.isArray(errorData.detail)) {
    const formatted = errorData.detail
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && item.msg) {
          const loc = Array.isArray(item.loc) ? item.loc.filter((l: any) => l !== 'body').join('.') : '';
          return loc ? `${loc}: ${item.msg}` : item.msg;
        }
        return JSON.stringify(item);
      })
      .join(' | ');
    return formatted || defaultMsg;
  }
  if (typeof errorData.detail === 'object' && errorData.detail !== null) {
    return errorData.detail.msg || errorData.detail.message || JSON.stringify(errorData.detail);
  }
  if (typeof errorData.message === 'string') return errorData.message;
  if (typeof errorData.error === 'string') return errorData.error;
  return defaultMsg;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('nawi_token');
  const activeLabId = localStorage.getItem('nawi_active_lab_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeLabId && activeLabId !== 'null') {
    headers['X-Laboratory-Id'] = activeLabId;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(`Network connection error: Unable to connect to backend server (${API_BASE_URL}). Please check your connection.`);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `HTTP Error ${res.status}` }));
    const msg = extractErrorMessage(errorData, `HTTP Error ${res.status}`);
    throw new Error(msg);
  }

  return res.json();
}

export async function downloadAuthenticatedFile(endpoint: string, fallbackFilename: string): Promise<void> {
  const token = localStorage.getItem('nawi_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `HTTP Error ${res.status}` }));
    const msg = extractErrorMessage(errorData, `HTTP Error ${res.status}`);
    throw new Error(msg);
  }

  let filename = fallbackFilename;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
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
  getInstruments: (labId?: number | null) => fetchApi(`/instruments${labId ? `?lab_id=${labId}` : ''}`),
  registerInstrument: (data: any) => fetchApi('/instruments', { method: 'POST', body: JSON.stringify(data) }),
  suggestTests: (modelId: number) => fetchApi(`/instruments/suggest-tests/${modelId}`),

  // Sessions
  getSessions: (statusFilter?: string, labId?: number | null) => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (labId !== undefined && labId !== null) params.append('lab_id', String(labId));
    const queryStr = params.toString();
    return fetchApi(`/sessions${queryStr ? `?${queryStr}` : ''}`);
  },
  getSession: (id: number) => fetchApi(`/sessions/${id}`),
  createSession: (data: any) => fetchApi('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  enterObservation: (sessionId: number, data: any) => fetchApi(`/sessions/${sessionId}/observations`, { method: 'POST', body: JSON.stringify(data) }),
  submitSession: (sessionId: number) => fetchApi(`/sessions/${sessionId}/submit`, { method: 'POST' }),
  reviewSession: (sessionId: number, data: any) => fetchApi(`/sessions/${sessionId}/review`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  searchReports: (params?: string, labId?: number | null) => {
    const searchParams = new URLSearchParams(params || '');
    if (labId !== undefined && labId !== null) searchParams.append('lab_id', String(labId));
    const queryStr = searchParams.toString();
    return fetchApi(`/reports${queryStr ? `?${queryStr}` : ''}`);
  },
  getReportPdfUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/download/pdf`,
  getReportDocxUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/download/docx`,
  getReportCsvUrl: () => `${API_BASE_URL}/reports/export/csv`,
  getReportJsonUrl: (reportId: number) => `${API_BASE_URL}/reports/${reportId}/export/json`,
  downloadReportPdf: (reportId: number) => downloadAuthenticatedFile(`/reports/${reportId}/download/pdf`, `NAWI-Report-${reportId}.pdf`),
  downloadReportDocx: (reportId: number) => downloadAuthenticatedFile(`/reports/${reportId}/download/docx`, `NAWI-Report-${reportId}.docx`),
  downloadReportCsv: () => downloadAuthenticatedFile('/reports/export/csv', 'NAWI_Reports_Repository.csv'),
  downloadReportJson: (reportId: number) => downloadAuthenticatedFile(`/reports/${reportId}/export/json`, `NAWI-Report-${reportId}.json`),

  // Rules
  getRuleVersions: () => fetchApi('/rules/versions'),
  getRuleLimits: (versionId?: number) => fetchApi(`/rules/limits${versionId ? `?version_id=${versionId}` : ''}`),

  // Equipment
  getEquipment: (labId?: number | null) => fetchApi(`/equipment${labId ? `?lab_id=${labId}` : ''}`),
  createEquipment: (data: any) => fetchApi('/equipment', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getDashboardSummary: (labId?: number | null) => fetchApi(`/analytics/dashboard-summary${labId ? `?lab_id=${labId}` : ''}`),
  getFailurePatterns: (labId?: number | null) => fetchApi(`/analytics/failure-patterns${labId ? `?lab_id=${labId}` : ''}`),
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
  downloadEvidenceFile: (sessionId: number, evidenceId: number, fallbackName?: string) => downloadAuthenticatedFile(`/sessions/${sessionId}/evidence/${evidenceId}/download`, fallbackName || `Evidence-${evidenceId}`),
};

