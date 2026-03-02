'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
    fetchAllReferenceData, fetchEmployee,
    createEmployee, startOnboarding, saveStep, completeOnboarding,
    uploadDocument,
} from '@/lib/api';

/* ──── Constants ──── */
const STEPS = [
    { num: 1, label: 'General Information' },
    { num: 2, label: 'Job and Assets' },
    { num: 3, label: 'Global Documents' },
    { num: 4, label: 'Onboarding Planning' },
];

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Australia', 'Canada', 'Singapore'];

/* ──── Rocket SVG (right panel) ──── */
function RocketSmall() {
    return (
        <svg width="70" height="70" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="108" rx="10" ry="6" fill="#f59e0b" opacity="0.7">
                <animate attributeName="ry" values="6;9;6" dur="0.4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="60" cy="106" rx="6" ry="4" fill="#fbbf24">
                <animate attributeName="ry" values="4;7;4" dur="0.3s" repeatCount="indefinite" />
            </ellipse>
            <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;0,-3;0,0" dur="2s" repeatCount="indefinite" />
                <path d="M43 82 L50 70 L50 90 Z" fill="#dc2626" />
                <path d="M77 82 L70 70 L70 90 Z" fill="#dc2626" />
                <path d="M50 90 L50 50 Q50 30 60 20 Q70 30 70 50 L70 90 Z" fill="#e2e8f0" />
                <circle cx="60" cy="52" r="7" fill="#00ADEF" />
                <circle cx="60" cy="52" r="5" fill="#0ea5e9" />
                <circle cx="58" cy="50" r="2" fill="#fff" opacity="0.6" />
                <path d="M55 35 Q60 22 65 35" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                <rect x="50" y="72" width="20" height="4" rx="1" fill="#00ADEF" opacity="0.5" />
                <path d="M53 90 L55 96 L65 96 L67 90" fill="#64748b" />
            </g>
            <circle cx="22" cy="30" r="1.5" fill="#fff" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="95" cy="22" r="1" fill="#fff" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" /></circle>
            <circle cx="105" cy="55" r="1.5" fill="#fff" opacity="0.6"><animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" /></circle>
        </svg>
    );
}

function CloudSVG({ style }) {
    return (
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none" style={{ ...style, opacity: 0.25 }}>
            <ellipse cx="30" cy="20" rx="25" ry="10" fill="#fff" />
            <ellipse cx="18" cy="15" rx="12" ry="9" fill="#fff" />
            <ellipse cx="42" cy="14" rx="14" ry="10" fill="#fff" />
            <ellipse cx="30" cy="10" rx="10" ry="8" fill="#fff" />
        </svg>
    );
}

