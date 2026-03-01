'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/lib/api';

const navItems = [
    {
        label: 'Dashboard',
        href: '/',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        ),
    },
    {
        label: 'Pipeline',
        href: '/pipeline',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="3" width="5" height="18" rx="1" />
                <rect x="9.5" y="6" width="5" height="15" rx="1" />
                <rect x="17" y="9" width="5" height="12" rx="1" />
            </svg>
        ),
    },
    {
        label: 'AI Command Center',
        href: '/ai-center',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
        ),
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
        ),
        badgeKey: 'notifications',
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        getUnreadCount()
            .then(data => setUnreadCount(data.count))
            .catch(() => { });

        const interval = setInterval(() => {
            getUnreadCount()
                .then(data => setUnreadCount(data.count))
                .catch(() => { });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('sk_auth');
        router.push('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon" style={{ background: 'transparent', borderRadius: 0 }}>
                    <img src="/sk-icon.svg" alt="Shellkode" width="36" height="36" style={{ objectFit: 'contain' }} />
                </div>
                <div>
                    <h1 style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>Shellkode HR</h1>
                    <span>Onboarding Platform</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <span className="sidebar-link-icon">{item.icon}</span>
                            <span>{item.label}</span>
                            {item.badgeKey === 'notifications' && unreadCount > 0 && (
                                <span className="sidebar-badge">{unreadCount}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">

                    <div>
                        <div className="sidebar-user-name">HR Admin</div>
                        <div className="sidebar-user-email">admin@shellkode.com</div>
                    </div>
                    <div className="sidebar-user-status" title="Online" />
                </div>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%', marginTop: 10,
                    padding: '7px 10px', border: 'none', borderRadius: 8,
                    background: 'transparent', color: '#94a3b8', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
