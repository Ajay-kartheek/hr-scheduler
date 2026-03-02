'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/recruiter', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
    { label: 'Pipeline', path: '/recruiter/pipeline', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg> },
];

export default function RecruiterSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState({ name: 'Recruiter', role: 'recruiter' });

    useEffect(() => {
        const auth = localStorage.getItem('sk_auth');
        if (auth) {
            try { const p = JSON.parse(auth); setUser({ name: p.name || 'Recruiter', role: p.role || 'recruiter' }); } catch { }
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
                Shellkode<br /><span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 8 }}>Recruiter</span>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
                {NAV_ITEMS.map(item => {
                    const isActive = pathname === item.path || (item.path !== '/recruiter' && pathname?.startsWith(item.path + '/'));
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
                }}>
                    <img src="/avatar2.png" alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, #00275E, #003580)'; e.target.parentElement.innerHTML = `<span style="color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${user.name?.charAt(0) || 'R'}</span>`; }}
                    />
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#00ADEF' }}>{user.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', opacity: 0.8 }}
                    onClick={handleLogout}
                >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
            </div>
        </aside>
    );
}
