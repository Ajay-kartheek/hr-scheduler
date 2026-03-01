/**
 * HR Scheduler — API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    };

    const res = await fetch(url, config);

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || `API Error: ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export const getDashboardMetrics = () => fetchAPI('/api/dashboard/metrics');
export const getPipeline = () => fetchAPI('/api/dashboard/pipeline');
export const getRecentActivity = (limit = 20) => fetchAPI(`/api/dashboard/activity?limit=${limit}`);

// ─── Employees ──────────────────────────────────────────────────────────────

export const getEmployees = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/api/employees/?${query}`);
};

export const getEmployee = (id) => fetchAPI(`/api/employees/${id}`);

export const createEmployee = (data) =>
    fetchAPI('/api/employees/', { method: 'POST', body: JSON.stringify(data) });

export const updateEmployee = (id, data) =>
    fetchAPI(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEmployee = (id) =>
    fetchAPI(`/api/employees/${id}`, { method: 'DELETE' });

export const sendOffer = (id) =>
    fetchAPI(`/api/employees/${id}/send-offer`, { method: 'POST' });

export const acceptOffer = (id) =>
    fetchAPI(`/api/employees/${id}/accept-offer`, { method: 'POST' });

export const submitEmployeeForm = (formToken, data) =>
    fetchAPI(`/api/employees/form/${formToken}`, { method: 'POST', body: JSON.stringify(data) });

export const getEmployeeWorkflows = (id) => fetchAPI(`/api/employees/${id}/workflows`);
export const getEmployeeEmails = (id) => fetchAPI(`/api/employees/${id}/emails`);

// ─── Workflows ──────────────────────────────────────────────────────────────

export const getWorkflows = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/api/workflows/?${query}`);
};

export const getWorkflow = (id) => fetchAPI(`/api/workflows/${id}`);

export const performStepAction = (stepId, actionData) =>
    fetchAPI(`/api/workflows/steps/${stepId}/action`, { method: 'POST', body: JSON.stringify(actionData) });

export const getPendingSteps = (role = null) =>
    fetchAPI(`/api/workflows/steps/pending${role ? `?assigned_role=${role}` : ''}`);

export const initiateOnboarding = (employeeId) =>
    fetchAPI(`/api/workflows/${employeeId}/initiate-onboarding`, { method: 'POST' });

// ─── AI Services ────────────────────────────────────────────────────────────

export const generateAIContent = (data) =>
    fetchAPI('/api/ai/generate', { method: 'POST', body: JSON.stringify(data) });

export const getEmployeeAIContent = (employeeId) =>
    fetchAPI(`/api/ai/content/${employeeId}`);

export const approveAIContent = (contentId) =>
    fetchAPI(`/api/ai/content/${contentId}/approve`, { method: 'PUT' });

export const editAIContent = (contentId, content) =>
    fetchAPI(`/api/ai/content/${contentId}/edit`, { method: 'PUT', body: JSON.stringify({ content }) });

export const classifyEmail = (payload) =>
    fetchAPI('/api/ai/classify-email', { method: 'POST', body: JSON.stringify(payload) });

export const chatWithBot = (question, history = []) =>
    fetchAPI('/api/ai/chatbot', { method: 'POST', body: JSON.stringify({ question, history }) });

export const getDashboardInsight = () =>
    fetchAPI('/api/ai/dashboard-insight', { method: 'POST' });

export const getEmailActivity = (limit = 50) =>
    fetchAPI(`/api/ai/email-activity?limit=${limit}`);

export const copilotChat = (question, history = []) =>
    fetchAPI('/api/ai/copilot', { method: 'POST', body: JSON.stringify({ question, history }) });

export const getSmartSuggestions = () =>
    fetchAPI('/api/ai/suggestions');

// ─── Notifications ──────────────────────────────────────────────────────────

export const getNotifications = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/api/notifications/?${query}`);
};

export const getUnreadCount = () => fetchAPI('/api/notifications/unread-count');
export const markNotificationRead = (id) => fetchAPI(`/api/notifications/${id}/read`, { method: 'PUT' });
export const markAllRead = () => fetchAPI('/api/notifications/read-all', { method: 'PUT' });

// ─── Org Chart ──────────────────────────────────────────────────────────────

export const getOrgChart = () => fetchAPI('/api/org-chart/');
export const getDepartments = () => fetchAPI('/api/org-chart/departments');

// ─── Portal ─────────────────────────────────────────────────────────────────

export const getPortalDashboard = (token) => fetchAPI(`/api/portal/${token}`);
export const getPortalTraining = (token) => fetchAPI(`/api/portal/${token}/training`);
export const startTraining = (token, moduleId) =>
    fetchAPI(`/api/portal/${token}/training/${moduleId}/start`, { method: 'POST' });
export const completeTraining = (token, moduleId) =>
    fetchAPI(`/api/portal/${token}/training/${moduleId}/complete`, { method: 'POST' });
export const acknowledgePolicy = (token, moduleId) =>
    fetchAPI(`/api/portal/${token}/training/${moduleId}/acknowledge`, { method: 'POST' });
export const submitQuiz = (token, moduleId, answers) =>
    fetchAPI(`/api/portal/${token}/training/${moduleId}/quiz`, { method: 'POST', body: JSON.stringify({ module_id: moduleId, answers }) });
export const getFormDetails = (formToken) => fetchAPI(`/api/portal/form/${formToken}`);
