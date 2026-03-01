'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/analytics/overview`)
            .then(r => r.json())
            .then(setData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-header"><h1>Analytics</h1><p>Loading...</p></div>;
    if (!data) return <div className="page-header"><h1>Analytics</h1><p>Could not load analytics data.</p></div>;

    const { summary, stage_distribution, domain_distribution, bottlenecks, overdue_steps, email_stats, laptop_stats, monthly_trend } = data;

    const stageColors = {
        offer_sent: '#8b5cf6', offer_accepted: '#6366f1',
        pre_boarding: '#3b82f6', ready_to_join: '#06b6d4',
        day_one: '#14b8a6', onboarding: '#10b981', completed: '#22c55e',
    };

    const maxHires = Math.max(...monthly_trend.map(m => m.hires), 1);

    return (
        <div>
            <div className="page-header">
                <div className="page-header-row">
                    <div>
                        <h1>Analytics</h1>
                        <p>Onboarding metrics, bottleneck analysis, and SLA tracking</p>
                    </div>
                    <span className="badge badge-info" style={{ padding: '6px 14px', fontSize: '12px' }}>
                        📊 Real-time Data
                    </span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '20px' }}>
                {[
                    { label: 'Total Employees', value: summary.total_employees, color: 'var(--brand-600)' },
                    { label: 'Active Onboardings', value: summary.active_onboardings, color: 'var(--teal-600)' },
                    { label: 'Completed', value: summary.completed, color: '#22c55e' },
                    { label: 'Pending Steps', value: summary.pending_steps, color: 'var(--amber-600)' },
                    { label: 'Overdue', value: summary.overdue_count, color: summary.overdue_count > 0 ? '#dc2626' : '#22c55e' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Monthly Trend */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Monthly Hiring Trend</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
                        {monthly_trend.map((m, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{
                                    height: `${Math.max((m.hires / maxHires) * 110, 4)}px`,
                                    background: 'linear-gradient(180deg, var(--brand-500), var(--brand-400))',
                                    borderRadius: '4px 4px 0 0',
                                    marginBottom: '6px', transition: 'height 0.3s',
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '4px',
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>{m.hires || ''}</span>
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-400)' }}>{m.month.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stage Distribution */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Pipeline Distribution</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(stage_distribution).map(([stage, count]) => {
                            const total = Object.values(stage_distribution).reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? (count / total * 100) : 0;
                            return (
                                <div key={stage}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-700)', textTransform: 'capitalize' }}>
                                            {stage.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-900)' }}>{count}</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: stageColors[stage] || 'var(--brand-500)',
                                            borderRadius: '3px', transition: 'width 0.5s',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Domain Distribution */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>By Domain</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {Object.entries(domain_distribution).map(([domain, count]) => (
                            <div key={domain} style={{
                                padding: '10px 16px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)',
                                textAlign: 'center', minWidth: '100px',
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-600)' }}>{count}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-500)', textTransform: 'capitalize' }}>
                                    {domain.replace(/_/g, ' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Email & Laptop Stats */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Operations</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Emails Sent</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>{email_stats.sent}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Emails Received</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb' }}>{email_stats.received}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Laptops Requested</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand-600)' }}>{laptop_stats.requested}</div>
                        </div>
                        <div style={{ padding: '12px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Laptops Delivered</div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#22c55e' }}>{laptop_stats.delivered}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Bottlenecks */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                        ⏱️ Bottleneck Analysis
                    </h3>
                    {bottlenecks.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-400)', textAlign: 'center', padding: '20px' }}>
                            No completed steps to analyze yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {bottlenecks.map((b, i) => (
                                <div key={i} style={{
                                    padding: '10px 14px', background: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)',
                                    borderLeft: `3px solid ${b.avg_hours > 24 ? '#dc2626' : b.avg_hours > 8 ? '#d97706' : '#22c55e'}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-900)' }}>{b.step}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: b.avg_hours > 24 ? '#dc2626' : 'var(--text-500)' }}>
                                            {b.avg_hours < 1 ? `${Math.round(b.avg_hours * 60)}m` : `${b.avg_hours}h`} avg
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-400)' }}>{b.count} completed</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Overdue Steps */}
                <div className="card">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                        ⚠️ Overdue Steps
                    </h3>
                    {overdue_steps.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                            <p style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>All steps are on track!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {overdue_steps.map((s, i) => (
                                <div key={i} style={{
                                    padding: '10px 14px', background: '#fef2f2', borderRadius: 'var(--radius-sm)',
                                    borderLeft: '3px solid #dc2626',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b' }}>{s.step}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>{s.days_pending}d overdue</span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#b91c1c' }}>{s.employee}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
