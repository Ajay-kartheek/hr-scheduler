'use client';

import { useState, useEffect } from 'react';
import { getOrgChart } from '@/lib/api';

function OrgNode({ node, depth = 0 }) {
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div style={{ marginLeft: depth > 0 ? '28px' : 0 }}>
            <div
                onClick={() => hasChildren && setExpanded(!expanded)}
                className="card"
                style={{
                    marginBottom: '6px', padding: '12px 16px',
                    cursor: hasChildren ? 'pointer' : 'default',
                    borderLeft: `3px solid ${depth === 0 ? 'var(--brand-500)' : 'var(--teal-500)'}`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {hasChildren && (
                            <span style={{
                                fontSize: '11px', color: 'var(--text-400)',
                                transition: 'transform 200ms',
                                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                display: 'inline-block',
                            }}>&#9654;</span>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-900)' }}>{node.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-400)', display: 'flex', gap: '12px', marginTop: '1px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-600)', fontSize: '11px' }}>{node.code}</span>
                                {node.head_name && <span>{node.head_name}</span>}
                                <span>{node.employee_count} members</span>
                            </div>
                        </div>
                    </div>
                    {node.new_hires?.length > 0 && (
                        <span className="badge badge-success">{node.new_hires.length} new</span>
                    )}
                </div>

                {node.new_hires?.length > 0 && expanded && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {node.new_hires.map(hire => {
                            const initial = (hire.first_name?.[0] || hire.personal_email[0]).toUpperCase();
                            return (
                                <div key={hire.id} style={{
                                    background: 'var(--bg-muted)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)', padding: '6px 10px',
                                    fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                }}>
                                    <div className="avatar avatar-sm" style={{ background: 'var(--brand-500)', width: '22px', height: '22px', fontSize: '10px' }}>
                                        {initial}
                                    </div>
                                    <span style={{ fontWeight: 500, color: 'var(--text-900)' }}>{hire.full_name || hire.personal_email}</span>
                                    <span style={{ color: 'var(--text-400)' }}>&middot; {hire.designation}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {hasChildren && expanded && node.children.map(child => (
                <OrgNode key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
    );
}

export default function OrgChartPage() {
    const [orgData, setOrgData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getOrgChart().then(setOrgData).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div>
            <div className="page-header">
                <h1>Organization Chart</h1>
                <p>Company hierarchy and team structure</p>
            </div>

            {orgData.length === 0 ? (
                <div className="card"><div className="empty-state">
                    <h3>No departments found</h3><p>Start the backend server to seed the org structure.</p>
                </div></div>
            ) : orgData.map(node => <OrgNode key={node.id} node={node} />)}
        </div>
    );
}
