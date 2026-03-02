'use client';
import Sidebar from '@/components/Sidebar';

export default function EmployeesPage() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f8fb' }}>
            <Sidebar />
            <main style={{ flex: 1, marginLeft: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #00ADEF10, #6366f110)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ADEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Employees</h1>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.6 }}>Employee management is currently under development.</p>
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
