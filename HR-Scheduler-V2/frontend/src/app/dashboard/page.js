'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { fetchDashboardStats, fetchWaitingHires, fetchRecentHires, sendWelcome, confirmJoined } from '@/lib/api';

/* ──── Rocket SVG ──── */
function RocketSVG() {
    return (
        <svg width="90" height="90" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="60" cy="108" rx="10" ry="6" fill="#f59e0b" opacity="0.6">
                <animate attributeName="ry" values="6;9;6" dur="0.4s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="60" cy="106" rx="6" ry="4" fill="#fbbf24">
                <animate attributeName="ry" values="4;7;4" dur="0.3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="60" cy="104" rx="3" ry="3" fill="#fff" opacity="0.8">
                <animate attributeName="ry" values="3;5;3" dur="0.35s" repeatCount="indefinite" />
            </ellipse>
            <circle cx="48" cy="112" r="4" fill="#e2e8f0" opacity="0.4">
                <animate attributeName="r" values="4;8;4" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="72" cy="114" r="3" fill="#e2e8f0" opacity="0.3">
                <animate attributeName="r" values="3;7;3" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.05;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <g>
                <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="2s" repeatCount="indefinite" />
                <path d="M43 82 L50 70 L50 90 Z" fill="#dc2626" />
                <path d="M77 82 L70 70 L70 90 Z" fill="#dc2626" />
                <path d="M50 90 L50 50 Q50 30 60 20 Q70 30 70 50 L70 90 Z" fill="#e2e8f0" />
                <path d="M50 90 L50 50 Q50 30 60 20 Q70 30 70 50 L70 90 Z" fill="url(#rocketGrad)" />
                <circle cx="60" cy="52" r="7" fill="#00ADEF" />
                <circle cx="60" cy="52" r="5" fill="#0ea5e9" />
                <circle cx="58" cy="50" r="2" fill="#fff" opacity="0.6" />
                <path d="M55 35 Q60 22 65 35" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                <rect x="50" y="72" width="20" height="4" rx="1" fill="#00ADEF" opacity="0.5" />
                <rect x="50" y="80" width="20" height="3" rx="1" fill="#00ADEF" opacity="0.3" />
                <path d="M53 90 L55 96 L65 96 L67 90" fill="#64748b" />
            </g>
            <circle cx="22" cy="30" r="1.5" fill="#fff" opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx="95" cy="22" r="1" fill="#fff" opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.5s" repeatCount="indefinite" /></circle>
            <circle cx="105" cy="55" r="1.5" fill="#fff" opacity="0.6"><animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" /></circle>
            <circle cx="18" cy="65" r="1" fill="#fff" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite" /></circle>
            <defs>
                <linearGradient id="rocketGrad" x1="50" y1="20" x2="70" y2="90" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
                </linearGradient>
            </defs>
        </svg>
    );
}

