'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import { getPortalProfile, acknowledgeDocument, acknowledgeByName, updatePortalProfile, completePortalOnboarding } from '@/lib/api';

/* ── SVG icon components ── */
const IconNDA = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
);
const IconLeave = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const IconUpload = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
);
const IconProfile = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const IconBank = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
    </svg>
);

const STEPS = [
    { key: 'nda', label: 'NDA', Icon: IconNDA },
    { key: 'leave', label: 'Leave Policy', Icon: IconLeave },
    { key: 'documents', label: 'Upload Docs', Icon: IconUpload },
    { key: 'profile', label: 'Personal Profile', Icon: IconProfile },
    { key: 'bank', label: 'Bank & Emergency', Icon: IconBank },
];

/* ── Shared styles ── */
const cardStyle = {
    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
    padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
    maxWidth: 680, margin: '0 auto',
};
const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
    outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
    background: '#f8fafc', transition: 'border-color 0.2s',
};
const btnPrimary = (loading) => ({
    padding: '11px 28px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer', color: '#fff',
    background: loading ? '#94a3b8' : '#00275E',
    boxShadow: '0 2px 8px rgba(0,39,94,0.15)',
    fontFamily: "'Inter', sans-serif", transition: 'all 0.2s',
    display: 'inline-flex', alignItems: 'center', gap: 6,
});

