const API_BASE = '/api';

const getAuthToken = () => {
  return localStorage.getItem('inox_token');
};

const authHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('inox_token');
      localStorage.removeItem('inox_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    const message = data.message || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
};

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('inox_token', data.token);
      localStorage.setItem('inox_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  logout() {
    localStorage.removeItem('inox_token');
    localStorage.removeItem('inox_user');
  },

  getCurrentUser() {
    try {
      const u = localStorage.getItem('inox_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  // Dashboard stats
  async getDashboardStats(date) {
    const res = await fetch(`${API_BASE}/schedules/stats/summary?date=${encodeURIComponent(date)}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // Employees
  async getEmployees(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.department) query.set('department', params.department);
    if (params.isActive !== undefined) query.set('isActive', params.isActive);

    const res = await fetch(`${API_BASE}/employees?${query.toString()}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async getDepartments() {
    const res = await fetch(`${API_BASE}/employees/departments`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async createEmployee(employeeData) {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(employeeData)
    });
    return handleResponse(res);
  },

  async updateEmployee(id, employeeData) {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(employeeData)
    });
    return handleResponse(res);
  },

  async bulkImportEmployees(employees) {
    const res = await fetch(`${API_BASE}/employees/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ employees })
    });
    return handleResponse(res);
  },

  // Shifts
  async getShifts() {
    const res = await fetch(`${API_BASE}/shifts`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async createShift(shiftData) {
    const res = await fetch(`${API_BASE}/shifts`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(shiftData)
    });
    return handleResponse(res);
  },

  async updateShift(id, shiftData) {
    const res = await fetch(`${API_BASE}/shifts/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(shiftData)
    });
    return handleResponse(res);
  },

  // Schedules
  async getSchedule(date) {
    const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(date)}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async saveSchedule(date, assignments) {
    const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(date)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ assignments })
    });
    return handleResponse(res);
  },

  async finalizeSchedule(date) {
    const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(date)}/finalize`, {
      method: 'POST',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async reopenSchedule(date, reason) {
    const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(date)}/reopen`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  async copySchedule(targetDate, sourceDate) {
    const res = await fetch(`${API_BASE}/schedules/${encodeURIComponent(targetDate)}/copy-from`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ sourceDate })
    });
    return handleResponse(res);
  },

  getExportUrl(date) {
    const token = getAuthToken();
    return `${API_BASE}/schedules/${encodeURIComponent(date)}/export?token=${encodeURIComponent(token || '')}`;
  },

  // Monthly Schedules
  async getMonthlySchedule(month) {
    const res = await fetch(`${API_BASE}/monthly-schedules/${encodeURIComponent(month)}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async saveMonthlySchedule(month, assignments, status = 'draft') {
    const res = await fetch(`${API_BASE}/monthly-schedules/${encodeURIComponent(month)}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ assignments, status })
    });
    return handleResponse(res);
  },

  getMonthlyExportUrl(month) {
    const token = getAuthToken();
    return `${API_BASE}/monthly-schedules/${encodeURIComponent(month)}/export?token=${encodeURIComponent(token || '')}`;
  },

  // Audit Logs
  async getAuditLogs(limit = 50) {
    const res = await fetch(`${API_BASE}/audit-logs?limit=${limit}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};
