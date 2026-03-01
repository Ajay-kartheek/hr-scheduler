'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEmployee, getDepartments } from '@/lib/api';
import { DOMAINS } from '@/lib/constants';

export default function NewEmployeePage() {
    const router = useRouter();
    const [departments, setDepartments] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        first_name: '', last_name: '', personal_email: '', phone: '',
        designation: '', department_id: '', domain: 'AI', experience_type: 'fresher',
        doj: '', linkedin_url: '', bio: '', previous_company: '', years_experience: '',
    });

    useEffect(() => { getDepartments().then(setDepartments).catch(() => { }); }, []);

    function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const data = { ...form };
            if (data.years_experience) data.years_experience = parseFloat(data.years_experience);
            else delete data.years_experience;
            if (!data.department_id) delete data.department_id;
            if (!data.doj) delete data.doj;
            const emp = await createEmployee(data);
            router.push(`/employees/${emp.id}`);
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    }

    const inputBase = {
        width: '100%', padding: '11px 14px', fontSize: 13, fontWeight: 500,
        border: '1px solid #e2e8f0', borderRadius: 10, color: '#1e293b',
        background: '#fff', outline: 'none', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    };

    const focusHandlers = {
        onFocus: e => e.target.style.borderColor = '#00ADEF',
        onBlur: e => e.target.style.borderColor = '#e2e8f0',
    };

    return (
        <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.35s ease' }}>
            {/* Back link */}
            <Link href="/pipeline" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#9ca3af', textDecoration: 'none', marginBottom: 16,
                transition: 'color 0.15s',
            }}
                onMouseEnter={e => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to Pipeline
            </Link>

            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', letterSpacing: -0.3 }}>Add New Hire</h1>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Create a new employee record and start the onboarding pipeline</p>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto' }}>
                {/* Main Form Card */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 28, boxSizing: 'border-box' }}>
                    {error && (
                        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: 13, marginBottom: 20 }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Basic Info */}
                        <div style={{ marginBottom: 28 }}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                                Personal Information
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>First Name *</label>
                                    <input name="first_name" value={form.first_name} onChange={handleChange} required
                                        style={inputBase} placeholder="John" {...focusHandlers} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Last Name</label>
                                    <input name="last_name" value={form.last_name} onChange={handleChange}
                                        style={inputBase} placeholder="Doe" {...focusHandlers} />
                                </div>
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Personal Email *</label>
                                <input name="personal_email" type="email" value={form.personal_email}
                                    onChange={handleChange} required style={inputBase}
                                    placeholder="john.doe@gmail.com" {...focusHandlers} />
                                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Offer and onboarding communications will be sent here</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone</label>
                                    <input name="phone" value={form.phone} onChange={handleChange}
                                        style={inputBase} placeholder="+91 98765 43210" {...focusHandlers} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Designation *</label>
                                    <input name="designation" value={form.designation} onChange={handleChange}
                                        required style={inputBase} placeholder="Software Engineer" {...focusHandlers} />
                                </div>
                            </div>
                        </div>

                        {/* Role */}
                        <div style={{ marginBottom: 28, paddingTop: 24, borderTop: '1px solid #f5f5f5' }}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                                Role & Department
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Domain *</label>
                                    <select name="domain" value={form.domain} onChange={handleChange}
                                        style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}>
                                        {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                    </select>
                                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Determines laptop specs and team</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Experience Type *</label>
                                    <select name="experience_type" value={form.experience_type} onChange={handleChange}
                                        style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}>
                                        <option value="fresher">Fresher</option>
                                        <option value="experienced">Experienced</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Department</label>
                                    <select name="department_id" value={form.department_id} onChange={handleChange}
                                        style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}>
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date of Joining</label>
                                    <input name="doj" type="date" value={form.doj} onChange={handleChange}
                                        style={inputBase} {...focusHandlers} />
                                </div>
                            </div>

                            {form.experience_type === 'experienced' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Previous Company</label>
                                        <input name="previous_company" value={form.previous_company}
                                            onChange={handleChange} style={inputBase} {...focusHandlers} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Years of Experience</label>
                                        <input name="years_experience" type="number" step="0.5"
                                            value={form.years_experience} onChange={handleChange} style={inputBase} {...focusHandlers} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional */}
                        <div style={{ marginBottom: 24, paddingTop: 24, borderTop: '1px solid #f5f5f5' }}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
                                Additional Details
                            </h3>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>LinkedIn URL</label>
                                <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange}
                                    style={inputBase} placeholder="https://linkedin.com/in/..." {...focusHandlers} />
                            </div>
                            <div style={{ marginTop: 16 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Notes</label>
                                <textarea name="bio" value={form.bio} onChange={handleChange} rows="3"
                                    style={{ ...inputBase, resize: 'vertical', minHeight: 80 }}
                                    placeholder="Any additional notes about this hire..." {...focusHandlers} />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 18, borderTop: '1px solid #f5f5f5' }}>
                            <button type="button" onClick={() => router.back()} style={{
                                padding: '10px 20px', fontSize: 13, fontWeight: 600,
                                background: '#f3f4f6', color: '#374151', border: 'none',
                                borderRadius: 10, cursor: 'pointer',
                            }}>Cancel</button>
                            <button type="submit" disabled={submitting} style={{
                                padding: '10px 24px', fontSize: 13, fontWeight: 600,
                                background: submitting ? '#9ca3af' : '#1e293b', color: '#fff',
                                border: 'none', borderRadius: 10, cursor: submitting ? 'not-allowed' : 'pointer',
                            }}>
                                {submitting ? 'Creating...' : 'Create & Start Pre-Boarding'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
