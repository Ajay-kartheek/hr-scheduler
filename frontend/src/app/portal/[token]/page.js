'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PortalPage() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('overview');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => { loadPortal(); }, [token]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    async function loadPortal() {
        try {
            const res = await fetch(`${API_BASE}/api/portal/${token}`);
            if (res.status === 403) throw new Error('Portal access not yet granted. Please wait for HR to activate your portal.');
            if (!res.ok) throw new Error('Invalid portal link');
            setData(await res.json());
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }

    async function handleStartModule(moduleId) {
        await fetch(`${API_BASE}/api/portal/${token}/training/${moduleId}/start`, { method: 'POST' });
        loadPortal();
    }

    async function handleAcknowledge(moduleId) {
        await fetch(`${API_BASE}/api/portal/${token}/training/${moduleId}/acknowledge`, { method: 'POST' });
        loadPortal();
    }

    async function handleChat(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const question = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', text: question }]);
        setChatInput('');
        setChatLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/ai/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    history: chatMessages.map(m => ({ role: m.role, content: m.text })),
                }),
            });
            const result = await res.json();
            setChatMessages(prev => [...prev, { role: 'assistant', text: result.response }]);
        } catch {
            setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
        }
        setChatLoading(false);
    }

    if (loading) return <div style={s.page}><div style={s.center}><div style={s.spinner}></div></div></div>;
    if (error) return (
        <div style={s.page}>
            <div style={s.center}>
                <div style={s.errorBox}>
                    <h2 style={{ fontSize: '20px', color: '#dc2626', marginBottom: '8px' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280' }}>{error}</p>
                </div>
            </div>
        </div>
    );

    const emp = data.employee;
    const tp = data.training_progress;
    const initial = (emp.first_name?.[0] || 'N').toUpperCase();

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'training', label: 'Training & Policies' },
        { key: 'schedule', label: 'Day 1 Schedule' },
        { key: 'chat', label: 'Ask Me Anything' },
    ];

    return (
        <div style={s.page}>
            {/* Top Bar */}
            <div style={s.topBar}>
                <div style={s.topBarInner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={s.topLogo}>S</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Shellkode Technologies</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Employee Onboarding Portal</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{emp.full_name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{emp.designation} · {emp.domain}</div>
                        </div>
                        <div style={s.avatar}>{initial}</div>
                    </div>
                </div>
            </div>

            <div style={s.container}>
                {/* Welcome Banner */}
                <div style={s.welcomeBanner}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                        Welcome, {emp.first_name || 'there'}!
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                        Complete your onboarding below. Your progress is tracked automatically.
                    </p>
                    {/* Progress bar */}
                    <div style={s.progressWrap}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Onboarding Progress</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{tp.completion_percentage}%</span>
                        </div>
                        <div style={s.progressTrack}>
                            <div style={{ ...s.progressFill, width: `${tp.completion_percentage}%` }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                            {tp.completed} of {tp.total_modules} modules completed
                        </div>
                    </div>
                </div>

                {/* Tab Bar */}
                <div style={s.tabBar}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={tab === t.key ? { ...s.tab, ...s.tabActive } : s.tab}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {tab === 'overview' && (
                    <div>
                        {/* Info Cards */}
                        <div style={s.infoGrid}>
                            <div style={s.infoCard}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Role ID</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#4f46e5', fontFamily: "'JetBrains Mono', monospace" }}>{emp.role_id || 'Pending'}</div>
                            </div>
                            <div style={s.infoCard}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Company Email</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{emp.company_email || 'Pending'}</div>
                            </div>
                            <div style={s.infoCard}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Date of Joining</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{emp.doj ? new Date(emp.doj).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}</div>
                            </div>
                            <div style={s.infoCard}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Laptop</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{emp.laptop_status?.replace('_', ' ') || 'Pending'}</div>
                            </div>
                        </div>

                        {/* Company Info */}
                        <div style={s.card}>
                            <h3 style={s.cardTitle}>About Shellkode Technologies</h3>
                            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.7 }}>{data.company_info.mission}</p>
                            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {data.company_info.values.map(v => (
                                    <span key={v} style={s.valueTag}>{v}</span>
                                ))}
                            </div>
                        </div>

                        {/* Workflow Steps */}
                        {data.workflow_steps.length > 0 && (
                            <div style={{ ...s.card, marginTop: '16px' }}>
                                <h3 style={s.cardTitle}>Your Onboarding Checklist</h3>
                                {data.workflow_steps.map(step => (
                                    <div key={step.id} style={s.checkItem}>
                                        <div style={step.status === 'completed' ? s.checkDone : s.checkPending}>
                                            {step.status === 'completed' ? '✓' : ''}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: step.status === 'completed' ? '#16a34a' : '#111827' }}>
                                                {step.step_name}
                                            </div>
                                            {step.step_description && (
                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{step.step_description}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'training' && (
                    <div>
                        {tp.modules.length === 0 ? (
                            <div style={s.emptyState}>
                                <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '4px' }}>No training modules assigned yet</h3>
                                <p style={{ color: '#9ca3af', fontSize: '13px' }}>Training modules will appear here once your onboarding begins.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {tp.modules.map(mod => (
                                    <div key={mod.id} style={s.trainingCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{mod.module.title}</div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                    {mod.module.training_type} · {mod.module.duration_minutes} min
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '12px',
                                                background: mod.status === 'completed' ? '#dcfce7' : mod.status === 'in_progress' ? '#dbeafe' : '#f0f1f5',
                                                color: mod.status === 'completed' ? '#16a34a' : mod.status === 'in_progress' ? '#2563eb' : '#6b7280',
                                            }}>
                                                {mod.status === 'completed' ? 'Completed' : mod.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                            </span>
                                        </div>
                                        {mod.module.description && (
                                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.6 }}>
                                                {mod.module.description}
                                            </p>
                                        )}
                                        {mod.module.content_html && (
                                            <div style={s.contentBox}
                                                dangerouslySetInnerHTML={{ __html: mod.module.content_html }} />
                                        )}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            {mod.status === 'not_started' && (
                                                <button onClick={() => handleStartModule(mod.module.id)} style={s.btnPrimary}>
                                                    Start Module
                                                </button>
                                            )}
                                            {mod.status === 'in_progress' && mod.module.requires_acknowledgment && !mod.acknowledgment_signed && (
                                                <button onClick={() => handleAcknowledge(mod.module.id)} style={s.btnSuccess}>
                                                    I Acknowledge & Understand
                                                </button>
                                            )}
                                            {mod.acknowledgment_signed && (
                                                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Acknowledged</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'schedule' && (
                    <div style={s.card}>
                        <h3 style={s.cardTitle}>Your Day 1 Schedule</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
                            {emp.doj ? `Your first day is ${new Date(emp.doj).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}` : 'Date of joining will be confirmed soon.'}
                        </p>
                        {[
                            { time: '9:00 AM', title: 'Welcome & Badge Collection', desc: 'Report to Reception, ground floor. Collect your ID badge and welcome kit.' },
                            { time: '10:00 AM', title: 'HR Induction Session', desc: 'Company overview, policies, benefits, leave structure, and compliance training.' },
                            { time: '11:30 AM', title: 'Manager 1:1', desc: 'Meet your reporting manager. Discuss team goals, expectations, and your 30-day plan.' },
                            { time: '12:30 PM', title: 'Lunch with Buddy', desc: 'Your onboarding buddy will take you for lunch and show you around the office.' },
                            { time: '2:00 PM', title: 'IT Setup & Tools Walkthrough', desc: 'Laptop setup, VPN, email, Slack/Teams, development tools, and security configuration.' },
                            { time: '3:30 PM', title: 'Team Introduction', desc: 'Meet your team members. Quick intro round and team norms overview.' },
                            { time: '4:30 PM', title: 'End of Day Wrap-up', desc: 'HR check-in. Questions, feedback, and plan for Day 2.' },
                        ].map((item, i) => (
                            <div key={i} style={s.scheduleItem}>
                                <div style={s.scheduleTime}>{item.time}</div>
                                <div style={s.scheduleLine}></div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{item.title}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'chat' && (
                    <div style={s.chatContainer}>
                        <div style={s.chatMessages}>
                            {chatMessages.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <h3 style={{ fontSize: '16px', color: '#374151', marginBottom: '8px' }}>Ask me anything!</h3>
                                    <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '400px', margin: '0 auto' }}>
                                        I can answer questions about Shellkode's policies, leave structure, work hours, team culture, and more.
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                                        {['What are the work hours?', 'How many leaves do I get?', 'What is the probation period?', 'Tell me about the team'].map(q => (
                                            <button key={q} onClick={() => { setChatInput(q); }}
                                                style={s.suggestBtn}>{q}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={msg.role === 'user' ? s.chatBubbleUser : s.chatBubbleBot}>
                                    <div style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={s.chatBubbleBot}>
                                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>Thinking...</div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleChat} style={s.chatInputBar}>
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                                placeholder="Ask a question about Shellkode..."
                                style={s.chatInputField} />
                            <button type="submit" disabled={chatLoading || !chatInput.trim()} style={s.chatSendBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', -apple-system, sans-serif" },
    center: { maxWidth: '500px', margin: '0 auto', padding: '100px 20px' },
    spinner: { width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
    errorBox: { textAlign: 'center', background: 'white', borderRadius: '16px', padding: '48px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    topBar: { background: 'white', borderBottom: '1px solid #e5e7eb', padding: '14px 0', position: 'sticky', top: 0, zIndex: 50 },
    topBarInner: { maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    topLogo: { width: '36px', height: '36px', background: '#4f46e5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'white' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 },
    container: { maxWidth: '900px', margin: '0 auto', padding: '28px 24px' },
    welcomeBanner: { background: 'white', borderRadius: '16px', padding: '28px 32px', border: '1px solid #e5e7eb', marginBottom: '20px' },
    progressWrap: { marginTop: '20px' },
    progressTrack: { width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #4f46e5, #6366f1)', borderRadius: '4px', transition: 'width 500ms ease' },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '20px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid #e5e7eb' },
    tab: { flex: 1, padding: '10px 16px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, color: '#6b7280', cursor: 'pointer', borderRadius: '8px', fontFamily: "'Inter', sans-serif", transition: 'all 200ms' },
    tabActive: { background: '#4f46e5', color: 'white', fontWeight: 600 },
    infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' },
    infoCard: { background: 'white', borderRadius: '12px', padding: '18px 20px', border: '1px solid #e5e7eb' },
    card: { background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' },
    cardTitle: { fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '12px' },
    valueTag: { fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: '#eef2ff', color: '#4f46e5' },
    checkItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f0f1f5' },
    checkDone: { width: '22px', height: '22px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
    checkPending: { width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #d1d5db', flexShrink: 0 },
    emptyState: { textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' },
    trainingCard: { background: 'white', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e5e7eb' },
    contentBox: { fontSize: '13px', color: '#374151', lineHeight: 1.7, background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
    btnPrimary: { padding: '8px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
    btnSuccess: { padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
    scheduleItem: { display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 0', borderBottom: '1px solid #f0f1f5' },
    scheduleTime: { fontSize: '13px', fontWeight: 700, color: '#4f46e5', fontFamily: "'JetBrains Mono', monospace", minWidth: '80px', flexShrink: 0 },
    scheduleLine: { width: '3px', minHeight: '40px', background: '#e0e7ff', borderRadius: '2px', flexShrink: 0 },
    chatContainer: { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 300px)', minHeight: '400px' },
    chatMessages: { flex: 1, overflowY: 'auto', padding: '20px' },
    chatBubbleUser: { background: '#4f46e5', color: 'white', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', marginBottom: '10px', maxWidth: '80%', marginLeft: 'auto' },
    chatBubbleBot: { background: '#f0f1f5', color: '#111827', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', marginBottom: '10px', maxWidth: '80%' },
    chatInputBar: { display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #e5e7eb' },
    chatInputField: { flex: 1, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none', background: '#f5f6fa' },
    chatSendBtn: { width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    suggestBtn: { padding: '6px 14px', background: '#eef2ff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
};
