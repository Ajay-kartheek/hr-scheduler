'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPipeline } from '@/lib/api';

const PIPELINE_STAGES = [
    { key: 'offer_sent', label: 'Offer Sent', color: '#f59e0b' },
    { key: 'offer_accepted', label: 'Accepted', color: '#22c55e' },
    { key: 'pre_boarding', label: 'Pre-Boarding', color: '#00ADEF' },
    { key: 'ready_to_join', label: 'Ready to Join', color: '#10b981' },
    { key: 'day_one', label: 'Day 1', color: '#8b5cf6' },
    { key: 'onboarding', label: 'Onboarding', color: '#3b82f6' },
    { key: 'completed', label: 'Completed', color: '#059669' },
];

export default function PipelinePage() {
    const [pipeline, setPipeline] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPipeline()
            .then(setPipeline)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ width: 32, height: 32, border: '2.5px solid #f3f4f6', borderTopColor: '#1e293b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
        );
    }

    const columns = PIPELINE_STAGES.map(stage => {
        const col = pipeline?.columns?.find(c => c.stage === stage.key);
        return { ...stage, count: col?.count || 0, employees: col?.employees || [] };
    });

    const totalEmployees = columns.reduce((sum, c) => sum + c.count, 0);

    return (
        <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.35s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', letterSpacing: -0.3 }}>Pipeline</h1>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{totalEmployees} total employees</p>
                </div>
                <Link href="/employees/new" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', background: '#1e293b', color: '#fff',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    transition: 'all 0.2s', flexShrink: 0,
                }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = '#1f2937';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(17, 24, 39, 0.15)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = '#1e293b';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add New Hire
                </Link>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns.length}, minmax(160px, 1fr))`,
                gap: 12, overflowX: 'auto', overflowY: 'visible',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 8,
            }}>
                {columns.map(col => (
                    <div key={col.key} style={{
                        background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0',
                        padding: 14, minHeight: 280,
                        transition: 'all 0.25s ease',
                    }}>
                        {/* Column header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f5f5f5',
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: '#6b7280',
                                background: '#f3f4f6', padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                            }}>{col.count}</span>
                        </div>

                        {/* Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {col.employees.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 8px', fontSize: 12, color: '#d1d5db', fontStyle: 'italic' }}>
                                    No employees
                                </div>
                            ) : (
                                col.employees.map(emp => (
                                    <Link key={emp.id} href={`/employees/${emp.id}`} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 12px', background: '#fafafa', borderRadius: 10,
                                        border: '1px solid transparent', textDecoration: 'none',
                                        transition: 'all 0.2s', cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#fafafa';
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: col.color, color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {(emp.first_name || '?')[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {emp.first_name} {emp.last_name || ''}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {emp.designation || emp.domain || 'New Hire'}
                                            </div>
                                            {emp.workflow_progress !== undefined && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                                                    <div style={{ flex: 1, height: 3, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${emp.workflow_progress || 0}%`, background: col.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af' }}>{emp.workflow_progress || 0}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
