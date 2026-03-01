'use client';

import { useState, useEffect } from 'react';
import { getEmployees, classifyEmail, getEmailActivity } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function MailCenterPage() {
    const [employees, setEmployees] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);
    const [tab, setTab] = useState('activity');
    const [authStatus, setAuthStatus] = useState({ gmail: false, calendar: false });
    const [polling, setPolling] = useState(false);

    // Classify form state
    const [selectedEmp, setSelectedEmp] = useState('');
    const [emailContext, setEmailContext] = useState('offer_reply');
    const [emailBody, setEmailBody] = useState('');
    const [fromEmail, setFromEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [classifying, setClassifying] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        loadData();
        checkAuth();
        const interval = setInterval(() => { loadActivity(); checkAuth(); }, 15000);
        return () => clearInterval(interval);
    }, []);

    async function loadData() {
        getEmployees({ per_page: 100 }).then(data => setEmployees(data.employees || []));
        loadActivity();
    }

    async function loadActivity() {
        try {
            const data = await getEmailActivity(50);
            setActivity(data);
        } catch { }
        setLoadingActivity(false);
    }

    async function checkAuth() {
        try {
            const res = await fetch(`${API}/api/google/auth/status`);
            const data = await res.json();
            setAuthStatus(data);
        } catch { }
    }

    async function connectGmail() {
        try {
            const res = await fetch(`${API}/api/google/auth/gmail`, { method: 'POST' });
            if (res.ok) { checkAuth(); alert('Gmail connected!'); }
            else { const err = await res.json(); alert(err.detail || 'Failed'); }
        } catch (e) { alert('Check the backend terminal — it may have opened a browser for OAuth consent.'); }
    }

    async function connectCalendar() {
        try {
            const res = await fetch(`${API}/api/google/auth/calendar`, { method: 'POST' });
            if (res.ok) { checkAuth(); alert('Calendar connected!'); }
            else { const err = await res.json(); alert(err.detail || 'Failed'); }
        } catch (e) { alert('Check the backend terminal — it may have opened a browser for OAuth consent.'); }
    }

    async function pollNow() {
        setPolling(true);
        try {
            const res = await fetch(`${API}/api/google/gmail/poll`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                loadActivity();
                alert(`Processed ${data.processed} email(s)`);
            } else {
                alert(data.detail || 'Poll failed');
            }
        } catch (e) { alert(e.message); }
        setPolling(false);
    }

    const contextTypes = [
        { value: 'offer_reply', label: 'Candidate Offer Reply', desc: 'Candidate responding to an offer letter' },
        { value: 'admin_laptop', label: 'Admin Laptop Response', desc: 'Admin responding about laptop request' },
        { value: 'it_email', label: 'IT Email Creation', desc: 'IT confirming email ID creation' },
        { value: 'general', label: 'General Email', desc: 'Any other email to classify' },
    ];

    async function handleClassify(e) {
        e.preventDefault();
        if (!emailBody.trim()) return;
        setClassifying(true);
        setResult(null);
        try {
            const empObj = employees.find(e => e.id === selectedEmp);
            const contextLabel = contextTypes.find(c => c.value === emailContext)?.desc || '';
            const res = await classifyEmail({
                email_body: emailBody,
                context: `${contextLabel}. Employee: ${empObj?.full_name || 'Unknown'}`,
                employee_id: selectedEmp || undefined,
                email_context: emailContext,
                from_email: fromEmail,
                subject: subject,
            });
            setResult(res);
            loadActivity(); // refresh feed after classify
        } catch (err) {
            alert(err.message);
        }
        setClassifying(false);
    }

    const statusColors = {
        accepted: { bg: '#dcfce7', color: '#16a34a', icon: '✓' },
        declined: { bg: '#fee2e2', color: '#dc2626', icon: '✗' },
        negotiating: { bg: '#fef3c7', color: '#d97706', icon: '⟳' },
        unclear: { bg: '#f0f1f5', color: '#6b7280', icon: '?' },
    };

    const outboundCount = activity.filter(a => a.direction === 'outbound').length;
    const inboundCount = activity.filter(a => a.direction === 'inbound').length;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Mail Center</h1>
                        <p>Real Gmail integration — inbox monitoring, AI classification, auto-triggers</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {authStatus.gmail && (
                            <button onClick={pollNow} disabled={polling} className="btn btn-primary btn-sm">
                                {polling ? '⏳ Polling...' : '📬 Poll Inbox Now'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Integration Status Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-900)', marginBottom: '2px' }}>
                                📧 Gmail Inbox
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-500)' }}>
                                {authStatus.gmail ? 'kalaiarasan6923@gmail.com · Polling every 2 min' : 'Not connected'}
                            </div>
                        </div>
                        {authStatus.gmail ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a' }}>
                                ● CONNECTED
                            </span>
                        ) : (
                            <button onClick={connectGmail} className="btn btn-primary btn-sm">Connect Gmail</button>
                        )}
                    </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-900)', marginBottom: '2px' }}>
                                📅 Google Calendar
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-500)' }}>
                                {authStatus.calendar ? 'Day 1 events auto-created on offer acceptance' : 'Not connected'}
                            </div>
                        </div>
                        {authStatus.calendar ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a' }}>
                                ● CONNECTED
                            </span>
                        ) : (
                            <button onClick={connectCalendar} className="btn btn-primary btn-sm">Connect Calendar</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: 'var(--brand-600)' }}>{activity.length}</div>
                    <div className="stat-card-label">Total Emails</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: 'var(--teal-600)' }}>{outboundCount}</div>
                    <div className="stat-card-label">Sent (SES)</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-value" style={{ color: 'var(--amber-600)' }}>{inboundCount}</div>
                    <div className="stat-card-label">Received (Gmail)</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'white', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <button onClick={() => setTab('activity')}
                    style={{
                        flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        background: tab === 'activity' ? 'var(--brand-500)' : 'transparent',
                        color: tab === 'activity' ? 'white' : 'var(--text-500)'
                    }}>
                    📬 Live Activity Feed
                </button>
                <button onClick={() => setTab('classify')}
                    style={{
                        flex: 1, padding: '8px', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                        background: tab === 'classify' ? 'var(--brand-500)' : 'transparent',
                        color: tab === 'classify' ? 'white' : 'var(--text-500)'
                    }}>
                    🔍 Classify Incoming Email
                </button>
            </div>

            {/* Activity Feed Tab */}
            {tab === 'activity' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)' }}>Email Activity</h3>
                        <button onClick={loadActivity} className="btn btn-ghost btn-sm">↻ Refresh</button>
                    </div>
                    {activity.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-400)' }}>
                            <p style={{ fontSize: '14px', marginBottom: '4px' }}>No email activity yet</p>
                            <p style={{ fontSize: '12px' }}>When you add a new hire, the offer letter will be sent automatically</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activity.map(item => (
                                <div key={item.id} style={{
                                    padding: '14px 16px',
                                    background: 'var(--bg-muted)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${item.direction === 'outbound' ? '#16a34a' : '#4f46e5'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                                                background: item.direction === 'outbound' ? '#dcfce7' : '#dbeafe',
                                                color: item.direction === 'outbound' ? '#16a34a' : '#2563eb',
                                                textTransform: 'uppercase',
                                            }}>
                                                {item.direction === 'outbound' ? '↑ SENT' : '↓ RECEIVED'}
                                            </span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-900)' }}>
                                                {item.employee_name}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-400)' }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-700)', marginBottom: '2px' }}>
                                        {item.subject || 'No subject'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-500)' }}>
                                        {item.direction === 'outbound'
                                            ? `To: ${item.to_email}`
                                            : `From: ${item.from_email}`}
                                    </div>
                                    {item.ai_classification && (
                                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px',
                                                background: statusColors[item.ai_classification.status]?.bg || '#f0f1f5',
                                                color: statusColors[item.ai_classification.status]?.color || '#6b7280',
                                            }}>
                                                AI: {item.ai_classification.status?.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-500)' }}>
                                                {item.ai_classification.summary}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Classify Tab */}
            {tab === 'classify' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
                    <div className="card">
                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '4px' }}>Process Incoming Email</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-400)' }}>
                                Paste an email reply to classify it and auto-trigger the next workflow step
                            </p>
                        </div>
                        <form onSubmit={handleClassify}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Related Employee</label>
                                    <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} className="form-select">
                                        <option value="">Select employee...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.full_name} — {emp.designation}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Email Context</label>
                                    <select value={emailContext} onChange={e => setEmailContext(e.target.value)} className="form-select">
                                        {contextTypes.map(ct => (
                                            <option key={ct.value} value={ct.value}>{ct.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">From Email</label>
                                    <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} className="form-input" placeholder="sender@email.com" />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Subject</label>
                                    <input value={subject} onChange={e => setSubject(e.target.value)} className="form-input" placeholder="Re: Offer Letter" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Body</label>
                                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                                    className="form-textarea" rows={8}
                                    placeholder="Paste the full email body here..."
                                    style={{ minHeight: '160px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => { setEmailBody(''); setResult(null); }} className="btn btn-secondary">Clear</button>
                                <button type="submit" disabled={classifying || !emailBody.trim()} className="btn btn-primary btn-lg">
                                    {classifying ? 'Classifying...' : 'Classify & Auto-Trigger'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Result */}
                    <div>
                        {result ? (
                            <div className="card">
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-900)', marginBottom: '14px' }}>Classification Result</h3>
                                <div style={{
                                    textAlign: 'center', padding: '20px', borderRadius: 'var(--radius-md)',
                                    background: statusColors[result.status]?.bg || '#f0f1f5', marginBottom: '16px',
                                }}>
                                    <div style={{
                                        fontSize: '20px', fontWeight: 700, textTransform: 'uppercase',
                                        color: statusColors[result.status]?.color || '#6b7280'
                                    }}>
                                        {result.status}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-400)', marginTop: '4px' }}>
                                        Confidence: {(result.confidence * 100).toFixed(0)}%
                                    </div>
                                </div>
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Summary</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-700)', lineHeight: 1.6 }}>{result.summary}</div>
                                </div>
                                <div style={{ marginBottom: '14px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Auto-Triggered Action</div>
                                    <div style={{
                                        fontSize: '13px', fontWeight: 600, color: 'var(--brand-600)',
                                        padding: '8px 12px', background: 'var(--brand-50)', borderRadius: 'var(--radius-sm)'
                                    }}>
                                        {result.suggested_action}
                                    </div>
                                </div>
                                {selectedEmp && result.status === 'accepted' && (
                                    <div style={{
                                        marginTop: '14px', padding: '10px 14px', background: 'var(--green-50)',
                                        border: '1px solid var(--green-100)', borderRadius: 'var(--radius-sm)',
                                        fontSize: '12px', color: 'var(--green-600)', fontWeight: 600,
                                    }}>
                                        🤖 Auto-triggered: {emailContext === 'offer_reply' ? 'Full pre-boarding cascade (Role ID + AI content + portal)' :
                                            emailContext === 'admin_laptop' ? 'Laptop approved' :
                                                emailContext === 'it_email' ? 'Email creation confirmed' : 'Logged'}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--text-400)' }}>
                                    Paste an email and click "Classify" to see the AI classification result and auto-triggered actions
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
