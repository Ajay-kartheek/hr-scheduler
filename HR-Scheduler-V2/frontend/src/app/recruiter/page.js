'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RecruiterSidebar from '@/components/RecruiterSidebar';
import { fetchCandidates, fetchCandidateStats } from '@/lib/api';

const AVATARS = [
    'https://api.dicebear.com/7.x/personas/svg?seed=Arun&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/personas/svg?seed=Meera&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/personas/svg?seed=Karthik&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/personas/svg?seed=Sneha&backgroundColor=d1f4d8',
    'https://api.dicebear.com/7.x/personas/svg?seed=Varun&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/personas/svg?seed=Divya&backgroundColor=b6e3f4',
];

const RING_COLORS = ['#00ADEF', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

const STATUS_CONFIG = {
    selected: { label: 'Selected', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8' },
    offer_sent: { label: 'Offer Sent', bg: 'linear-gradient(135deg, #fef9ec, #fef3c7)', color: '#b45309' },
    negotiating: { label: 'Negotiating', bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)', color: '#7c3aed' },
    accepted: { label: 'Accepted', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#15803d' },
    rejected: { label: 'Declined', bg: 'linear-gradient(135deg, #fef2f2, #fecaca)', color: '#dc2626' },
    manual_review: { label: 'Needs Review', bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)', color: '#c2410c' },
    converted: { label: 'Converted to Hire', bg: 'linear-gradient(135deg, #ecfdf5, #a7f3d0)', color: '#047857' },
};

export default function RecruiterDashboard() {
    const router = useRouter();
    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({});
    const [loaded, setLoaded] = useState(false);
    const [user, setUser] = useState({ name: 'Recruiter' });

    useEffect(() => {
        const auth = localStorage.getItem('sk_auth');
        if (auth) {
            try { const p = JSON.parse(auth); setUser({ name: p.name || 'Recruiter' }); } catch { }
        }
        loadData();
    }, []);

    async function loadData() {
        try {
            const [cands, st] = await Promise.all([fetchCandidates(), fetchCandidateStats()]);
            setCandidates(cands);
            setStats(st);
        } catch (e) { console.error(e); }
        setLoaded(true);
    }

    const statCards = [
        { label: 'Total Candidates', value: stats.total || 0, color: '#00275E', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00275E" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        { label: 'Selected', value: stats.selected || 0, color: '#1d4ed8', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
        { label: 'Offer Sent', value: stats.offer_sent || 0, color: '#b45309', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> },
        { label: 'Accepted', value: stats.accepted || 0, color: '#15803d', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg> },
        { label: 'Negotiating', value: stats.negotiating || 0, color: '#7c3aed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
        { label: 'Declined', value: stats.rejected || 0, color: '#dc2626', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <RecruiterSidebar />

            <main style={{ flex: 1, marginLeft: 88, padding: '16px 32px 32px', minHeight: '100vh' }}>

                {/* Welcome */}
                <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px 0', letterSpacing: 0.5 }}>Recruitment Portal</p>
                    <h1 style={{ fontSize: 26, fontWeight: 300, color: '#1e293b', letterSpacing: -0.5, margin: 0 }}>
                        <span style={{ fontWeight: 700 }}>Welcome,</span> {user.name}
                    </h1>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
                    {statCards.map((s, i) => (
                        <div key={i} style={{
                            background: '#fff', borderRadius: 14, padding: '16px 14px',
                            border: '1px solid #e8ecf4', boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,39,94,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,39,94,0.04)'; }}
                        >
                            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Selected Candidates */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Selected Candidates</h2>
                            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{candidates.length} candidates in pipeline</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                        {candidates.map((c, i) => {
                            const ring = RING_COLORS[i % RING_COLORS.length];
                            const avatar = AVATARS[i % AVATARS.length];
                            const name = `${c.first_name} ${c.last_name || ''}`.trim();
                            const displayStatus = c.converted_hire_id ? 'converted' : c.status;
                            const sc = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.selected;
                            return (
                                <div key={c.id} style={{
                                    background: '#fff', border: '1px solid #e8ecf4', borderRadius: 16,
                                    padding: '24px 14px 18px', textAlign: 'center',
                                    boxShadow: '0 1px 3px rgba(0,39,94,0.04)',
                                    transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s', cursor: 'pointer',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,39,94,0.1)'; e.currentTarget.style.borderColor = ring + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,39,94,0.04)'; e.currentTarget.style.borderColor = '#e8ecf4'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                    onClick={() => router.push(`/recruiter/candidate/${c.id}`)}
                                >
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 10px',
                                        border: `3px solid ${ring}30`, padding: 2,
                                        background: `linear-gradient(135deg, ${ring}10, transparent)`,
                                    }}>
                                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#f8fafc' }}>
                                            <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#00ADEF', marginBottom: 2 }}>{name}</div>
                                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>{c.designation || 'Candidate'}</div>
                                    <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8 }}>{c.current_company}</div>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                        padding: '3px 10px', fontSize: 9, fontWeight: 600, borderRadius: 20,
                                        background: sc.bg, color: sc.color,
                                    }}>
                                        {sc.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
