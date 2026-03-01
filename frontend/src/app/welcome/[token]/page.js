'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function WelcomeFormPage() {
    const { token } = useParams();
    const router = useRouter();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        first_name: '', last_name: '', phone: '',
        blood_group: '', emergency_contact_name: '', emergency_contact_phone: '',
        address: '', tshirt_size: '', dietary_preference: '',
        linkedin_url: '', bio: '',
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${API_BASE}/api/portal/form/${token}`);
                if (!res.ok) throw new Error('Invalid or expired link');
                const data = await res.json();
                if (data.form_submitted) {
                    setSubmitted(true);
                }
                setDetails(data);
                setForm(prev => ({
                    ...prev,
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                }));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [token]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.first_name || !form.last_name || !form.phone) {
            setError('First name, last name, and phone are required.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/employees/form/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Submission failed');
            }
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.loadingSpinner}></div>
                </div>
            </div>
        );
    }

    if (error && !details) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.errorBox}>
                        <h2 style={{ fontSize: '20px', color: '#dc2626', marginBottom: '8px' }}>Link Invalid</h2>
                        <p style={{ color: '#6b7280' }}>This welcome form link is invalid or has expired. Please contact HR for a new link.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={styles.page}>
                <div style={styles.container}>
                    <div style={styles.successCard}>
                        <div style={styles.successIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                            Thank You, {form.first_name || details?.first_name}!
                        </h2>
                        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
                            Your details have been submitted successfully. Our HR team will get back to you before your joining date
                            with all the information you need.
                        </p>
                        <div style={styles.nextSteps}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>What happens next:</h3>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNum}>1</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Company email will be created</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>You'll receive your @shellkode.com email ID</div>
                                </div>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNum}>2</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Laptop will be prepared</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Based on your domain, the right spec laptop will be ordered</div>
                                </div>
                            </div>
                            <div style={styles.stepItem}>
                                <div style={styles.stepNum}>3</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827' }}>Joining details email</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>2 days before DOJ, you'll receive where to come and whom to meet</div>
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '20px' }}>
                            Questions? Reach out to <a href="mailto:hr@shellkode.com" style={{ color: '#4f46e5' }}>hr@shellkode.com</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerGradient}>
                        <div style={styles.logo}>S</div>
                        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                            Welcome to Shellkode!
                        </h1>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)' }}>
                            We're excited to have you join us as <strong>{details?.designation}</strong> in the <strong>{details?.domain}</strong> team
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div style={styles.formCard}>
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>Your Details</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                            Please fill in your details below. This helps us prepare everything for your arrival.
                        </p>
                    </div>

                    {error && (
                        <div style={styles.errorBar}>{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.section}>
                            <div style={styles.sectionLabel}>Personal Information</div>
                            <div style={styles.row}>
                                <div style={styles.field}>
                                    <label style={styles.label}>First Name <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input name="first_name" value={form.first_name} onChange={handleChange}
                                        style={styles.input} placeholder="Enter first name" required />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Last Name <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input name="last_name" value={form.last_name} onChange={handleChange}
                                        style={styles.input} placeholder="Enter last name" required />
                                </div>
                            </div>
                            <div style={styles.row}>
                                <div style={styles.field}>
                                    <label style={styles.label}>Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
                                    <input name="phone" value={form.phone} onChange={handleChange}
                                        style={styles.input} placeholder="+91 9876543210" required />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Blood Group</label>
                                    <select name="blood_group" value={form.blood_group} onChange={handleChange} style={styles.select}>
                                        <option value="">Select</option>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <div style={styles.sectionLabel}>Emergency Contact</div>
                            <div style={styles.row}>
                                <div style={styles.field}>
                                    <label style={styles.label}>Contact Name</label>
                                    <input name="emergency_contact_name" value={form.emergency_contact_name}
                                        onChange={handleChange} style={styles.input} placeholder="Parent / Spouse / Guardian" />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Contact Phone</label>
                                    <input name="emergency_contact_phone" value={form.emergency_contact_phone}
                                        onChange={handleChange} style={styles.input} placeholder="+91 9876543210" />
                                </div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <div style={styles.sectionLabel}>Address & Preferences</div>
                            <div style={styles.field}>
                                <label style={styles.label}>Current Address</label>
                                <textarea name="address" value={form.address} onChange={handleChange}
                                    style={{ ...styles.input, minHeight: '72px', resize: 'vertical' }}
                                    placeholder="Full current address" />
                            </div>
                            <div style={styles.row}>
                                <div style={styles.field}>
                                    <label style={styles.label}>T-Shirt Size</label>
                                    <select name="tshirt_size" value={form.tshirt_size} onChange={handleChange} style={styles.select}>
                                        <option value="">Select</option>
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Dietary Preference</label>
                                    <select name="dietary_preference" value={form.dietary_preference} onChange={handleChange} style={styles.select}>
                                        <option value="">Select</option>
                                        <option value="veg">Vegetarian</option>
                                        <option value="non_veg">Non-Vegetarian</option>
                                        <option value="vegan">Vegan</option>
                                        <option value="jain">Jain</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <div style={styles.sectionLabel}>Professional (Optional)</div>
                            <div style={styles.field}>
                                <label style={styles.label}>LinkedIn Profile URL</label>
                                <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                                    style={styles.input} placeholder="https://linkedin.com/in/yourprofile" />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Short Bio</label>
                                <textarea name="bio" value={form.bio} onChange={handleChange}
                                    style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Tell us a bit about yourself — your interests, what excites you about joining..." />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" disabled={submitting} style={styles.submitBtn}>
                                {submitting ? 'Submitting...' : 'Submit My Details'}
                            </button>
                        </div>
                    </form>
                </div>

                <div style={styles.footer}>
                    <p>Shellkode Technologies</p>
                    <p style={{ fontSize: '11px', marginTop: '4px' }}>Your data is stored securely and used only for onboarding purposes.</p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 50%, #f5f6fa 100%)',
        padding: '40px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    container: {
        maxWidth: '680px',
        margin: '0 auto',
    },
    loadingSpinner: {
        width: '40px', height: '40px', border: '3px solid #e5e7eb',
        borderTopColor: '#4f46e5', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '100px auto',
    },
    errorBox: {
        textAlign: 'center', padding: '60px 40px',
        background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    header: { marginBottom: '24px' },
    headerGradient: {
        background: 'linear-gradient(135deg, #4338ca, #6366f1, #818cf8)',
        borderRadius: '16px', padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 10px 25px rgba(79,70,229,0.2)',
    },
    logo: {
        width: '56px', height: '56px', background: 'rgba(255,255,255,0.2)',
        borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', fontWeight: 800, color: 'white', margin: '0 auto 16px',
        backdropFilter: 'blur(10px)',
    },
    formCard: {
        background: 'white', borderRadius: '16px', padding: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
    },
    errorBar: {
        padding: '10px 14px', background: '#fef2f2', border: '1px solid #fee2e2',
        borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '20px',
    },
    section: {
        marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f0f1f5',
    },
    sectionLabel: {
        fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
        color: '#9ca3af', marginBottom: '14px',
    },
    row: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
    },
    field: { marginBottom: '14px' },
    label: {
        display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px',
    },
    input: {
        width: '100%', padding: '10px 14px', background: '#f5f6fa',
        border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827',
        fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none',
        transition: 'border-color 200ms, box-shadow 200ms',
    },
    select: {
        width: '100%', padding: '10px 14px', background: '#f5f6fa',
        border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827',
        fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none',
        appearance: 'none',
    },
    submitBtn: {
        padding: '12px 32px', background: '#4f46e5', color: 'white', border: 'none',
        borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        fontFamily: "'Inter', sans-serif", transition: 'background 200ms',
    },
    successCard: {
        background: 'white', borderRadius: '16px', padding: '48px 40px', textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb',
    },
    successIcon: { marginBottom: '20px' },
    nextSteps: {
        textAlign: 'left', background: '#f8fafc', borderRadius: '12px',
        padding: '20px 24px', border: '1px solid #e2e8f0',
    },
    stepItem: {
        display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px',
    },
    stepNum: {
        width: '28px', height: '28px', borderRadius: '50%', background: '#eef2ff',
        color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
    },
    footer: {
        textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9ca3af',
    },
};