/* ──── Form Components ──── */
function InputField({ label, required, placeholder = 'Insert', type = 'text', value, onChange }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
                {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <input
                type={type} placeholder={placeholder} value={value || ''}
                onChange={e => onChange?.(e.target.value)}
                style={{
                    width: '100%', padding: '11px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                    borderRadius: 8, outline: 'none', color: '#1e293b', background: '#fff',
                    transition: 'border-color 0.15s', fontFamily: "'Inter', sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = '#00ADEF'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
        </div>
    );
}

function SelectField({ label, options, placeholder = 'Select', value, onChange, valueKey = 'id', labelKey = 'name' }) {
    const isObjArray = options.length > 0 && typeof options[0] === 'object';
    return (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{label}</label>
            <select
                value={value || ''}
                onChange={e => onChange?.(e.target.value)}
                style={{
                    width: '100%', padding: '11px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                    borderRadius: 8, outline: 'none', color: value ? '#1e293b' : '#64748b', background: '#fff',
                    cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                }}
            >
                <option value="">{placeholder}</option>
                {isObjArray
                    ? options.map(o => <option key={o[valueKey]} value={o[valueKey]}>{o[labelKey]}</option>)
                    : options.map(o => <option key={o} value={o}>{o}</option>)
                }
            </select>
        </div>
    );
}


/* ═══════════════════════════════════════════ */
/*           STEP CONTENT COMPONENTS           */
/* ═══════════════════════════════════════════ */

function StepGeneralInfo({ form, setField, refs }) {
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <InputField label="First Name" required value={form.first_name} onChange={v => setField('first_name', v)} />
                <InputField label="Last Name" required value={form.last_name} onChange={v => setField('last_name', v)} />
                <InputField label="Email" required type="email" value={form.personal_email} onChange={v => setField('personal_email', v)} />
                <InputField label="Phone Number" type="tel" value={form.phone} onChange={v => setField('phone', v)} />
                <SelectField label="Country" options={COUNTRIES} value={form.country} onChange={v => setField('country', v)} />
                <SelectField label="Manager" options={refs.managers} value={form.manager_id} onChange={v => setField('manager_id', v)} />
                <SelectField label="Office" options={refs.offices} value={form.office_id} onChange={v => setField('office_id', v)} />
                <SelectField label="Team" options={refs.teams} value={form.team_id} onChange={v => setField('team_id', v)} />
            </div>
        </div>
    );
}

function StepJobAssets({ form, setField, refs, equipment, setEquipment }) {
    const [newItem, setNewItem] = useState('');

    const removeItem = (idx) => setEquipment(prev => prev.filter((_, i) => i !== idx));
    const addItem = () => {
        if (!newItem.trim()) return;
        setEquipment(prev => [...prev, newItem.trim()]);
        setNewItem('');
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Select the Role</label>
                <select
                    value={form.role_id || ''}
                    onChange={e => setField('role_id', e.target.value)}
                    style={{
                        width: 260, padding: '11px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                        borderRadius: 8, outline: 'none', color: form.role_id ? '#1e293b' : '#64748b', background: '#fff',
                        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                    }}
                >
                    <option value="">- Role -</option>
                    {refs.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>

            <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>Equipment Package</h3>

                {equipment.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {equipment.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                                border: '1px solid #e8ecf4', borderRadius: 10, background: '#fff',
                            }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                                <span style={{ flex: 1, fontSize: 13, color: '#1e293b' }}>{item}</span>
                                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: '#dcfce7', color: '#15803d' }}>Included</span>
                                <button onClick={() => removeItem(i)} style={{
                                    width: 24, height: 24, borderRadius: 6, border: '1px solid #fecaca',
                                    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: '#f8fafc', border: '1px solid #e8ecf4', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Select a role above to auto-populate equipment, or add items manually.</span>
                    </div>
                )}

                {/* Add equipment inline */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input
                        type="text" placeholder="Add custom equipment..." value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                        style={{
                            flex: 1, padding: '9px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                            borderRadius: 8, outline: 'none', color: '#1e293b', background: '#fff',
                            fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = '#00ADEF'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button onClick={addItem} style={{
                        padding: '9px 20px', border: 'none', borderRadius: 8,
                        background: 'linear-gradient(135deg, #00275E, #003580)', color: '#fff',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>+ Add</button>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>E-Learning</h3>
                <div style={{ background: '#f8fafc', border: '1px solid #e8ecf4', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" /></svg>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Courses will be auto-assigned based on role after onboarding.</span>
                </div>
            </div>
        </div>
    );
}

function StepGlobalDocs({ hireId, docs, setDocs }) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const doc = await uploadDocument(file, hireId, 'global', false);
            setDocs(prev => [...prev, doc]);
        } catch (err) { console.error('Upload failed:', err); }
        setUploading(false);
        e.target.value = '';
    };

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 4px 0' }}>Upload Documents</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px 0' }}>Documents uploaded here will be stored in the employee portal for future reference.</p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <label style={{
                    flex: 1, border: '2px dashed #e2e8f0', borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#00ADEF'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{uploading ? 'Uploading...' : 'Select file'}</span>
                    <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                </label>
                <button type="button" style={{
                    padding: '12px 28px', border: '1.5px solid #00ADEF', borderRadius: 8,
                    background: '#fff', color: '#00ADEF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                }}
                    onMouseEnter={e => { e.target.style.background = '#00ADEF'; e.target.style.color = '#fff'; }}
                    onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#00ADEF'; }}
                >Upload</button>
            </div>

            {docs.length > 0 ? docs.map((f) => (
                <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    border: '1px solid #e8ecf4', borderRadius: 10, background: '#fff', marginBottom: 8,
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ADEF" stroke="none"><rect x="3" y="2" width="18" height="20" rx="3" /><path d="M8 12h8M8 16h5" stroke="#fff" strokeWidth="1.5" /></svg>
                    <span style={{ flex: 1, fontSize: 13, color: '#1e293b' }}>{f.name}</span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                        background: '#dcfce7', color: '#15803d',
                    }}>Uploaded</span>
                </div>
            )) : (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    border: '1px solid #e8ecf4', borderRadius: 10, background: '#fff',
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#00ADEF" stroke="none"><rect x="3" y="2" width="18" height="20" rx="3" /><path d="M8 12h8M8 16h5" stroke="#fff" strokeWidth="1.5" /></svg>
                    <span style={{ flex: 1, fontSize: 13, color: '#1e293b' }}>NonDisclosureAgreement.pdf</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6, background: '#dcfce7', color: '#15803d' }}>Default</span>
                </div>
            )}
        </div>
    );
}

function StepOnboardingPlanning({ form, setField }) {
    const WEEK_SCHEDULE = [
        { day: 'Day 1', title: 'Welcome and Setup', tasks: ['09:30 AM -- Badge Collection and Welcome Kit', '10:00 AM -- HR Induction Session', '11:30 AM -- Manager Introduction', '02:00 PM -- IT Setup and Access', '04:00 PM -- Team Introduction'] },
        { day: 'Day 2', title: 'Product and Tools', tasks: ['10:00 AM -- Product Deep Dive', '02:00 PM -- Development Workflow Training'] },
        { day: 'Day 3', title: 'Codebase and Workflow', tasks: ['10:00 AM -- Codebase Walkthrough', '02:00 PM -- Starter Task Assignment'] },
        { day: 'Day 4', title: 'Compliance and Team', tasks: ['10:00 AM -- Compliance Training', '02:00 PM -- Team Collaboration Session'] },
        { day: 'Day 5', title: 'Review and Planning', tasks: ['03:00 PM -- End of Week 1 Review with Manager'] },
    ];

    return (
        <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>First Week Schedule</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px 0' }}>AI-generated onboarding plan. Calendar invites will be sent to the employee on completion.</p>

            {WEEK_SCHEDULE.map((day, di) => (
                <div key={di} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                            background: 'linear-gradient(135deg, #00275E, #003580)', color: '#fff',
                        }}>{day.day}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#00275E' }}>{day.title}</span>
                    </div>
                    {day.tasks.map((task, ti) => (
                        <div key={ti} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                            border: '1px solid #e8ecf4', borderRadius: 8, marginBottom: 4, background: '#fff',
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                            <span style={{ fontSize: 13, color: '#1e293b' }}>{task}</span>
                        </div>
                    ))}
                </div>
            ))}

            <div style={{ marginBottom: 16, marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Custom Notes (optional)</label>
                <textarea
                    placeholder="Additional instructions for the AI-generated onboarding plan"
                    value={form.custom_notes || ''}
                    onChange={e => setField('custom_notes', e.target.value)}
                    style={{
                        width: '100%', padding: '11px 14px', fontSize: 13, border: '1.5px solid #e2e8f0',
                        borderRadius: 8, outline: 'none', color: '#1e293b', background: '#fff',
                        fontFamily: "'Inter', sans-serif", resize: 'vertical', minHeight: 72, transition: 'border-color 0.15s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#00ADEF'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #f0f7ff, #e8f4fd)', border: '1px solid #bae6fd',
                borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#00275E' }}>Calendar Invites</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>All events will be sent as calendar invites to the employee's personal email</div>
                </div>
            </div>
        </div>
    );
}


/* ═════════════════════════════════════════ */
/*          MAIN PAGE COMPONENT              */
/* ═════════════════════════════════════════ */

export default function NewOnboardingPage() {
    const searchParams = useSearchParams();
    const existingHireId = searchParams.get('hire');

    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [hireId, setHireId] = useState(existingHireId || null);
    const [docs, setDocs] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [loadingHire, setLoadingHire] = useState(!!existingHireId);
    const router = useRouter();

    const [refs, setRefs] = useState({ departments: [], roles: [], offices: [], teams: [], managers: [] });
    const [form, setForm] = useState({
        first_name: '', last_name: '', personal_email: '', phone: '',
        country: 'India', manager_id: '', office_id: '', team_id: '',
        department_id: '', role_id: '', custom_notes: '',
    });

    const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    // Load reference data
    useEffect(() => {
        fetchAllReferenceData().then(setRefs).catch(console.error);
    }, []);

    // If coming from employee detail page with existing hire, pre-fill form
    useEffect(() => {
        if (!existingHireId) return;
        setHireId(existingHireId);

        fetchEmployee(existingHireId).then(emp => {
            setForm({
                first_name: emp.first_name || '',
                last_name: emp.last_name || '',
                personal_email: emp.personal_email || '',
                phone: emp.phone || '',
                country: emp.country || 'India',
                manager_id: emp.manager_id || '',
                office_id: emp.office_id || '',
                team_id: emp.team_id || '',
                department_id: emp.department_id || '',
                role_id: emp.role_id || '',
                custom_notes: '',
            });
        }).catch(console.error).finally(() => setLoadingHire(false));
    }, [existingHireId]);

    const selectedRole = refs.roles.find(r => r.id === form.role_id);

    // Auto-populate equipment and department when role changes
    useEffect(() => {
        if (selectedRole) {
            setEquipment(selectedRole.default_equipment || []);
            if (selectedRole.department_id) {
                setField('department_id', selectedRole.department_id);
            }
        }
    }, [form.role_id, refs.roles]);

    const goNext = async () => {
        if (saving) return;
        setSaving(true);

        try {
            if (currentStep === 1) {
                if (!hireId) {
                    // Brand new hire -- create employee + start onboarding
                    const emp = await createEmployee({
                        first_name: form.first_name,
                        last_name: form.last_name,
                        personal_email: form.personal_email,
                        phone: form.phone,
                        department_id: form.department_id || undefined,
                    });
                    setHireId(emp.id);
                    await startOnboarding(emp.id);
                    await saveStep(emp.id, 1, {
                        first_name: form.first_name,
                        last_name: form.last_name,
                        personal_email: form.personal_email,
                        phone: form.phone,
                        country: form.country,
                        manager_id: form.manager_id || null,
                        office_id: form.office_id || null,
                        team_id: form.team_id || null,
                    });
                } else {
                    // Existing hire -- just save step 1
                    await saveStep(hireId, 1, {
                        first_name: form.first_name,
                        last_name: form.last_name,
                        personal_email: form.personal_email,
                        phone: form.phone,
                        country: form.country,
                        manager_id: form.manager_id || null,
                        office_id: form.office_id || null,
                        team_id: form.team_id || null,
                    });
                }
            }

            if (currentStep === 2 && hireId) {
                await saveStep(hireId, 2, {
                    role_id: form.role_id || null,
                });
            }

            if (currentStep === 3 && hireId) {
                await saveStep(hireId, 3, {
                    document_ids: docs.map(d => d.id),
                });
            }

            if (currentStep === 4 && hireId) {
                await saveStep(hireId, 4, {
                    custom_notes: form.custom_notes || null,
                });
                await completeOnboarding(hireId);
                router.push('/dashboard');
                return;
            }

            if (currentStep < 4) setCurrentStep(currentStep + 1);
        } catch (e) {
            console.error('Save failed:', e);
        }
        setSaving(false);
    };

    const goPrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    if (loadingHire) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff' }}>
                <Sidebar />
                <div style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#00ADEF', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
            </div>
        );
    }

    const stepContent = [
        null,
        <StepGeneralInfo key={1} form={form} setField={setField} refs={refs} />,
        <StepJobAssets key={2} form={form} setField={setField} refs={refs} equipment={equipment} setEquipment={setEquipment} />,
        <StepGlobalDocs key={3} hireId={hireId} docs={docs} setDocs={setDocs} />,
        <StepOnboardingPlanning key={4} form={form} setField={setField} />,
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff' }}>
            <Sidebar />

            <main style={{ flex: 1, marginLeft: 88, marginRight: 240, padding: '20px 36px 36px', minHeight: '100vh' }}>

                <div style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#00ADEF', cursor: 'pointer', fontWeight: 500 }}
                        onClick={() => router.push('/dashboard')}>Dashboard</span>
                    <span style={{ fontSize: 12, color: '#94a3b8', margin: '0 6px' }}>&rsaquo;</span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>New Onboarding</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        {existingHireId ? `${form.first_name} ${form.last_name}`.trim() || 'Employee' : 'New Employee'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #00ADEF, #0077b6)', color: '#fff', fontSize: 14, fontWeight: 700,
                        }}>{currentStep}</div>
                        <div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Step {String(currentStep).padStart(2, '0')}</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{STEPS[currentStep - 1].label}</div>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: '#fff', borderRadius: 16, padding: '28px 32px',
                    border: '1px solid #e8ecf4', boxShadow: '0 1px 3px rgba(0,39,94,0.04)', minHeight: 360,
                }}>
                    {stepContent[currentStep]}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                    {currentStep > 1 ? (
                        <button onClick={goPrev} style={{
                            background: 'none', border: 'none', color: '#00ADEF', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Previous Step
                        </button>
                    ) : <div />}

                    <button onClick={goNext} disabled={saving} style={{
                        padding: '12px 40px', background: saving ? '#94a3b8' : 'linear-gradient(135deg, #00275E, #003580)',
                        color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 16px rgba(0,39,94,0.25)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}
                        onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,39,94,0.35)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,39,94,0.25)'; }}
                    >
                        {saving ? 'Saving...' : currentStep < 4 ? 'Next Step' : 'Complete Onboarding'}
                        {!saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                    </button>
                </div>
            </main>

            {/* Right Panel */}
            <aside style={{
                width: 240, position: 'fixed', top: 0, right: 0, height: '100vh',
                background: 'linear-gradient(180deg, #001d3d 0%, #003566 40%, #00527a 70%, #0077b6 100%)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
                <div style={{ position: 'relative', padding: '24px 20px 16px', textAlign: 'right' }}>
                    <CloudSVG style={{ position: 'absolute', top: 60, left: -10 }} />
                    <CloudSVG style={{ position: 'absolute', top: 100, right: 5, transform: 'scale(0.7)' }} />
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <RocketSmall />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'right', marginTop: -4 }}>
                        <div style={{ fontSize: 22, fontWeight: 300, color: '#fff', lineHeight: 1.2 }}>
                            Start<br />
                            <span style={{ fontWeight: 800 }}>a new<br />journey</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>at Shellkode Pvt Ltd</div>
                    </div>
                </div>

                <div style={{ padding: '24px 24px 24px 32px', flex: 1 }}>
                    {STEPS.map((step, i) => {
                        const isActive = currentStep === step.num;
                        const isDone = currentStep > step.num;
                        return (
                            <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                                {i < 3 && (
                                    <div style={{
                                        position: 'absolute', left: 14, top: 30, width: 2, height: 44,
                                        background: isDone ? 'rgba(0, 173, 239, 0.6)' : 'rgba(255,255,255,0.15)',
                                    }} />
                                )}
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                                    background: isActive || isDone ? '#00ADEF' : 'rgba(255,255,255,0.1)',
                                    color: isActive || isDone ? '#fff' : 'rgba(255,255,255,0.4)',
                                    border: isActive ? '2px solid #fff' : isDone ? 'none' : '2px solid rgba(255,255,255,0.2)',
                                    boxShadow: isActive ? '0 0 12px rgba(0,173,239,0.5)' : 'none',
                                }}>
                                    {isDone ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    ) : step.num}
                                </div>
                                <div style={{
                                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                                    color: isActive || isDone ? '#fff' : 'rgba(255,255,255,0.4)',
                                    paddingTop: 5, lineHeight: 1.3, marginBottom: 44,
                                }}>{step.label}</div>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
