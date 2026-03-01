'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPipeline } from '@/lib/api';
import { STAGES } from '@/lib/constants';

export default function OnboardingPage() {
    const [pipeline, setPipeline] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPipeline().then(setPipeline).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Onboarding Pipeline</h1>
                        <p>Track every new hire through the onboarding journey</p>
                    </div>
                    <Link href="/employees/new" className="btn btn-primary">+ Add New Hire</Link>
                </div>
            </div>

            <div className="kanban-board">
                {pipeline?.columns?.map((col) => {
                    const stageInfo = STAGES.find(s => s.value === col.stage);
                    return (
                        <div key={col.stage} className="kanban-column">
                            <div className="kanban-column-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="dot" style={{ background: stageInfo?.color }}></span>
                                    <span className="kanban-column-title">{col.label}</span>
                                </div>
                                <span className="kanban-column-count">{col.count}</span>
                            </div>
                            <div className="kanban-column-body">
                                {col.employees.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-400)', fontSize: '12px' }}>
                                        No employees in this stage
                                    </div>
                                ) : (
                                    col.employees.map(emp => {
                                        const initial = (emp.first_name?.[0] || emp.personal_email[0]).toUpperCase();
                                        const colors = ['#4f46e5', '#0d9488', '#d97706', '#dc2626', '#7c3aed', '#2563eb'];
                                        const bgColor = colors[initial.charCodeAt(0) % colors.length];

                                        return (
                                            <Link key={emp.id} href={`/employees/${emp.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                <div className="kanban-card">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <div className="avatar avatar-sm" style={{ background: bgColor }}>{initial}</div>
                                                        <div>
                                                            <div className="kanban-card-name">{emp.full_name || emp.personal_email}</div>
                                                            <div className="kanban-card-role">{emp.designation}</div>
                                                        </div>
                                                    </div>
                                                    <div className="kanban-card-meta">
                                                        <span className="kanban-card-badge" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)' }}>
                                                            {emp.domain}
                                                        </span>
                                                        {emp.role_id && (
                                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--brand-600)' }}>
                                                                {emp.role_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {emp.doj && (
                                                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-400)' }}>
                                                            DOJ: {new Date(emp.doj).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
