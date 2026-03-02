'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    {
        label: 'Dashboard', path: '/portal/dashboard',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
    },
    {
        label: 'Onboarding', path: '/portal/onboarding',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
    },
];

export default function EmployeeSidebar({ employee }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (employee) {
            setUser(employee);
        } else {
            const stored = localStorage.getItem('portal_employee');
            if (stored) setUser(JSON.parse(stored));
        }
    }, [employee]);

    function handleLogout() {
        localStorage.removeItem('portal_employee');
        router.push('/portal');
    }

    const name = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Employee';

    return (
        <aside style={{
            width: 88, background: '#fff', borderRight: '1px solid #e8ecf4',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 10,
            paddingTop: 16, boxShadow: '2px 0 12px rgba(0,39,94,0.03)',
        }}>
            <div style={{ marginBottom: 2, padding: '8px 0 0' }}>
                <img src="/sk-icon.svg" alt="SK" style={{ width: 34, height: 34 }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#00275E', textAlign: 'center', lineHeight: 1.2, marginBottom: 14 }}>
                Shellkode
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
                }}>
                    <img src="/avatar1.png" alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#00ADEF' }}>{user?.first_name || 'Employee'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', opacity: 0.8 }}
                    onClick={handleLogout}
                >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
            </div>
        </aside>
    );
}
