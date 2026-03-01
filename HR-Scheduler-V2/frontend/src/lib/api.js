/**
 * HR-Scheduler-V2 — API Client
 * Thin wrapper around fetch for the V2 FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API error ${res.status}`);
    }
    return res.json();
}

// ── Dashboard ──
export const fetchDashboardStats = () => apiFetch('/api/dashboard/stats');
export const fetchWaitingHires = () => apiFetch('/api/dashboard/waiting');
export const fetchRecentHires = (limit = 20) => apiFetch(`/api/dashboard/recent-hires?limit=${limit}`);

// ── Employees ──
export const fetchEmployees = (status) =>
    apiFetch(`/api/employees/${status ? `?status=${status}` : ''}`);
export const fetchEmployee = (id) => apiFetch(`/api/employees/${id}`);
export const createEmployee = (data) =>
    apiFetch('/api/employees/', { method: 'POST', body: JSON.stringify(data) });
export const sendWelcome = (id) =>
    apiFetch(`/api/employees/${id}/send-welcome`, { method: 'POST' });
export const deleteEmployee = (id) =>
    apiFetch(`/api/employees/${id}`, { method: 'DELETE' });
export const confirmJoined = (id) =>
    apiFetch(`/api/employees/${id}/confirm-joined`, { method: 'POST' });

// ── Reference Data (dropdowns) ──
export const fetchDepartments = () => apiFetch('/api/ref/departments');
export const fetchRoles = (deptId) =>
    apiFetch(`/api/ref/roles${deptId ? `?department_id=${deptId}` : ''}`);
export const fetchOffices = () => apiFetch('/api/ref/offices');
export const fetchTeams = (deptId) =>
    apiFetch(`/api/ref/teams${deptId ? `?department_id=${deptId}` : ''}`);
export const fetchManagers = (deptId) =>
    apiFetch(`/api/ref/managers${deptId ? `?department_id=${deptId}` : ''}`);

export async function fetchAllReferenceData() {
    const [departments, roles, offices, teams, managers] = await Promise.all([
        fetchDepartments(), fetchRoles(), fetchOffices(), fetchTeams(), fetchManagers(),
    ]);
    return { departments, roles, offices, teams, managers };
}

// ── Onboarding Wizard ──
export const startOnboarding = (hireId) =>
    apiFetch(`/api/onboarding/${hireId}/start`, { method: 'POST' });
export const getOnboarding = (hireId) =>
    apiFetch(`/api/onboarding/${hireId}`);
export const saveStep = (hireId, step, data) =>
    apiFetch(`/api/onboarding/${hireId}/step/${step}`, {
        method: 'PUT', body: JSON.stringify(data),
    });
export const completeOnboarding = (hireId) =>
    apiFetch(`/api/onboarding/${hireId}/complete`, { method: 'POST' });

// ── Public Forms ──
export const getFormDetails = (token) => apiFetch(`/api/forms/${token}`);
export const submitForm = (token, data) =>
    apiFetch(`/api/forms/${token}`, { method: 'POST', body: JSON.stringify(data) });

// ── Documents ──
export async function uploadDocument(file, newHireId, docType = 'global', needsSig = false) {
    const form = new FormData();
    form.append('file', file);
    if (newHireId) form.append('new_hire_id', newHireId);
    form.append('document_type', docType);
    form.append('requires_signature', needsSig);
    const res = await fetch(`${API_BASE}/api/documents/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}
export const fetchDocuments = (hireId) => apiFetch(`/api/documents/${hireId}`);
export const deleteDocument = (docId) =>
    apiFetch(`/api/documents/${docId}`, { method: 'DELETE' });

// -- Form Response (HR review) --
export const fetchFormResponse = (hireId) => apiFetch(`/api/employees/${hireId}/form-response`);
