'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

const STANDALONE_ROUTES = ['/welcome', '/portal', '/login'];

export default function ConditionalLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const isStandalone = STANDALONE_ROUTES.some(r => pathname.startsWith(r));

    useEffect(() => {
        if (isStandalone) {
            setAuthChecked(true);
            return;
        }
        // Check auth for dashboard routes
        const auth = localStorage.getItem('sk_auth');
        if (!auth) {
            router.replace('/login');
        } else {
            setAuthChecked(true);
        }
    }, [pathname, isStandalone, router]);

    if (isStandalone) {
        return <>{children}</>;
    }

    if (!authChecked) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f0f4ff', fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{
                    width: 36, height: 36, border: '3px solid #e2e8f0',
                    borderTopColor: '#00ADEF', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                }} />
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    );
}
