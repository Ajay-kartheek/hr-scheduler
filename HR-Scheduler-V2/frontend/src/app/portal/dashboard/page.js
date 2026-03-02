'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import { getPortalProfile, raiseRequest } from '@/lib/api';

const REQUEST_TYPES = [
    { value: 'it_support', label: 'IT Support' },
    { value: 'admin', label: 'Admin / Facilities' },
    { value: 'access', label: 'Access Request' },
    { value: 'other', label: 'Other' },
];

const STATUS_BADGES = {
    open: { bg: '#fef3c7', color: '#b45309' },
    in_progress: { bg: '#dbeafe', color: '#1d4ed8' },
    resolved: { bg: '#dcfce7', color: '#15803d' },
    closed: { bg: '#f1f5f9', color: '#64748b' },
    pending: { bg: '#fef3c7', color: '#b45309' },
    approved: { bg: '#dbeafe', color: '#1d4ed8' },
    fulfilled: { bg: '#dcfce7', color: '#15803d' },
};

const sectionCard = {
    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
    padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
};
const sectionTitle = { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' };
const sectionSub = { fontSize: 11, color: '#94a3b8', margin: '0 0 16px' };

export default function PortalDashboardPage() {
    const router = useRouter();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestForm, setRequestForm] = useState({ request_type: 'it_support', subject: '', description: '', priority: 'medium' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('portal_employee');
        if (!stored) { router.push('/portal'); return; }
        const emp = JSON.parse(stored);
        loadFresh(emp.id);
    }, []);

    async function loadFresh(id) {
        try {
            const emp = await getPortalProfile(id);
            setEmployee(emp);
            localStorage.setItem('portal_employee', JSON.stringify(emp));
        } catch { router.push('/portal'); }
        setLoading(false);
    }

    async function handleRaiseRequest(e) {
        e.preventDefault();
        if (!requestForm.subject.trim()) return;
        setSubmitting(true);
        try {
            await raiseRequest(employee.id, requestForm);
            setRequestForm({ request_type: 'it_support', subject: '', description: '', priority: 'medium' });
            setShowRequestForm(false);
            await loadFresh(employee.id);
        } catch (e) { console.error(e); }
        setSubmitting(false);
    }

    if (loading || !employee) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
                <EmployeeSidebar employee={null} />
                <div style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00ADEF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
            </div>
        );
    }

    const name = `${employee.first_name} ${employee.last_name || ''}`.trim();
    const assets = employee.assets || [];
    const requests = employee.requests || [];
    const docs = employee.documents || [];

    const statCards = [
        {
            label: 'Employee ID', value: employee.employee_id_code || '—', color: '#00ADEF',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3" /><line x1="2" y1="10" x2="22" y2="10" /><line x1="6" y1="15" x2="10" y2="15" /></svg>,
        },
        {
            label: 'Date of Joining', value: employee.doj || '—', color: '#10b981',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
        },
        {
            label: 'Office', value: employee.office_name || 'HQ', color: '#8b5cf6',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" /></svg>,
        },
        {
            label: 'Manager', value: employee.manager_name || '—', color: '#f59e0b',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
        },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
            <EmployeeSidebar employee={employee} />

            <main style={{ flex: 1, marginLeft: 88, padding: '24px 40px 40px' }}>
                {/* Welcome Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #00275E, #003580)', borderRadius: 16,
                    padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,173,239,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(99,102,241,0.06)' }} />
                    <div style={{ position: 'relative' }}>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px', fontWeight: 500 }}>Good day,</p>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{name}</h1>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                            {employee.designation}{employee.department_name ? ` · ${employee.department_name}` : ''}{employee.employee_id_code ? ` · ${employee.employee_id_code}` : ''}
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                    {statCards.map(s => (
                        <div key={s.label} style={{
                            ...sectionCard, padding: '18px 20px',
                            display: 'flex', alignItems: 'flex-start', gap: 14,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: `${s.color}12`, color: s.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                {s.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 2 }}>{s.label.toUpperCase()}</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                    {/* Equipment / Assets */}
                    <div style={sectionCard}>
                        <h3 style={sectionTitle}>Assigned Equipment</h3>
                        <p style={sectionSub}>Your IT assets and their current status</p>

                        {assets.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No equipment assigned yet</div>
                        ) : (
                            assets.map((a, i) => (
                                <div key={i} style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{a.notes || 'Equipment Set'}</span>
                                        <span style={{
                                            fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                            background: (STATUS_BADGES[a.status] || STATUS_BADGES.pending).bg,
                                            color: (STATUS_BADGES[a.status] || STATUS_BADGES.pending).color,
                                        }}>{a.status}</span>
                                    </div>
                                    {(a.equipment_list || []).map((item, j) => (
                                        <div key={j} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                                            background: '#f8fafc', borderRadius: 8, marginBottom: 5,
                                            border: '1px solid #f1f5f9',
                                        }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.status === 'fulfilled' ? '#10b981' : '#fbbf24', flexShrink: 0 }} />
                                            <span style={{ fontSize: 12, color: '#1e293b', fontWeight: 500 }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* ID & Access Card */}
                    <div style={sectionCard}>
                        <h3 style={sectionTitle}>ID & Access Card</h3>
                        <p style={sectionSub}>Your employee identification details</p>

                        <div style={{
                            background: 'linear-gradient(135deg, #00275E, #003580)', borderRadius: 14,
                            padding: '24px 22px', color: '#fff', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(0,173,239,0.1)' }} />
                            <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', letterSpacing: 1.2, marginBottom: 14 }}>SHELLKODE TECHNOLOGIES</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: '50%',
                                    background: 'rgba(0,173,239,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 700, color: '#00ADEF',
                                    border: '2px solid rgba(0,173,239,0.3)',
                                }}>
                                    {employee.first_name?.[0]}{employee.last_name?.[0] || ''}
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{employee.designation}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
                                <div><span style={{ color: '#64748b' }}>ID: </span><span style={{ fontWeight: 600 }}>{employee.employee_id_code}</span></div>
                                <div><span style={{ color: '#64748b' }}>Dept: </span><span style={{ fontWeight: 600 }}>{employee.department_name}</span></div>
                                <div><span style={{ color: '#64748b' }}>Email: </span><span style={{ fontWeight: 600 }}>{employee.company_email}</span></div>
                                <div><span style={{ color: '#64748b' }}>DOJ: </span><span style={{ fontWeight: 600 }}>{employee.doj}</span></div>
                            </div>
                        </div>

                        <div style={{ marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24' }} />
                                <span style={{ fontSize: 12, color: '#64748b' }}>Access card: <strong style={{ color: '#b45309' }}>Pending pickup at reception</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* First Week Calendar */}
                    <div style={sectionCard}>
                        <h3 style={sectionTitle}>First Week Schedule</h3>
                        <p style={sectionSub}>Your onboarding plan for the first week</p>

                        {employee.onboarding_plan ? (
                            <div style={{
                                fontSize: 12, color: '#475569', lineHeight: 1.8,
                                whiteSpace: 'pre-line', padding: '14px 18px',
                                background: '#f8fafc', borderRadius: 12, border: '1px solid #e8ecf4',
                                maxHeight: 320, overflowY: 'auto',
                            }}>
                                {employee.onboarding_plan.split('\n').map((line, i) => {
                                    if (line.startsWith('##')) return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '10px 0 6px' }}>{line.replace(/^#+\s*/, '')}</div>;
                                    if (line.startsWith('**')) return <div key={i} style={{ fontWeight: 700, color: '#00275E', margin: '10px 0 4px' }}>{line.replace(/\*\*/g, '')}</div>;
                                    if (line.startsWith('-')) return <div key={i} style={{ paddingLeft: 12, borderLeft: '2px solid #e2e8f0', margin: '3px 0' }}>{line.substring(2)}</div>;
                                    return <div key={i}>{line}</div>;
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Onboarding plan not yet generated</div>
                        )}
                    </div>

                    {/* Requests */}
                    <div style={sectionCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <h3 style={sectionTitle}>Requests</h3>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>IT support, admin, and access requests</p>
                            </div>
                            <button onClick={() => setShowRequestForm(!showRequestForm)} style={{
                                padding: '7px 14px', background: showRequestForm ? '#f1f5f9' : '#00275E',
                                color: showRequestForm ? '#64748b' : '#fff', border: 'none', borderRadius: 8,
                                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                boxShadow: showRequestForm ? 'none' : '0 2px 8px rgba(0,39,94,0.15)',
                            }}>
                                {showRequestForm ? 'Cancel' : '+ New Request'}
                            </button>
                        </div>

                        {showRequestForm && (
                            <form onSubmit={handleRaiseRequest} style={{
                                padding: '16px 20px', background: '#f8fafc', borderRadius: 12,
                                border: '1px solid #e8ecf4', marginBottom: 14,
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Type</label>
                                        <select value={requestForm.request_type} onChange={e => setRequestForm(f => ({ ...f, request_type: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, color: '#1e293b', background: '#fff', fontFamily: "'Inter', sans-serif" }}>
                                            {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Priority</label>
                                        <select value={requestForm.priority} onChange={e => setRequestForm(f => ({ ...f, priority: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, color: '#1e293b', background: '#fff', fontFamily: "'Inter', sans-serif" }}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Subject</label>
                                    <input value={requestForm.subject} onChange={e => setRequestForm(f => ({ ...f, subject: e.target.value }))}
                                        placeholder="Brief summary of your request" required
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, color: '#1e293b', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', background: '#fff' }} />
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
                                    <textarea value={requestForm.description} onChange={e => setRequestForm(f => ({ ...f, description: e.target.value }))}
                                        rows={2} placeholder="Details..."
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, color: '#1e293b', resize: 'vertical', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', background: '#fff' }} />
                                </div>
                                <button type="submit" disabled={submitting} style={{
                                    padding: '8px 18px', background: submitting ? '#94a3b8' : '#00275E',
                                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                }}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        )}

                        {requests.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No requests yet</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {requests.map(r => (
                                    <div key={r.id} style={{
                                        padding: '12px 16px', background: '#f8fafc', borderRadius: 10,
                                        border: '1px solid #f1f5f9',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.subject}</span>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                                background: (STATUS_BADGES[r.status] || STATUS_BADGES.open).bg,
                                                color: (STATUS_BADGES[r.status] || STATUS_BADGES.open).color,
                                            }}>{r.status}</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                            {REQUEST_TYPES.find(t => t.value === r.request_type)?.label || r.request_type}
                                            {' · '}{r.priority}
                                            {' · '}{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                                        </div>
                                        {r.admin_response && (
                                            <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: 11, color: '#15803d' }}>
                                                <strong>Response:</strong> {r.admin_response}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Documents Section */}
                {docs.length > 0 && (
                    <div style={{ ...sectionCard, marginTop: 16 }}>
                        <h3 style={sectionTitle}>Documents</h3>
                        <p style={sectionSub}>Your signed and assigned documents</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                            {docs.map(d => (
                                <div key={d.id} style={{
                                    padding: '14px 18px', background: '#f8fafc', borderRadius: 12,
                                    border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 8,
                                        background: d.signature_status === 'signed' ? '#dcfce7' : '#fef3c7',
                                        color: d.signature_status === 'signed' ? '#15803d' : '#b45309',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        {d.signature_status === 'signed' ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{d.name}</div>
                                        <div style={{ fontSize: 10, color: d.signature_status === 'signed' ? '#15803d' : '#b45309', fontWeight: 500 }}>
                                            {d.signature_status === 'signed' ? 'Acknowledged' : d.requires_signature ? 'Pending signature' : 'Info only'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