export default function PortalOnboardingPage() {
    const router = useRouter();
    const [employee, setEmployee] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [completed, setCompleted] = useState(false);

    const [profile, setProfile] = useState({
        date_of_birth: '', father_name: '', address: '',
        pan_number: '', aadhaar_number: '',
        bank_account_number: '', bank_ifsc: '', bank_name: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        tshirt_size: '', dietary_preference: '',
    });

    useEffect(() => {
        const stored = localStorage.getItem('portal_employee');
        if (!stored) { router.push('/portal'); return; }
        const emp = JSON.parse(stored);
        if (emp.portal_onboarding_complete) {
            setEmployee(emp);
            setCompleted(true);
            setCurrentStep(5);
            setLoading(false);
            return;
        }
        loadFresh(emp.id);
    }, []);

    async function loadFresh(id, setStep = true) {
        try {
            const emp = await getPortalProfile(id);
            setEmployee(emp);
            localStorage.setItem('portal_employee', JSON.stringify(emp));
            if (emp.profile) {
                setProfile(p => ({ ...p, ...Object.fromEntries(Object.entries(emp.profile).filter(([, v]) => v)) }));
            }
            if (setStep) {
                const docs = emp.documents || [];
                const nda = docs.find(d => d.name.includes('Non-Disclosure'));
                const leave = docs.find(d => d.name.includes('Leave Policy'));
                let step = 0;
                if (nda?.signature_status === 'signed') step = 1;
                if (step >= 1 && leave?.signature_status === 'signed') step = 2;
                setCurrentStep(step);
            }
        } catch { router.push('/portal'); }
        setLoading(false);
    }

    async function handleAcknowledge(docNameContains) {
        if (!employee) return;
        setSaving(true);
        try {
            const doc = (employee.documents || []).find(d => d.name.includes(docNameContains));
            if (doc) {
                await acknowledgeDocument(doc.id);
            } else {
                await acknowledgeByName(employee.id, docNameContains);
            }
            await loadFresh(employee.id);
            setCurrentStep(s => s + 1);
        } catch (e) { console.error(e); alert('Failed: ' + e.message); }
        setSaving(false);
    }

    async function handleSaveProfile(fields) {
        if (!employee) return;
        setSaving(true);
        try {
            await updatePortalProfile(employee.id, fields);
            await loadFresh(employee.id, false);
            setCurrentStep(s => s + 1);
        } catch (e) { console.error(e); }
        setSaving(false);
    }

    async function handleComplete() {
        if (!employee) return;
        setSaving(true);
        try {
            await completePortalOnboarding(employee.id);
            const emp = await getPortalProfile(employee.id);
            localStorage.setItem('portal_employee', JSON.stringify(emp));
            router.push('/portal/dashboard');
        } catch (e) { console.error(e); }
        setSaving(false);
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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
            <EmployeeSidebar employee={employee} />

            <main style={{ flex: 1, marginLeft: 88, padding: '24px 40px 40px' }}>
                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px' }}>Welcome, {name}</p>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>Complete Your Onboarding</h1>
                </div>

                {/* Stepper */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32,
                    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 14,
                    padding: '16px 24px', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                }}>
                    {STEPS.map((s, i) => {
                        const done = i < currentStep;
                        const active = i === currentStep;
                        return (
                            <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    opacity: done || active ? 1 : 0.45,
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: '50%', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        background: done ? '#10b981' : active ? '#00275E' : '#e2e8f0',
                                        color: done || active ? '#fff' : '#94a3b8',
                                        flexShrink: 0, transition: 'all 0.3s',
                                    }}>
                                        {done ? <IconCheck /> : <s.Icon />}
                                    </div>
                                    <span style={{
                                        fontSize: 12, fontWeight: active ? 700 : 500,
                                        color: active ? '#1e293b' : done ? '#10b981' : '#94a3b8',
                                        whiteSpace: 'nowrap',
                                    }}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 2, margin: '0 12px',
                                        background: done ? '#10b981' : '#e8ecf4',
                                        borderRadius: 1, transition: 'background 0.3s',
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ═══ Step 0: NDA ═══ */}
                {currentStep === 0 && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                            Non-Disclosure Agreement
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Please review and acknowledge the NDA below. By signing, you agree to maintain the confidentiality of all proprietary information.
                        </p>
                        <div style={{
                            padding: '20px 24px', background: '#f8fafc', borderRadius: 12,
                            border: '1px solid #e8ecf4', marginBottom: 24, fontSize: 13, color: '#475569', lineHeight: 1.8,
                        }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 10px', letterSpacing: 0.3 }}>CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT</h3>
                            <p>This Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into between Shellkode Pvt Ltd (&quot;Company&quot;) and the undersigned employee.</p>
                            <p><strong>1. Confidential Information:</strong> All business, technical, and financial information disclosed by the Company.</p>
                            <p><strong>2. Obligations:</strong> Employee shall not disclose, publish, or use any Confidential Information without prior written consent.</p>
                            <p><strong>3. Term:</strong> This agreement remains in effect during and 2 years after employment.</p>
                            <p><strong>4. Return of Materials:</strong> Upon termination, employee shall return all confidential materials.</p>
                        </div>
                        <button onClick={() => handleAcknowledge('Non-Disclosure')} disabled={saving} style={btnPrimary(saving)}>
                            {saving ? 'Signing...' : 'I Acknowledge & Sign'}
                        </button>
                    </div>
                )}

                {/* ═══ Step 1: Leave Policy ═══ */}
                {currentStep === 1 && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                            Leave Policy 2026
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Review the company leave policy and acknowledge that you understand the terms.
                        </p>
                        <div style={{
                            padding: '20px 24px', background: '#f8fafc', borderRadius: 12,
                            border: '1px solid #e8ecf4', marginBottom: 24, fontSize: 13, color: '#475569', lineHeight: 1.8,
                        }}>
                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 10px', letterSpacing: 0.3 }}>SHELLKODE LEAVE POLICY</h3>
                            <p><strong>Casual Leave:</strong> 12 days per year</p>
                            <p><strong>Sick Leave:</strong> 6 days per year</p>
                            <p><strong>Earned Leave:</strong> 15 days per year (carry forward up to 10)</p>
                            <p><strong>Public Holidays:</strong> 10 days per year (as per govt calendar)</p>
                            <p><strong>Work From Home:</strong> 2 days per week (flexible)</p>
                            <p><strong>Notice Period:</strong> All leaves must be applied 3 days in advance (except emergencies).</p>
                        </div>
                        <button onClick={() => handleAcknowledge('Leave Policy')} disabled={saving} style={btnPrimary(saving)}>
                            {saving ? 'Signing...' : 'I Acknowledge & Sign'}
                        </button>
                    </div>
                )}

                {/* ═══ Step 2: Upload Documents ═══ */}
                {currentStep === 2 && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                            Upload Required Documents
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Upload the following documents for verification. Supported formats: PDF, JPG, PNG.
                        </p>
                        {[
                            { name: 'Aadhaar Card', desc: 'Government-issued identity proof' },
                            { name: 'PAN Card', desc: 'Tax identification document' },
                            { name: 'Passport Photo', desc: 'Recent passport-size photograph' },
                        ].map((doc) => (
                            <div key={doc.name} style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                                background: '#f8fafc', borderRadius: 12, border: '1px solid #e8ecf4',
                                marginBottom: 10,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8, background: '#e0f2fe',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, color: '#0284c7',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{doc.name}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.desc}</div>
                                </div>
                                <label style={{
                                    padding: '7px 14px', background: '#fff', color: '#00275E',
                                    border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                    Choose File
                                    <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
                                </label>
                            </div>
                        ))}
                        <button onClick={() => setCurrentStep(3)} style={{ ...btnPrimary(false), marginTop: 14 }}>
                            Continue
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}

                {/* ═══ Step 3: Personal Profile ═══ */}
                {currentStep === 3 && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                            Personal Profile Details
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Complete your personal profile for company records.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {[
                                { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                                { key: 'father_name', label: "Father's Name", type: 'text' },
                                { key: 'pan_number', label: 'PAN Number', placeholder: 'ABCDE1234F' },
                                { key: 'aadhaar_number', label: 'Aadhaar Number', placeholder: '1234 5678 9012' },
                                { key: 'tshirt_size', label: 'T-Shirt Size', placeholder: 'S / M / L / XL' },
                                { key: 'dietary_preference', label: 'Dietary Preference', placeholder: 'Veg / Non-Veg / Vegan' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
                                        {f.label}
                                    </label>
                                    <input
                                        type={f.type || 'text'}
                                        value={profile[f.key] || ''}
                                        onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder || ''}
                                        style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 14 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>Address</label>
                            <textarea
                                value={profile.address || ''}
                                onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                                rows={3} placeholder="Full residential address"
                                style={{ ...inputStyle, resize: 'vertical' }}
                                onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <button onClick={() => handleSaveProfile({
                            date_of_birth: profile.date_of_birth, father_name: profile.father_name,
                            pan_number: profile.pan_number, aadhaar_number: profile.aadhaar_number,
                            tshirt_size: profile.tshirt_size, dietary_preference: profile.dietary_preference,
                            address: profile.address,
                        })} disabled={saving} style={{ ...btnPrimary(saving), marginTop: 18 }}>
                            {saving ? 'Saving...' : 'Save & Continue'}
                            {!saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                        </button>
                    </div>
                )}

                {/* ═══ Step 4: Bank & Emergency ═══ */}
                {currentStep === 4 && (
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                            Bank & Emergency Contact
                        </h2>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
                            Add your bank details for payroll and an emergency contact.
                        </p>

                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#00275E', margin: '0 0 10px', letterSpacing: 1, textTransform: 'uppercase' }}>Bank Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                            {[
                                { key: 'bank_name', label: 'Bank Name', placeholder: 'HDFC Bank' },
                                { key: 'bank_account_number', label: 'Account Number', placeholder: '50100123456789' },
                                { key: 'bank_ifsc', label: 'IFSC Code', placeholder: 'HDFC0001234' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{f.label}</label>
                                    <input
                                        type="text" value={profile[f.key] || ''}
                                        onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder} style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            ))}
                        </div>

                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#00275E', margin: '0 0 10px', letterSpacing: 1, textTransform: 'uppercase' }}>Emergency Contact</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {[
                                { key: 'emergency_contact_name', label: 'Contact Name', placeholder: 'Parent / Spouse name' },
                                { key: 'emergency_contact_phone', label: 'Contact Phone', placeholder: '+91 98765 43210' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{f.label}</label>
                                    <input
                                        type="text" value={profile[f.key] || ''}
                                        onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder} style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            ))}
                        </div>

                        <button onClick={async () => {
                            await handleSaveProfile({
                                bank_name: profile.bank_name,
                                bank_account_number: profile.bank_account_number,
                                bank_ifsc: profile.bank_ifsc,
                                emergency_contact_name: profile.emergency_contact_name,
                                emergency_contact_phone: profile.emergency_contact_phone,
                            });
                            await handleComplete();
                        }} disabled={saving} style={{
                            ...btnPrimary(saving), marginTop: 24,
                            background: saving ? '#94a3b8' : '#15803d',
                            boxShadow: '0 2px 8px rgba(21,128,61,0.2)',
                        }}>
                            {saving ? 'Completing...' : 'Complete Onboarding'}
                        </button>
                    </div>
                )}

                {/* ═══ Completed state ═══ */}
                {(completed || currentStep >= 5) && (
                    <div style={cardStyle}>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>Onboarding Complete</h2>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
                                All steps have been completed successfully. You're all set!
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                            {STEPS.map((s) => (
                                <div key={s.key} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                    background: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7',
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%', background: '#10b981',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff',
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button onClick={() => router.push('/portal/dashboard')} style={{
                                padding: '11px 28px', background: '#00275E', color: '#fff',
                                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,39,94,0.15)',
                            }}>
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
