'use client';
import Sidebar from '@/components/Sidebar';

export default function ActivitiesPage() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fb' }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #00ADEF10, #6366f110)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Activities</h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>Activity tracking is currently under development.</p>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 24px', borderRadius: 20,
                        background: 'linear-gradient(135deg, #00ADEF10, #6366f110)',
                        border: '1px solid #00ADEF20',
                        color: '#00275E', fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
                    }}>
                        Coming Soon
                    </div>
                </div>
            </main>
        </div>
    );
}
