'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFormDetails, submitForm } from '@/lib/api';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DIETARY = ['No Preference', 'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Halal', 'Kosher'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function InputField({ label, required, placeholder = '', type = 'text', value, onChange }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
                {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <input
                type={type} placeholder={placeholder} value={value || ''}
                onChange={e => onChange?.(e.target.value)}
                style={{
                    width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid #e2e8f0',
                    borderRadius: 10, outline: 'none', color: '#1e293b', background: '#fff',
                    transition: 'border-color 0.15s', fontFamily: "'Inter', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#00ADEF'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
        </div>
    );
}

function SelectField({ label, options, value, onChange, placeholder = 'Select' }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{label}</label>
            <select
                value={value || ''} onChange={e => onChange?.(e.target.value)}
                style={{
                    width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid #e2e8f0',
                    borderRadius: 10, outline: 'none', color: value ? '#1e293b' : '#94a3b8', background: '#fff',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif", appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                }}
            >
                <option value="">{placeholder}</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

export default function WelcomeFormPage() {
    const params = useParams();
    const token = params.token;
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        phone: '', blood_group: '', emergency_contact_name: '', emergency_contact_phone: '',
        address: '', tshirt_size: '', dietary_preference: '', linkedin_url: '', bio: '',
    });
    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        if (!token) return;
        getFormDetails(token)
            .then(d => {
                setDetails(d);
                if (d.form_submitted) setSubmitted(true);
            })
            .catch(() => setError('This link is invalid or has expired.'))
            .finally(() => setLoading(false));
    }, [token]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await submitForm(token, form);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Submission failed. Please try again.');
        }
        setSubmitting(false);
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00ADEF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            </div>
        );
    }

    if (error && !details) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ background: '#fff', padding: 40, borderRadius: 16, textAlign: 'center', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,39,94,0.08)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" style={{ marginBottom: 16 }}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Link Not Found</h2>
                    <p style={{ fontSize: 14, color: '#64748b' }}>{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe, #f0f4ff)', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ background: '#fff', padding: '48px 40px', borderRadius: 20, textAlign: 'center', maxWidth: 460, boxShadow: '0 8px 32px rgba(0,39,94,0.08)' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Form Submitted</h2>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                        Thank you, {details?.first_name}. Your onboarding form has been received.
                        Our HR team will review your details and reach out with next steps.
                    </p>
                    <div style={{
                        background: '#f8fafc', border: '1px solid #e8ecf4', borderRadius: 12,
                        padding: '16px 20px', textAlign: 'left',
                    }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>YOUR DETAILS</div>
                        <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{details?.first_name} {details?.last_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{details?.designation}{details?.department ? ` -- ${details.department}` : ''}</div>
                        {details?.doj && <div style={{ fontSize: 12, color: '#00ADEF', fontWeight: 600, marginTop: 4 }}>Joining: {details.doj}</div>}
                    </div>
                    <div style={{ marginTop: 24 }}>
                        <img src="/sk-logo.svg" alt="Shellkode" style={{ height: 24, opacity: 0.5 }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe, #f0f4ff)', fontFamily: "'Inter', sans-serif", padding: '40px 20px' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>

                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #00275E, #003580)', borderRadius: '16px 16px 0 0',
                    padding: '32px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,173,239,0.06)', top: -60, right: -40 }} />
                    <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,173,239,0.04)', bottom: -50, left: -20 }} />
                    <img src="/sk-logo.svg" alt="Shellkode" style={{ height: 30, marginBottom: 16, position: 'relative', zIndex: 1 }} />
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px 0', position: 'relative', zIndex: 1 }}>Welcome to Shellkode Pvt Ltd</h1>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, position: 'relative', zIndex: 1 }}>Please complete your onboarding form below</p>
                </div>

                {/* Details Banner */}
                <div style={{
                    background: '#fff', padding: '20px 36px', borderBottom: '1px solid #e8ecf4',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{details?.first_name} {details?.last_name}</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{details?.designation}{details?.department ? ` -- ${details.department}` : ''}</div>
                    </div>
                    {details?.doj && (
                        <div style={{
                            background: 'linear-gradient(135deg, #f0f7ff, #e8f4fd)', border: '1px solid #bae6fd',
                            borderRadius: 10, padding: '8px 16px', textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>DATE OF JOINING</div>
                            <div style={{ fontSize: 14, color: '#00275E', fontWeight: 700 }}>{details.doj}</div>
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{
                    background: '#fff', padding: '32px 36px',
                    border: '1px solid #e8ecf4', borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    boxShadow: '0 4px 20px rgba(0,39,94,0.06)',
                }}>
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                            padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#dc2626', fontWeight: 500,
                        }}>{error}</div>
                    )}

                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00275E', margin: '0 0 16px 0', letterSpacing: 0.5 }}>PERSONAL DETAILS</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                        <InputField label="Phone Number" required placeholder="+91 9876543210" value={form.phone} onChange={v => setField('phone', v)} type="tel" />
                        <SelectField label="Blood Group" options={BLOOD_GROUPS} value={form.blood_group} onChange={v => setField('blood_group', v)} />
                        <SelectField label="T-Shirt Size" options={TSHIRT_SIZES} value={form.tshirt_size} onChange={v => setField('tshirt_size', v)} />
                        <SelectField label="Dietary Preference" options={DIETARY} value={form.dietary_preference} onChange={v => setField('dietary_preference', v)} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Address</label>
                        <textarea
                            placeholder="Your current residential address"
                            value={form.address || ''} onChange={e => setField('address', e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid #e2e8f0',
                                borderRadius: 10, outline: 'none', color: '#1e293b', background: '#fff',
                                fontFamily: "'Inter', sans-serif", resize: 'vertical', minHeight: 72,
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#00ADEF'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ height: 1, background: '#e8ecf4', margin: '24px 0' }} />

                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00275E', margin: '0 0 16px 0', letterSpacing: 0.5 }}>EMERGENCY CONTACT</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                        <InputField label="Contact Name" required placeholder="Full name" value={form.emergency_contact_name} onChange={v => setField('emergency_contact_name', v)} />
                        <InputField label="Contact Phone" required placeholder="+91 9876543210" value={form.emergency_contact_phone} onChange={v => setField('emergency_contact_phone', v)} type="tel" />
                    </div>

                    <div style={{ height: 1, background: '#e8ecf4', margin: '24px 0' }} />

                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#00275E', margin: '0 0 16px 0', letterSpacing: 0.5 }}>PROFESSIONAL INFO</h3>

                    <InputField label="LinkedIn Profile" placeholder="https://linkedin.com/in/your-profile" value={form.linkedin_url} onChange={v => setField('linkedin_url', v)} type="url" />

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Short Bio</label>
                        <textarea
                            placeholder="Tell us a bit about yourself"
                            value={form.bio || ''} onChange={e => setField('bio', e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid #e2e8f0',
                                borderRadius: 10, outline: 'none', color: '#1e293b', background: '#fff',
                                fontFamily: "'Inter', sans-serif", resize: 'vertical', minHeight: 72,
                                transition: 'border-color 0.15s',
                            }}
                            onFocus={e => e.target.style.borderColor = '#00ADEF'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={submitting} style={{
                        width: '100%', padding: '14px', marginTop: 8,
                        background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                        color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                        cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 16px rgba(0,39,94,0.25)',
                    }}
                        onMouseEnter={e => { if (!submitting) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 24px rgba(0,39,94,0.35)'; } }}
                        onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 16px rgba(0,39,94,0.25)'; }}
                    >{submitting ? 'Submitting...' : 'Submit Onboarding Form'}</button>

                    <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
                        This information is confidential and used only for your onboarding at Shellkode Pvt Ltd.
                    </p>
                </form>
            </div>
        </div>
    );
}