/* ──── Constants ──── */
const STAT_META = [
    { key: 'onboarding', label: 'ONBOARDING', color: '#00ADEF', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
    { key: 'provisioning', label: 'PROVISIONING', color: '#10b981', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
    { key: 'first_month', label: 'FIRST MONTH', color: '#f59e0b', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
    { key: 'second_month', label: 'SECOND MONTH', color: '#8b5cf6', icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg> },
];

const AVATARS = ['/avatar1.png', '/avatar2.png', '/avatar3.png', '/avatar4.png', '/avatar5.png'];
const RING_COLORS = ['#8b5cf6', '#00ADEF', '#10b981', '#f59e0b', '#ec4899'];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();
}

/* Status config */
const STATUS_CONFIG = {
    waiting_for_input: { label: 'Pending', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', shadow: '0 1px 3px rgba(245,158,11,0.15)' },
    welcome_sent: { label: 'Mail Sent', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1d4ed8', shadow: '0 1px 3px rgba(29,78,216,0.12)' },
    form_received: { label: 'Form Received', bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#15803d', shadow: '0 1px 3px rgba(21,128,61,0.12)' },
    onboarding_in_progress: { label: 'Onboarding', bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', color: '#0369a1', shadow: '0 1px 3px rgba(3,105,161,0.12)' },
    onboarding_completed: { label: 'Completed', bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', color: '#166534', shadow: '0 1px 3px rgba(22,101,52,0.12)' },
    active: { label: 'Active', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#065f46', shadow: '0 1px 3px rgba(6,95,70,0.12)' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.waiting_for_input;
    return (
        <span style={{
            fontSize: 10, fontWeight: 600, padding: '4px 14px', borderRadius: 8,
            background: cfg.bg, color: cfg.color, boxShadow: cfg.shadow, whiteSpace: 'nowrap',
        }}>{cfg.label}</span>
    );
}


export default function DashboardPage() {
    const [user, setUser] = useState({ name: 'HR', role: 'hr' });
    const [loaded, setLoaded] = useState(false);
    const [stats, setStats] = useState({});
    const [waiting, setWaiting] = useState([]);
    const [recent, setRecent] = useState([]);
    const [sending, setSending] = useState({});
    const [sliderPage, setSliderPage] = useState(0);
    const [empSearch, setEmpSearch] = useState('');
    const [empFilter, setEmpFilter] = useState('all');
    const [confirming, setConfirming] = useState({});
    const router = useRouter();

    useEffect(() => {
        const auth = localStorage.getItem('sk_auth');
        if (auth) {
            try { const p = JSON.parse(auth); setUser({ name: p.name || 'HR', role: p.role || 'hr' }); } catch { }
        }
        loadData();
    }, []);

    async function loadData() {
        try {
            const [s, w, r] = await Promise.all([
                fetchDashboardStats(),
                fetchWaitingHires(),
                fetchRecentHires(),
            ]);
            setStats(s);
            setWaiting(w);
            setRecent(r);
        } catch (e) {
            console.error('Dashboard load failed:', e);
        }
        setLoaded(true);
    }

    async function handleSendMail(hireId, e) {
        e.stopPropagation();
        if (sending[hireId]) return;
        setSending(prev => ({ ...prev, [hireId]: true }));
        try {
            await sendWelcome(hireId);
            // Reload data to get updated statuses
            await loadData();
        } catch (err) {
            console.error('Failed to send welcome email:', err);
        }
        setSending(prev => ({ ...prev, [hireId]: false }));
    }

    async function handleConfirmJoined(hireId, e) {
        e.stopPropagation();
        if (confirming[hireId]) return;
        setConfirming(prev => ({ ...prev, [hireId]: true }));
        try {
            await confirmJoined(hireId);
            await loadData();
        } catch (err) {
            console.error('Failed to confirm joined:', err);
        }
        setConfirming(prev => ({ ...prev, [hireId]: false }));
    }

    // Filter + search employees
    const allEmployees = recent.length > 0 ? recent : waiting;
    const filteredEmployees = allEmployees.filter(emp => {
        const name = `${emp.first_name} ${emp.last_name || ''}`.trim().toLowerCase();
        const matchSearch = !empSearch || name.includes(empSearch.toLowerCase()) || (emp.designation || '').toLowerCase().includes(empSearch.toLowerCase());
        const matchFilter = empFilter === 'all' || (empFilter === 'joining_soon' && emp.doj && new Date(emp.doj) > new Date()) || (empFilter === 'started' && emp.doj && new Date(emp.doj) <= new Date());
        return matchSearch && matchFilter;
    });

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f0f4ff', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <Sidebar />

            <main style={{ flex: 1, marginLeft: 88, padding: '16px 32px 32px', minHeight: '100vh' }}>


                {/* Welcome + CTA Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 24 }}>
                    <div>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, margin: '0 0 2px 0', letterSpacing: 0.5 }}>Dashboard</p>
                        <h1 style={{ fontSize: 26, fontWeight: 300, color: '#1e293b', letterSpacing: -0.5, margin: 0 }}>
                            <span style={{ fontWeight: 700 }}>Welcome,</span> {user.name}
                        </h1>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, #001d3d 0%, #003566 35%, #00527a 65%, #0077b6 100%)',
                        borderRadius: 16, color: '#fff', position: 'relative', overflow: 'hidden',
                        display: 'flex', alignItems: 'center',
                        boxShadow: '0 6px 24px rgba(0, 39, 94, 0.2)',
                        padding: '14px 10px 14px 24px', minWidth: 300, flexShrink: 0,
                    }}>
                        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(0, 173, 239, 0.07)', top: -40, left: -20 }} />
                        <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'rgba(0, 173, 239, 0.05)', bottom: -30, left: '45%' }} />
                        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px 0', lineHeight: 1.3 }}>Start a new journey</p>
                            <button style={{
                                padding: '7px 20px',
                                background: 'linear-gradient(135deg, #00ADEF, #0ea5e9)',
                                color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: '0 4px 14px rgba(0,173,239,0.35)',
                            }}
                                onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,173,239,0.5)'; }}
                                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(0,173,239,0.35)'; }}
                                onClick={() => router.push('/onboarding/new')}
                            >New Onboarding</button>
                        </div>
                        <div style={{ width: 70, height: 70, flexShrink: 0, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RocketSVG />
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
                    {STAT_META.map((s, i) => (
                        <div key={i} style={{
                            background: '#fff', borderRadius: 14, padding: '22px 20px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            border: '1px solid #e8ecf4', position: 'relative', overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,39,94,0.04)', transition: 'all 0.2s', cursor: 'pointer',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,39,94,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,39,94,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, borderRadius: '0 3px 3px 0', background: s.color, opacity: 0.5 }} />
                            <div>
                                <div style={{ fontSize: 34, fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{stats[s.key] ?? 0}</div>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: 1, marginTop: 6 }}>{s.label}</div>
                            </div>
                            <div style={{
                                width: 46, height: 46, borderRadius: 12,
                                background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{s.icon}</div>
                        </div>
                    ))}
                </div>

                {/* Brand New Employees — Smooth Slider with Search & Filter */}
                {allEmployees.length > 0 && (() => {
                    const employees = filteredEmployees;
                    const PER_PAGE = 5;
                    const totalPages = Math.ceil(employees.length / PER_PAGE);
                    const safePage = Math.min(sliderPage, Math.max(0, totalPages - 1));
                    return (
                        <div style={{ marginBottom: 28 }}>
                            {/* Header with search & filter */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 16 }}>
                                <div>
                                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Brand new Employees</h2>
                                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{employees.length} of {allEmployees.length} shown</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    {/* Search */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
                                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 10, width: 200,
                                    }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                                        <input
                                            type="text" placeholder="Search..." value={empSearch}
                                            onChange={e => { setEmpSearch(e.target.value); setSliderPage(0); }}
                                            style={{ border: 'none', outline: 'none', fontSize: 12, color: '#1e293b', width: '100%', background: 'transparent', fontFamily: "'Inter', sans-serif" }}
                                        />
                                    </div>
                                    {/* Filter pills */}
                                    {['all', 'joining_soon', 'started'].map(f => (
                                        <button key={f} onClick={() => { setEmpFilter(f); setSliderPage(0); }} style={{
                                            padding: '6px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none',
                                            background: empFilter === f ? 'linear-gradient(135deg, #00275E, #003580)' : '#f1f5f9',
                                            color: empFilter === f ? '#fff' : '#64748b',
                                            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                        }}>
                                            {f === 'all' ? 'All' : f === 'joining_soon' ? 'Joining Soon' : 'Started'}
                                        </button>
                                    ))}
                                    {/* Slider arrows */}
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                                            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{safePage + 1}/{totalPages}</span>
                                            <button onClick={() => setSliderPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
                                                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8ecf4', background: safePage === 0 ? '#f8fafc' : '#fff', cursor: safePage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={safePage === 0 ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                            </button>
                                            <button onClick={() => setSliderPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
                                                style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8ecf4', background: safePage >= totalPages - 1 ? '#f8fafc' : '#fff', cursor: safePage >= totalPages - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={safePage >= totalPages - 1 ? '#cbd5e1' : '#1e293b'} strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {employees.length === 0 ? (
                                <div style={{ background: '#f8fafc', border: '1px solid #e8ecf4', borderRadius: 14, padding: '32px 20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 13, color: '#94a3b8' }}>No employees match your search.</div>
                                </div>
                            ) : (
                                <>
                                    {/* Sliding container */}
                                    <div style={{ overflow: 'hidden', borderRadius: 16 }}>
                                        <div style={{
                                            display: 'flex', gap: 16,
                                            transform: `translateX(calc(-${safePage * 100}% - ${safePage * 16}px))`,
                                            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}>
                                            {employees.map((emp, i) => {
                                                const ring = RING_COLORS[i % RING_COLORS.length];
                                                const avatar = AVATARS[i % AVATARS.length];
                                                const name = `${emp.first_name} ${emp.last_name || ''}`.trim();
                                                const needsConfirm = emp.status === 'onboarding_completed';
                                                return (
                                                    <div key={emp.id} style={{
                                                        minWidth: 'calc((100% - 64px) / 5)', flex: '0 0 calc((100% - 64px) / 5)',
                                                        background: '#fff', border: `1px solid ${needsConfirm ? '#f59e0b40' : '#e8ecf4'}`, borderRadius: 16,
                                                        padding: '24px 14px 18px', textAlign: 'center',
                                                        boxShadow: needsConfirm ? '0 2px 8px rgba(245,158,11,0.1)' : '0 1px 3px rgba(0,39,94,0.04)',
                                                        transition: 'box-shadow 0.25s, border-color 0.25s, transform 0.25s', cursor: 'pointer',
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,39,94,0.1)'; e.currentTarget.style.borderColor = ring + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = needsConfirm ? '0 2px 8px rgba(245,158,11,0.1)' : '0 1px 3px rgba(0,39,94,0.04)'; e.currentTarget.style.borderColor = needsConfirm ? '#f59e0b40' : '#e8ecf4'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                                        onClick={() => router.push(`/employee/${emp.id}`)}
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
                                                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>{emp.designation || 'New Hire'}</div>
                                                        {emp.doj && (() => {
                                                            const isPast = new Date(emp.doj) <= new Date();
                                                            return (
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, fontWeight: 600, color: isPast ? '#15803d' : '#dc2626', marginBottom: needsConfirm ? 8 : 0 }}>
                                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isPast ? '#15803d' : '#dc2626'} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                                    {isPast ? 'STARTED' : 'JOINING'} {formatDate(emp.doj)}
                                                                </div>
                                                            );
                                                        })()}
                                                        {needsConfirm && (
                                                            <button
                                                                onClick={(e) => handleConfirmJoined(emp.id, e)}
                                                                disabled={confirming[emp.id]}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                                    padding: '4px 12px', fontSize: 9, fontWeight: 600, borderRadius: 20,
                                                                    border: '1px solid #10b98140',
                                                                    background: confirming[emp.id] ? '#f1f5f9' : '#f0fdf4',
                                                                    color: confirming[emp.id] ? '#94a3b8' : '#15803d',
                                                                    cursor: confirming[emp.id] ? 'not-allowed' : 'pointer',
                                                                    transition: 'all 0.2s', marginTop: 4,
                                                                }}
                                                                onMouseEnter={e => { if (!confirming[emp.id]) { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#10b981'; } }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = confirming[emp.id] ? '#f1f5f9' : '#f0fdf4'; e.currentTarget.style.borderColor = '#10b98140'; }}
                                                            >
                                                                {confirming[emp.id] ? (
                                                                    <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6" /></svg>Verifying...</>
                                                                ) : (
                                                                    <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Verify Joined</>
                                                                )}
                                                            </button>
                                                        )}
                                                        {emp.status === 'active' && (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 10px', fontSize: 9, fontWeight: 600, borderRadius: 20, background: '#ecfdf5', color: '#065f46', marginTop: 4 }}>
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Active
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Page dots */}
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
                                            {Array.from({ length: totalPages }).map((_, pi) => (
                                                <div key={pi} onClick={() => setSliderPage(pi)} style={{
                                                    width: safePage === pi ? 20 : 6, height: 6, borderRadius: 3,
                                                    background: safePage === pi ? '#00ADEF' : '#cbd5e1',
                                                    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* Waiting new hire's input -- with Send Mail actions */}
                {waiting.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>Waiting new hire&apos;s input</h2>
                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Pending for acceptance</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                            {waiting.map((item, i) => {
                                const name = `${item.first_name} ${item.last_name || ''}`.trim();
                                const initials = `${(item.first_name || '')[0] || ''}${(item.last_name || '')[0] || ''}`.toUpperCase();
                                const initialColor = RING_COLORS[i % RING_COLORS.length];
                                const isPending = item.status === 'waiting_for_input';
                                const isMailSent = item.status === 'welcome_sent';
                                const isFormReceived = item.status === 'form_received';
                                const isOnboarding = item.status === 'onboarding_in_progress';
                                const isSending = sending[item.id];

                                return (
                                    <div key={item.id} style={{
                                        background: '#fff', border: '1px solid #e8ecf4', borderRadius: 14,
                                        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                                        boxShadow: '0 1px 3px rgba(0,39,94,0.04)', transition: 'all 0.2s', cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ADEF40'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,39,94,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecf4'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,39,94,0.04)'; }}
                                        onClick={() => router.push(`/employee/${item.id}`)}
                                    >
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                            background: `linear-gradient(135deg, ${initialColor}20, ${initialColor}40)`,
                                            border: `2px solid ${initialColor}30`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 15, fontWeight: 700, color: initialColor,
                                        }}>{initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.designation || 'New Hire'}</div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <StatusBadge status={item.status} />

                                            {/* Send Mail button -- only for pending hires */}
                                            {isPending && (
                                                <button
                                                    onClick={(e) => handleSendMail(item.id, e)}
                                                    disabled={isSending}
                                                    style={{
                                                        padding: '5px 14px', fontSize: 11, fontWeight: 600,
                                                        border: '1.5px solid #00275E', borderRadius: 8,
                                                        background: isSending ? '#f1f5f9' : 'linear-gradient(135deg, #00275E, #003580)',
                                                        color: isSending ? '#94a3b8' : '#fff',
                                                        cursor: isSending ? 'not-allowed' : 'pointer',
                                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                                    {isSending ? 'Sending...' : 'Send Mail'}
                                                </button>
                                            )}

                                            {/* View button -- for form received hires */}
                                            {isFormReceived && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.push(`/employee/${item.id}`); }}
                                                    style={{
                                                        padding: '5px 14px', fontSize: 11, fontWeight: 600,
                                                        border: '1.5px solid #15803d', borderRadius: 8,
                                                        background: '#15803d', color: '#fff',
                                                        cursor: 'pointer', transition: 'all 0.2s',
                                                        display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    Review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
