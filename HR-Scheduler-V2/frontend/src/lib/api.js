/**
 * HR-Scheduler-V2 — API Client
 * Thin wrapper around fetch for the V2 FastAPI backend.
 */

const API_BASE = '';

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

// ── Candidates (Recruiter Pipeline) ──
export const fetchCandidates = () => apiFetch('/api/candidates/');
export const fetchCandidate = (id) => apiFetch(`/api/candidates/${id}`);
export const fetchCandidateStats = () => apiFetch('/api/candidates/stats');
export const generateOffer = (id, data = {}) =>
    apiFetch(`/api/candidates/${id}/generate-offer`, { method: 'POST', body: JSON.stringify(data) });
export async function sendOffer(id, offerContent, attachments = []) {
    const form = new FormData();
    form.append('offer_content', offerContent);
    for (const file of attachments) {
        form.append('attachments', file);
    }
    const res = await fetch(`${API_BASE}/api/candidates/${id}/send-offer`, { method: 'POST', body: form });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `API error ${res.status}`);
    }
    return res.json();
}
export const simulateReply = (id, reply_text) =>
    apiFetch(`/api/candidates/${id}/simulate-reply`, { method: 'POST', body: JSON.stringify({ reply_text }) });
export const checkReplies = () =>
    apiFetch('/api/candidates/check-replies', { method: 'POST' });
export const convertToHire = (id, data) =>
    apiFetch(`/api/candidates/${id}/convert-to-hire`, { method: 'POST', body: JSON.stringify(data) });

// ── Employee Portal ──
export const portalLogin = (email, password) =>
    apiFetch('/api/portal/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getPortalProfile = (id) => apiFetch(`/api/portal/me/${id}`);
export const acknowledgeDocument = (docId) =>
    apiFetch(`/api/portal/acknowledge/${docId}`, { method: 'POST' });
export const acknowledgeByName = (employeeId, docName) =>
    apiFetch(`/api/portal/acknowledge-by-name/${employeeId}`, { method: 'POST', body: JSON.stringify({ doc_name: docName }) });
export const updatePortalProfile = (id, data) =>
    apiFetch(`/api/portal/profile/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const completePortalOnboarding = (id) =>
    apiFetch(`/api/portal/complete-onboarding/${id}`, { method: 'POST' });
export const raiseRequest = (id, data) =>
    apiFetch(`/api/portal/raise-request/${id}`, { method: 'POST', body: JSON.stringify(data) });
export const getPortalRequests = (id) => apiFetch(`/api/portal/requests/${id}`);
export const sendPortalCredentials = (id) =>
    apiFetch(`/api/employees/${id}/send-portal-credentials`, { method: 'POST' });
