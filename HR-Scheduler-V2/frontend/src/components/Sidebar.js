'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { label: 'Employees', path: '/employees', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { label: 'E-Learning', path: '/elearning', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg> },
    { label: 'Activities', path: '/activities', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg> },
    { label: 'Candidates', path: '/candidates', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg> },
];

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState({ name: 'HR', role: 'hr' });

    useEffect(() => {
        const auth = localStorage.getItem('sk_auth');
        if (auth) {
            try { const p = JSON.parse(auth); setUser({ name: p.name || 'HR', role: p.role || 'hr' }); } catch { }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('sk_auth');
        router.push('/login');
    };

    return (
        <aside style={{
            width: 88, background: '#fff', borderRight: '1px solid #e8ecf4',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 10,
            paddingTop: 16, boxShadow: '2px 0 12px rgba(0,39,94,0.03)',
        }}>
            <div style={{ marginBottom: 8, padding: '8px 0' }}>
                <img src="/sk-icon.svg" alt="SK" style={{ width: 40, height: 40 }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#00275E', textAlign: 'center', lineHeight: 1.2, marginBottom: 20 }}>
                Shellkode<br /><span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 8 }}>Technologies</span>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                    return (
                        <div key={item.label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                            color: isActive ? '#00ADEF' : '#94a3b8',
                            background: isActive ? 'rgba(0, 173, 239, 0.06)' : 'transparent',
                            transition: 'all 0.15s',
                        }}
                            onClick={() => router.push(item.path)}
                        >
                            {item.icon}
                            <span style={{ fontSize: 9, fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                        </div>
                    );
                })}
            </nav>

            <div style={{ padding: '16px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                    border: '2px solid #00ADEF30',
                    background: 'linear-gradient(135deg, #00275E, #003580)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                }}>
                    {user.name?.charAt(0) || 'H'}
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#00ADEF' }}>{user.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', opacity: 0.6 }}
                    onClick={handleLogout}
                >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
            </div>
        </aside>
    );
}
