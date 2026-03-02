'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { fetchEmployee, fetchFormResponse, sendWelcome, startOnboarding } from '@/lib/api';

const STATUS_CONFIG = {
    waiting_for_input: { label: 'Pending', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    welcome_sent: { label: 'Mail Sent', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
    form_received: { label: 'Form Received', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    onboarding_in_progress: { label: 'Onboarding', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    onboarding_completed: { label: 'Completed', bg: '#f0fdf4', color: '#166534', border: '#dcfce7' },
};

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: 180, fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
            <div style={{ flex: 1, fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{value}</div>
        </div>
    );
}

function SectionHeader({ title }) {
    return (
        <div style={{
            fontSize: 12, fontWeight: 700, color: '#00275E', letterSpacing: 1,
            margin: '28px 0 12px', padding: '8px 0', borderBottom: '2px solid #00ADEF20',
        }}>{title}</div>
    );
}

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const hireId = params.id;

    const [hire, setHire] = useState(null);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');

    useEffect(() => {
        if (!hireId) return;
        loadEmployee();
        const interval = setInterval(loadEmployee, 10000);
        return () => clearInterval(interval);
    }, [hireId]);

    async function loadEmployee() {
        try {
            const emp = await fetchEmployee(hireId);
            setHire(emp);
            if (emp.form_submitted) {
                try {
                    const fr = await fetchFormResponse(hireId);
                    setFormData(fr);
                } catch { }
            }
        } catch (e) {
            console.error('Failed to load employee:', e);
        }
        setLoading(false);
    }

    async function handleSendMail() {
        setActionLoading('mail');
        try {
            await sendWelcome(hireId);
            await loadEmployee();
        } catch (e) { console.error(e); }
        setActionLoading('');
    }

    async function handleStartOnboarding() {
        setActionLoading('onboard');
        try {
            await startOnboarding(hireId);
            router.push(`/onboarding/new?hire=${hireId}`);
        } catch (e) { console.error(e); }
        setActionLoading('');
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00ADEF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
            </div>
        );
    }

    if (!hire) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: 18, color: '#1e293b' }}>Employee not found</h2>
                        <button onClick={() => router.push('/dashboard')} style={{ color: '#00ADEF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Back to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    const statusCfg = STATUS_CONFIG[hire.status] || STATUS_CONFIG.waiting_for_input;
    const name = `${hire.first_name} ${hire.last_name || ''}`.trim();
    const initials = `${hire.first_name?.[0] || ''}${hire.last_name?.[0] || ''}`.toUpperCase();
    const isPending = hire.status === 'waiting_for_input';
    const isMailSent = hire.status === 'welcome_sent';
    const isFormReceived = hire.status === 'form_received';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff' }}>
            <Sidebar />

            <main style={{ flex: 1, marginLeft: 88, padding: '20px 36px 36px' }}>

                {/* Breadcrumb */}
                <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#00ADEF', cursor: 'pointer', fontWeight: 500 }} onClick={() => router.push('/dashboard')}>Dashboard</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', margin: '0 6px' }}>&rsaquo;</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{name}</span>
                </div>

                {/* Header Card */}
                <div style={{
                    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                    padding: '28px 32px', marginBottom: 20,
                    boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    display: 'flex', alignItems: 'center', gap: 24,
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #00275E, #003580)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1,
                    }}>
                        {initials}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>{name}</h1>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                            {hire.designation || 'New Hire'}
                            {hire.department_name && <span> -- {hire.department_name}</span>}
                        </div>
                        {hire.personal_email && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{hire.personal_email}</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{
                            fontSize: 12, fontWeight: 600, padding: '6px 18px', borderRadius: 10,
                            background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                        }}>{statusCfg.label}</span>

                        {isPending && (
                            <button onClick={handleSendMail} disabled={actionLoading === 'mail'} style={{
                                padding: '8px 20px', fontSize: 13, fontWeight: 600,
                                background: actionLoading === 'mail' ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                                color: '#fff', border: 'none', borderRadius: 10, cursor: actionLoading === 'mail' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,39,94,0.2)',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                {actionLoading === 'mail' ? 'Sending...' : 'Send Welcome Mail'}
                            </button>
                        )}

                        {isFormReceived && (
                            <button onClick={handleStartOnboarding} disabled={actionLoading === 'onboard'} style={{
                                padding: '8px 20px', fontSize: 13, fontWeight: 600,
                                background: actionLoading === 'onboard' ? '#94a3b8' : 'linear-gradient(135deg, #15803d, #16a34a)',
                                color: '#fff', border: 'none', borderRadius: 10, cursor: actionLoading === 'onboard' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(21,128,61,0.2)',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                {actionLoading === 'onboard' ? 'Starting...' : 'Start Onboarding'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: formData ? '1fr 1fr' : '1fr', gap: 20 }}>

                    {/* Hire Details */}
                    <div style={{
                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                        padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>Employee Details</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Information provided during hire creation</p>

                        <InfoRow label="Full Name" value={name} />
                        <InfoRow label="Personal Email" value={hire.personal_email} />
                        <InfoRow label="Phone" value={hire.phone} />
                        <InfoRow label="Designation" value={hire.designation} />
                        <InfoRow label="Department" value={hire.department_name} />
                        <InfoRow label="Role" value={hire.role_name} />
                        <InfoRow label="Manager" value={hire.manager_name} />
                        <InfoRow label="Office" value={hire.office_name} />
                        <InfoRow label="Team" value={hire.team_name} />
                        <InfoRow label="Date of Joining" value={hire.doj} />
                        <InfoRow label="Country" value={hire.country} />
                        <InfoRow label="LinkedIn" value={hire.linkedin_url} />
                        <InfoRow label="Previous Company" value={hire.previous_company} />
                        <InfoRow label="Years Experience" value={hire.years_experience} />
                        <InfoRow label="Company Email" value={hire.company_email} />
                        <InfoRow label="Employee ID" value={hire.employee_id_code} />
                        {hire.recruiter_notes && (
                            <>
                                <SectionHeader title="RECRUITER NOTES" />
                                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{hire.recruiter_notes}</p>
                            </>
                        )}
                    </div>

                    {/* Form Response -- only shown when submitted */}
                    {formData && (
                        <div style={{
                            background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                            padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>Submitted Form Data</h3>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                                    background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
                                }}>Received</span>
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>
                                Submitted {formData.submitted_at ? new Date(formData.submitted_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </p>

                            <SectionHeader title="PERSONAL DETAILS" />
                            <InfoRow label="Phone" value={formData.phone} />
                            <InfoRow label="Blood Group" value={formData.blood_group} />
                            <InfoRow label="T-Shirt Size" value={formData.tshirt_size} />
                            <InfoRow label="Dietary Preference" value={formData.dietary_preference} />
                            <InfoRow label="Address" value={formData.address} />

                            <SectionHeader title="EMERGENCY CONTACT" />
                            <InfoRow label="Contact Name" value={formData.emergency_contact_name} />
                            <InfoRow label="Contact Phone" value={formData.emergency_contact_phone} />

                            <SectionHeader title="PROFESSIONAL" />
                            <InfoRow label="LinkedIn" value={formData.linkedin_url} />
                            {formData.bio && (
                                <>
                                    <SectionHeader title="BIO" />
                                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{formData.bio}</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Waiting for form -- indicator when mail sent but no form yet */}
                    {isMailSent && !formData && (
                        <div style={{
                            background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                            padding: '40px 28px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', marginBottom: 16,
                                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Welcome Mail Sent</h3>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 300 }}>
                                A welcome email with the onboarding form link has been sent to <strong>{hire.personal_email}</strong>.
                                This section will update once the candidate submits the form.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
