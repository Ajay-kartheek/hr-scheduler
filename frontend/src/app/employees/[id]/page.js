'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getEmployee, getEmployeeWorkflows, acceptOffer,
    performStepAction, initiateOnboarding,
    getEmployeeEmails, sendOffer
} from '@/lib/api';
import { STAGES, STEP_STATUSES } from '@/lib/constants';

export default function EmployeeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [emp, setEmp] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('workflow');

    useEffect(() => { loadAll(); }, [id]);

    async function loadAll() {
        try {
            const [empData, wfData, emailData] = await Promise.all([
                getEmployee(id), getEmployeeWorkflows(id),
                getEmployeeEmails(id).catch(() => []),
            ]);
            setEmp(empData);
            setWorkflows(wfData);
            setEmails(emailData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    async function handleSendOffer() {
        try { await sendOffer(id); loadAll(); } catch (err) { alert(err.message); }
    }

    async function handleAcceptOffer() {
        try { await acceptOffer(id); loadAll(); } catch (err) { alert(err.message); }
    }

    async function handleStepAction(stepId, action) {
        try { await performStepAction(stepId, { action }); loadAll(); } catch (err) { alert(err.message); }
    }

    async function handleInitiateOnboarding() {
        try { await initiateOnboarding(id); loadAll(); } catch (err) { alert(err.message); }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ width: 32, height: 32, border: '2.5px solid #f3f4f6', borderTopColor: '#1e293b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
    );

    if (!emp) return (
        <div style={{ padding: '64px 36px', textAlign: 'center', color: '#9ca3af' }}>
            <p>Employee not found</p>
            <Link href="/pipeline" style={{ color: '#00ADEF', fontSize: 13 }}>Back to Pipeline</Link>
        </div>
    );

    const stage = STAGES.find(s => s.value === emp.current_stage);
    const initial = (emp.first_name?.[0] || '?').toUpperCase();

    const infoRows = [
        ['Role ID', emp.role_id],
        ['Email', emp.personal_email],
        ['Company Email', emp.company_email],
        ['Phone', emp.phone],
        ['Domain', emp.domain],
        ['Department', emp.department_name],
        ['Date of Joining', emp.doj ? new Date(emp.doj).toLocaleDateString() : null],
        ['Form Status', emp.form_submitted ? 'Submitted' : 'Pending'],
        ['Laptop', emp.laptop_status?.replace('_', ' ')],
        ['Email Created', emp.email_created ? 'Yes' : 'No'],
        ['Buddy', emp.buddy_name || null],
    ].filter(([, v]) => v);

    const tabs = [
        { key: 'workflow', label: 'Workflow' },
        { key: 'emails', label: `Emails (${emails.length})` },
    ];

    return (
        <div style={{ padding: '20px 32px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.35s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Back link */}
            <Link href="/pipeline" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#9ca3af', textDecoration: 'none', marginBottom: 20,
                transition: 'color 0.15s',
            }}
                onMouseEnter={e => e.currentTarget.style.color = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back to Pipeline
            </Link>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: stage?.color || '#1e293b', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 700,
                    }}>
                        {initial}
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', letterSpacing: -0.3 }}>
                            {emp.full_name || emp.personal_email}
                        </h1>
                        <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                            {emp.designation || 'New Hire'} &middot; {emp.domain || 'Engineering'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                        background: `${stage?.color || '#6b7280'}12`, color: stage?.color || '#6b7280',
                    }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage?.color || '#6b7280' }} />
                        {stage?.label || emp.current_stage?.replace(/_/g, ' ')}
                    </span>
                    {emp.current_stage === 'offer_sent' && (
                        <button onClick={handleAcceptOffer} style={{
                            padding: '8px 16px', background: '#1e293b', color: '#fff',
                            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Accept Offer</button>
                    )}
                    {emp.current_stage === 'ready_to_join' && (
                        <button onClick={handleInitiateOnboarding} style={{
                            padding: '8px 16px', background: '#1e293b', color: '#fff',
                            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Start Day 1</button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: 20, flex: 1, overflow: 'hidden', minHeight: 0 }}>
                {/* Left: Info Card */}
                <div style={{ overflow: 'auto', maxHeight: '100%' }}>
                    {/* Invisible spacer to align left box with right boxes */}
                    <div style={{
                        display: 'flex', marginBottom: 16,
                        borderBottom: '1px solid transparent', pointerEvents: 'none',
                    }}>
                        <div style={{
                            padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none',
                            borderBottom: '2px solid transparent', marginBottom: -1, opacity: 0
                        }}>&nbsp;</div>
                    </div>
                    <div style={{
                        background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                        padding: 20,
                    }}>
                        <h3 style={{ fontSize: 12, fontWeight: 'bold', color: 'black', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                            Details
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {infoRows.map(([label, value]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                    <span style={{ color: '#9ca3af' }}>{label}</span>
                                    <span style={{ fontWeight: 500, color: '#1e293b', maxWidth: 160, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {emp.form_token && !emp.form_submitted && (
                            <div style={{
                                marginTop: 16, padding: '10px 12px', background: '#f9fafb',
                                borderRadius: 8, fontSize: 11, color: '#6b7280',
                            }}>
                                Form: <code style={{ fontSize: 10, color: '#1e293b' }}>/welcome/{emp.form_token}</code>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Tabs */}
                <div style={{ overflow: 'auto', maxHeight: '100%', paddingRight: 4 }}>
                    {/* Tab Header */}
                    <div style={{
                        display: 'flex', gap: 0, marginBottom: 16,
                        borderBottom: '1px solid #f0f0f0',
                    }}>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                padding: '10px 20px', fontSize: 13, fontWeight: 600, border: 'none',
                                background: 'transparent', cursor: 'pointer',
                                color: activeTab === tab.key ? '#1e293b' : '#9ca3af',
                                borderBottom: activeTab === tab.key ? '2px solid #1e293b' : '2px solid transparent',
                                transition: 'all 0.15s',
                                marginBottom: -1,
                            }}>{tab.label}</button>
                        ))}
                    </div>

                    {/* Workflow Tab */}
                    {activeTab === 'workflow' && workflows.map(wf => (
                        <div key={wf.id} style={{
                            background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                            padding: 22, marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                                    {wf.workflow_type === 'pre_boarding' ? 'Pre-Boarding Pipeline' : 'Onboarding Pipeline'}
                                </h2>
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                                    background: wf.status === 'completed' ? '#ecfdf5' : '#eef2ff',
                                    color: wf.status === 'completed' ? '#065f46' : '#00ADEF',
                                }}>{wf.status}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {wf.steps?.map((step, si) => {
                                    const statusInfo = STEP_STATUSES[step.status] || {};
                                    const isCompleted = step.status === 'completed';
                                    const isActive = step.status === 'in_progress' || step.status === 'waiting_reply' || step.status === 'hitl';
                                    const isLast = si === wf.steps.length - 1;

                                    return (
                                        <div key={step.id} style={{ display: 'flex', gap: 14 }}>
                                            {/* Timeline line + dot */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: '50%',
                                                    border: isCompleted ? 'none' : `2px solid ${isActive ? '#1e293b' : '#e5e7eb'}`,
                                                    background: isCompleted ? '#1e293b' : isActive ? '#fff' : '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0, transition: 'all 0.3s ease',
                                                }}>
                                                    {isCompleted && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                    )}
                                                    {isActive && (
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1e293b' }} />
                                                    )}
                                                </div>
                                                {!isLast && (
                                                    <div style={{
                                                        width: 1.5, flex: 1, minHeight: 32,
                                                        background: isCompleted ? '#1e293b' : '#f0f0f0',
                                                        transition: 'background 0.3s ease',
                                                    }} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: isCompleted ? '#1e293b' : isActive ? '#1e293b' : '#9ca3af' }}>
                                                        {step.step_name}
                                                    </div>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                                                        background: `${statusInfo.color || '#9ca3af'}14`,
                                                        color: statusInfo.color || '#9ca3af',
                                                    }}>{statusInfo.label || step.status}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.4 }}>
                                                    {step.step_description}
                                                </div>
                                                {step.notes && (
                                                    <div style={{ marginTop: 4, fontSize: 11, color: '#00ADEF', fontWeight: 500 }}>
                                                        {step.notes}
                                                    </div>
                                                )}
                                                {['pending', 'in_progress', 'hitl'].includes(step.status) && (
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                        <button onClick={() => handleStepAction(step.id, 'complete')} style={{
                                                            padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                                            background: '#1e293b', color: '#fff', border: 'none',
                                                            borderRadius: 6, cursor: 'pointer',
                                                        }}>Complete</button>
                                                        <button onClick={() => handleStepAction(step.id, 'skip')} style={{
                                                            padding: '5px 12px', fontSize: 11, fontWeight: 600,
                                                            background: '#f3f4f6', color: '#6b7280', border: 'none',
                                                            borderRadius: 6, cursor: 'pointer',
                                                        }}>Skip</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Emails Tab */}
                    {activeTab === 'emails' && (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            {emails.length === 0 ? (
                                <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                    No emails yet
                                </div>
                            ) : (
                                emails.map(email => (
                                    <div key={email.id} style={{
                                        padding: '14px 20px', borderBottom: '1px solid #fafafa',
                                        transition: 'background 0.15s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{email.subject}</div>
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                                                background: email.direction === 'outbound' ? '#eef2ff' : '#ecfdf5',
                                                color: email.direction === 'outbound' ? '#00ADEF' : '#065f46',
                                            }}>
                                                {email.direction === 'outbound' ? 'Sent' : 'Received'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', gap: 12 }}>
                                            <span>{email.direction === 'outbound' ? `To: ${email.to_email}` : `From: ${email.from_email}`}</span>
                                            <span>{email.created_at ? new Date(email.created_at).toLocaleString() : ''}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
