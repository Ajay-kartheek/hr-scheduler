'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RecruiterSidebar from '@/components/RecruiterSidebar';
import { fetchCandidates } from '@/lib/api';

const STATUS_CONFIG = {
    selected: { label: 'Selected', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
    offer_sent: { label: 'Offer Sent', bg: 'linear-gradient(135deg, #fef9ec, #fef3c7)', color: '#b45309' },
    negotiating: { label: 'Negotiating', bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed' },
    accepted: { label: 'Accepted', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#15803d' },
    rejected: { label: 'Declined', bg: 'linear-gradient(135deg, #fef2f2, #fecaca)', color: '#dc2626' },
    manual_review: { label: 'Needs Review', bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#c2410c' },
    converted: { label: 'Converted to Hire', bg: 'linear-gradient(135deg, #ecfdf5, #a7f3d0)', color: '#047857' },
};

export default function RecruiterPipeline() {
    const router = useRouter();
    const [candidates, setCandidates] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCandidates().then(setCandidates).catch(console.error).finally(() => setLoaded(true));
    }, []);

    const filtered = candidates.filter(c => {
        const matchFilter = filter === 'all' || c.status === filter;
        const matchSearch = !search || `${c.first_name} ${c.last_name} ${c.designation} ${c.current_company}`.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'selected', label: 'Selected' },
        { key: 'offer_sent', label: 'Offer Sent' },
        { key: 'negotiating', label: 'Negotiating' },
        { key: 'accepted', label: 'Accepted' },
        { key: 'rejected', label: 'Declined' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <RecruiterSidebar />

            <main style={{ flex: 1, marginLeft: 88, padding: '16px 32px 32px', minHeight: '100vh' }}>
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px', letterSpacing: 0.5 }}>Recruitment</p>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>Candidate Pipeline</h1>
                </div>

                {/* Search + Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search candidates..."
                        style={{
                            padding: '8px 14px', borderRadius: 10, border: '1px solid #e8ecf4', fontSize: 12,
                            width: 240, outline: 'none', background: '#fff', color: '#1e293b', fontFamily: "'Inter', sans-serif",
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                        {filters.map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)} style={{
                                padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none',
                                background: filter === f.key ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : '#f1f5f9',
                                color: filter === f.key ? '#1d4ed8' : '#64748b',
                                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e8ecf4' }}>
                                {['Candidate', 'Role', 'Company', 'Experience', 'Offered CTC', 'Status', 'Added'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => {
                                const displayStatus = c.converted_hire_id ? 'converted' : c.status;
                                const sc = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.selected;
                                return (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #00ADEF20, #6366f120)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 11, fontWeight: 700, color: '#00275E', flexShrink: 0,
                                                }}>
                                                    {c.first_name?.[0]}{c.last_name?.[0] || ''}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.first_name} {c.last_name || ''}</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 500 }}>{c.designation}</td>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.current_company}</td>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.years_experience ? `${c.years_experience} yrs` : '—'}</td>
                                        <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 600 }}>{c.offered_ctc || '—'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                                background: sc.bg, color: sc.color,
                                            }}>
                                                {sc.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 11 }}>
                                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No candidates found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
