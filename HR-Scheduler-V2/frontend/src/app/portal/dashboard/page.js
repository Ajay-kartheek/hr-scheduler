'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import { getPortalProfile, raiseRequest } from '@/lib/api';

const REQUEST_TYPES = [
    { value: 'it_support', label: 'IT Support', icon: '💻' },
    { value: 'admin', label: 'Admin / Facilities', icon: '🏢' },
    { value: 'access', label: 'Access Request', icon: '🔑' },
    { value: 'other', label: 'Other', icon: '📝' },
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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
            <EmployeeSidebar employee={employee} />

            <main style={{ flex: 1, marginLeft: 88, padding: '24px 40px 40px' }}>
                {/* Welcome Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #00275E, #003580)', borderRadius: 20,
                    padding: '32px 36px', marginBottom: 24, position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,173,239,0.08)' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(99,102,241,0.06)' }} />
                    <div style={{ position: 'relative' }}>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px', fontWeight: 500 }}>Good day,</p>
                        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{name}</h1>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                            {employee.designation} · {employee.department_name} · {employee.employee_id_code}
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[
                        { label: 'Employee ID', value: employee.employee_id_code || '—', icon: '🪪', color: '#00ADEF' },
                        { label: 'Date of Joining', value: employee.doj || '—', icon: '📅', color: '#10b981' },
                        { label: 'Office', value: employee.office_name || 'HQ', icon: '🏢', color: '#8b5cf6' },
                        { label: 'Manager', value: employee.manager_name || '—', icon: '👤', color: '#f59e0b' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                            padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                        }}>
                            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* Equipment / Assets */}
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            💻 Assigned Equipment
                        </h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Your IT assets and their status</p>

                        {assets.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No equipment assigned yet</div>
                        ) : (
                            assets.map((a, i) => (
                                <div key={i} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{a.notes || 'Equipment Set'}</span>
                                        <span style={{
                                            fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                            background: (STATUS_BADGES[a.status] || STATUS_BADGES.pending).bg,
                                            color: (STATUS_BADGES[a.status] || STATUS_BADGES.pending).color,
                                        }}>{a.status}</span>
                                    </div>
                                    {(a.equipment_list || []).map((item, j) => (
                                        <div key={j} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                            background: '#f8fafc', borderRadius: 8, marginBottom: 6,
                                            border: '1px solid #f1f5f9',
                                        }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.status === 'fulfilled' ? '#10b981' : '#fbbf24', flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>

                    {/* ID & Access Card */}
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            🪪 ID & Access Card
                        </h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 20px' }}>Your identification details</p>

                        {/* Virtual ID Card */}
                        <div style={{
                            background: 'linear-gradient(135deg, #00275E, #003580)', borderRadius: 16,
                            padding: '28px 24px', color: '#fff', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(0,173,239,0.1)' }} />
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: 1, marginBottom: 16 }}>SHELLKODE TECHNOLOGIES</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #00ADEF30, #6366f130)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 18, fontWeight: 700, color: '#00ADEF',
                                    border: '2px solid rgba(0,173,239,0.3)',
                                }}>
                                    {employee.first_name?.[0]}{employee.last_name?.[0] || ''}
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{employee.designation}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, fontSize: 11 }}>
                                <div><span style={{ color: '#64748b' }}>ID:</span> <span style={{ fontWeight: 600 }}>{employee.employee_id_code}</span></div>
                                <div><span style={{ color: '#64748b' }}>Dept:</span> <span style={{ fontWeight: 600 }}>{employee.department_name}</span></div>
                                <div><span style={{ color: '#64748b' }}>Email:</span> <span style={{ fontWeight: 600 }}>{employee.company_email}</span></div>
                                <div><span style={{ color: '#64748b' }}>DOJ:</span> <span style={{ fontWeight: 600 }}>{employee.doj}</span></div>
                            </div>
                        </div>

                        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                                <span style={{ fontSize: 12, color: '#64748b' }}>Access card: <strong style={{ color: '#b45309' }}>Pending pickup at reception</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* First Week Calendar */}
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            📅 First Week Calendar
                        </h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Your onboarding schedule</p>

                        {employee.onboarding_plan ? (
                            <div style={{
                                fontSize: 13, color: '#475569', lineHeight: 1.8,
                                whiteSpace: 'pre-line', padding: '16px 20px',
                                background: '#f8fafc', borderRadius: 12, border: '1px solid #e8ecf4',
                                maxHeight: 360, overflowY: 'auto',
                            }}>
                                {employee.onboarding_plan.split('\n').map((line, i) => {
                                    if (line.startsWith('##')) return <div key={i} style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '12px 0 8px' }}>{line.replace(/^#+\s*/, '')}</div>;
                                    if (line.startsWith('**')) return <div key={i} style={{ fontWeight: 700, color: '#00275E', margin: '12px 0 4px' }}>{line.replace(/\*\*/g, '')}</div>;
                                    if (line.startsWith('-')) return <div key={i} style={{ paddingLeft: 12, borderLeft: '2px solid #e8ecf4', margin: '4px 0' }}>{line.substring(2)}</div>;
                                    return <div key={i}>{line}</div>;
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Onboarding plan not yet generated</div>
                        )}
                    </div>

                    {/* IT / Admin Requests */}
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    🛠️ Requests
                                </h3>
                                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>IT support, admin, and access requests</p>
                            </div>
                            <button onClick={() => setShowRequestForm(!showRequestForm)} style={{
                                padding: '8px 16px', background: showRequestForm ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                color: showRequestForm ? '#64748b' : '#fff', border: 'none', borderRadius: 10,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                boxShadow: showRequestForm ? 'none' : '0 4px 14px rgba(0,39,94,0.2)',
                            }}>
                                {showRequestForm ? 'Cancel' : '+ New Request'}
                            </button>
                        </div>

                        {showRequestForm && (
                            <form onSubmit={handleRaiseRequest} style={{
                                padding: '20px 24px', background: '#f8fafc', borderRadius: 12,
                                border: '1px solid #e8ecf4', marginBottom: 16,
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Type</label>
                                        <select value={requestForm.request_type} onChange={e => setRequestForm(f => ({ ...f, request_type: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: 12, color: '#1e293b', background: '#fff', fontFamily: "'Inter', sans-serif" }}>
                                            {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Priority</label>
                                        <select value={requestForm.priority} onChange={e => setRequestForm(f => ({ ...f, priority: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: 12, color: '#1e293b', background: '#fff', fontFamily: "'Inter', sans-serif" }}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Subject</label>
                                    <input value={requestForm.subject} onChange={e => setRequestForm(f => ({ ...f, subject: e.target.value }))}
                                        placeholder="Brief summary of your request" required
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: 12, color: '#1e293b', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
                                    <textarea value={requestForm.description} onChange={e => setRequestForm(f => ({ ...f, description: e.target.value }))}
                                        rows={3} placeholder="Details..."
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e8ecf4', fontSize: 12, color: '#1e293b', resize: 'vertical', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }} />
                                </div>
                                <button type="submit" disabled={submitting} style={{
                                    padding: '8px 20px', background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                }}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        )}

                        {/* Request List */}
                        {requests.length === 0 ? (
                            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No requests yet</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {requests.map(r => (
                                    <div key={r.id} style={{
                                        padding: '14px 18px', background: '#f8fafc', borderRadius: 10,
                                        border: '1px solid #f1f5f9',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
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
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', fontSize: 11, color: '#15803d' }}>
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
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', marginTop: 20, boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            📄 Documents
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                            {docs.map(d => (
                                <div key={d.id} style={{
                                    padding: '16px 20px', background: '#f8fafc', borderRadius: 12,
                                    border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        background: d.signature_status === 'signed' ? '#dcfce7' : '#fef3c7',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                                    }}>
                                        {d.signature_status === 'signed' ? '✅' : '📋'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{d.name}</div>
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
