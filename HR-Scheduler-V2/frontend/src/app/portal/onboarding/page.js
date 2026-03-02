'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeSidebar from '@/components/EmployeeSidebar';
import { getPortalProfile, acknowledgeDocument, updatePortalProfile, completePortalOnboarding } from '@/lib/api';

const STEPS = [
    { key: 'nda', label: 'NDA', icon: '📋' },
    { key: 'leave', label: 'Leave Policy', icon: '📅' },
    { key: 'documents', label: 'Upload Docs', icon: '📁' },
    { key: 'profile', label: 'Personal Profile', icon: '👤' },
    { key: 'bank', label: 'Bank & Emergency', icon: '🏦' },
];

export default function PortalOnboardingPage() {
    const router = useRouter();
    const [employee, setEmployee] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile form state
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
        if (emp.portal_onboarding_complete) { router.push('/portal/dashboard'); return; }
        loadFresh(emp.id);
    }, []);

    async function loadFresh(id) {
        try {
            const emp = await getPortalProfile(id);
            setEmployee(emp);
            localStorage.setItem('portal_employee', JSON.stringify(emp));
            if (emp.profile) {
                setProfile(p => ({ ...p, ...Object.fromEntries(Object.entries(emp.profile).filter(([, v]) => v)) }));
            }
            // Auto-advance past completed steps
            const docs = emp.documents || [];
            const nda = docs.find(d => d.name.includes('Non-Disclosure'));
            const leave = docs.find(d => d.name.includes('Leave Policy'));
            let step = 0;
            if (nda?.signature_status === 'signed') step = 1;
            if (step >= 1 && leave?.signature_status === 'signed') step = 2;
            setCurrentStep(step);
        } catch { router.push('/portal'); }
        setLoading(false);
    }

    async function handleAcknowledge(docNameContains) {
        if (!employee) return;
        const doc = employee.documents.find(d => d.name.includes(docNameContains));
        if (!doc) return;
        setSaving(true);
        try {
            await acknowledgeDocument(doc.id);
            await loadFresh(employee.id);
            setCurrentStep(s => s + 1);
        } catch (e) { console.error(e); }
        setSaving(false);
    }

    async function handleSaveProfile(fields) {
        if (!employee) return;
        setSaving(true);
        try {
            await updatePortalProfile(employee.id, fields);
            await loadFresh(employee.id);
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
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px', letterSpacing: 0.5 }}>Welcome, {name}</p>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Complete Your Onboarding</h1>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
                    {STEPS.map((s, i) => (
                        <div key={s.key} style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                background: i < currentStep ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : i === currentStep ? 'linear-gradient(135deg, #00ADEF, #0088cc)'
                                        : '#e2e8f0',
                                color: i <= currentStep ? '#fff' : '#94a3b8',
                                boxShadow: i === currentStep ? '0 4px 14px rgba(0,173,239,0.3)' : 'none',
                                transition: 'all 0.3s',
                            }}>
                                {i < currentStep ? '✓' : s.icon}
                            </div>
                            <span style={{
                                fontSize: 10, fontWeight: 600,
                                color: i <= currentStep ? '#1e293b' : '#94a3b8',
                            }}>{s.label}</span>
                            {i < STEPS.length - 1 && (
                                <div style={{
                                    position: 'absolute', height: 2, width: 'calc(20% - 48px)',
                                    left: `calc(${i * 20}% + 60px)`, top: 104,
                                    background: i < currentStep ? '#10b981' : '#e2e8f0',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div style={{
                    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 20,
                    padding: '36px 40px', boxShadow: '0 2px 8px rgba(0,39,94,0.04)',
                    maxWidth: 720, margin: '0 auto',
                }}>
                    {/* Step 0: NDA */}
                    {currentStep === 0 && (
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                                📋 Non-Disclosure Agreement
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Please review and acknowledge the Non-Disclosure Agreement below. By signing, you agree to maintain the confidentiality of all proprietary information.
                            </p>
                            <div style={{
                                padding: '24px 28px', background: '#f8fafc', borderRadius: 12,
                                border: '1px solid #e8ecf4', marginBottom: 24, fontSize: 13, color: '#475569', lineHeight: 1.8,
                            }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT</h3>
                                <p>This Non-Disclosure Agreement ("Agreement") is entered into between Shellkode Technologies ("Company") and the undersigned employee.</p>
                                <p><strong>1. Confidential Information:</strong> All business, technical, and financial information disclosed by the Company.</p>
                                <p><strong>2. Obligations:</strong> Employee shall not disclose, publish, or use any Confidential Information without prior written consent.</p>
                                <p><strong>3. Term:</strong> This agreement remains in effect during and 2 years after employment.</p>
                                <p><strong>4. Return of Materials:</strong> Upon termination, employee shall return all confidential materials.</p>
                            </div>
                            <button onClick={() => handleAcknowledge('Non-Disclosure')} disabled={saving}
                                style={{
                                    padding: '12px 32px', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(0,39,94,0.2)',
                                }}>
                                {saving ? 'Signing...' : 'I Acknowledge & Sign'}
                            </button>
                        </div>
                    )}

                    {/* Step 1: Leave Policy */}
                    {currentStep === 1 && (
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                                📅 Leave Policy 2026
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Review the company leave policy and acknowledge that you understand the terms.
                            </p>
                            <div style={{
                                padding: '24px 28px', background: '#f8fafc', borderRadius: 12,
                                border: '1px solid #e8ecf4', marginBottom: 24, fontSize: 13, color: '#475569', lineHeight: 1.8,
                            }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' }}>SHELLKODE LEAVE POLICY</h3>
                                <p><strong>Casual Leave:</strong> 12 days per year</p>
                                <p><strong>Sick Leave:</strong> 6 days per year</p>
                                <p><strong>Earned Leave:</strong> 15 days per year (carry forward up to 10)</p>
                                <p><strong>Public Holidays:</strong> 10 days per year (as per govt calendar)</p>
                                <p><strong>Work From Home:</strong> 2 days per week (flexible)</p>
                                <p><strong>Notice Period:</strong> All leaves must be applied 3 days in advance (except emergencies).</p>
                            </div>
                            <button onClick={() => handleAcknowledge('Leave Policy')} disabled={saving}
                                style={{
                                    padding: '12px 32px', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(0,39,94,0.2)',
                                }}>
                                {saving ? 'Signing...' : 'I Acknowledge & Sign'}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Upload Documents */}
                    {currentStep === 2 && (
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                                📁 Upload Required Documents
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Upload the following documents for verification. Supported formats: PDF, JPG, PNG.
                            </p>
                            {['Aadhaar Card', 'PAN Card', 'Passport Photo'].map((doc, i) => (
                                <div key={doc} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                                    background: '#f8fafc', borderRadius: 12, border: '1px solid #e8ecf4',
                                    marginBottom: 12,
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, background: '#e0f2fe',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, flexShrink: 0,
                                    }}>
                                        {['🆔', '💳', '📷'][i]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{doc}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>PDF, JPG, or PNG (max 5MB)</div>
                                    </div>
                                    <label style={{
                                        padding: '8px 16px', background: '#f0f4ff', color: '#1d4ed8',
                                        border: '1px solid #dbeafe', borderRadius: 8, fontSize: 11, fontWeight: 600,
                                        cursor: 'pointer',
                                    }}>
                                        Choose File
                                        <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
                                    </label>
                                </div>
                            ))}
                            <button onClick={() => setCurrentStep(3)}
                                style={{
                                    marginTop: 12, padding: '12px 32px',
                                    background: 'linear-gradient(135deg, #00275E, #003580)',
                                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,39,94,0.2)',
                                }}>
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* Step 3: Personal Profile */}
                    {currentStep === 3 && (
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                                👤 Personal Profile Details
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Complete your personal profile for company records.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
                                    { key: 'father_name', label: "Father's Name", type: 'text' },
                                    { key: 'pan_number', label: 'PAN Number', type: 'text', placeholder: 'ABCDE1234F' },
                                    { key: 'aadhaar_number', label: 'Aadhaar Number', type: 'text', placeholder: '1234 5678 9012' },
                                    { key: 'tshirt_size', label: 'T-Shirt Size', type: 'text', placeholder: 'S / M / L / XL' },
                                    { key: 'dietary_preference', label: 'Dietary Preference', type: 'text', placeholder: 'Veg / Non-Veg / Vegan' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                                            {f.label}
                                        </label>
                                        <input
                                            type={f.type}
                                            value={profile[f.key] || ''}
                                            onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder || ''}
                                            style={{
                                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                                border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b',
                                                outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Address</label>
                                <textarea
                                    value={profile.address || ''}
                                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                                    rows={3}
                                    placeholder="Full residential address"
                                    style={{
                                        width: '100%', padding: '10px 14px', borderRadius: 10,
                                        border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b',
                                        resize: 'vertical', fontFamily: "'Inter', sans-serif",
                                        outline: 'none', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <button onClick={() => handleSaveProfile({
                                date_of_birth: profile.date_of_birth,
                                father_name: profile.father_name,
                                pan_number: profile.pan_number,
                                aadhaar_number: profile.aadhaar_number,
                                tshirt_size: profile.tshirt_size,
                                dietary_preference: profile.dietary_preference,
                                address: profile.address,
                            })} disabled={saving}
                                style={{
                                    marginTop: 20, padding: '12px 32px',
                                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(0,39,94,0.2)',
                                }}>
                                {saving ? 'Saving...' : 'Save & Continue →'}
                            </button>
                        </div>
                    )}

                    {/* Step 4: Bank & Emergency Contact */}
                    {currentStep === 4 && (
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
                                🏦 Bank & Emergency Contact
                            </h2>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
                                Add your bank details for payroll and an emergency contact.
                            </p>

                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#00275E', margin: '0 0 12px', letterSpacing: 0.5 }}>BANK DETAILS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                {[
                                    { key: 'bank_name', label: 'Bank Name', placeholder: 'HDFC Bank' },
                                    { key: 'bank_account_number', label: 'Account Number', placeholder: '50100123456789' },
                                    { key: 'bank_ifsc', label: 'IFSC Code', placeholder: 'HDFC0001234' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>{f.label}</label>
                                        <input
                                            type="text"
                                            value={profile[f.key] || ''}
                                            onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            style={{
                                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                                border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b',
                                                outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#00275E', margin: '0 0 12px', letterSpacing: 0.5 }}>EMERGENCY CONTACT</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                {[
                                    { key: 'emergency_contact_name', label: 'Contact Name', placeholder: 'Parent / Spouse name' },
                                    { key: 'emergency_contact_phone', label: 'Contact Phone', placeholder: '+91 98765 43210' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>{f.label}</label>
                                        <input
                                            type="text"
                                            value={profile[f.key] || ''}
                                            onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            style={{
                                                width: '100%', padding: '10px 14px', borderRadius: 10,
                                                border: '1px solid #e8ecf4', fontSize: 13, color: '#1e293b',
                                                outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                                            }}
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
                            }} disabled={saving}
                                style={{
                                    marginTop: 24, padding: '14px 36px',
                                    background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                                }}>
                                {saving ? 'Completing...' : '✓ Complete Onboarding'}
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
