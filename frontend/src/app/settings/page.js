'use client';

const SETTINGS_DATA = [
    {
        title: 'Integrations',
        items: [
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>,
                label: 'Gmail API',
                desc: 'Send and receive emails. Handles offer letters, admin requests, and AI email classification.',
                value: 'Connected',
                valueBg: '#ecfdf5', valueColor: '#065f46',
            },
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>,
                label: 'Google Calendar',
                desc: 'Creates Day 1 calendar events and sends invites to employees, HR, and buddies.',
                value: 'Connected',
                valueBg: '#ecfdf5', valueColor: '#065f46',
            },
        ]
    },
    {
        title: 'Email Configuration',
        items: [
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>,
                label: 'HR Email (Sender)',
                desc: 'Used for offer letters, welcome emails, and follow-ups',
                value: process.env.NEXT_PUBLIC_HR_EMAIL || 'kalaiarasan6923@gmail.com',
            },
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
                label: 'Admin Email',
                desc: 'Receives laptop, ID card, access card, and email creation requests',
                value: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ajaykartheek.cloud@gmail.com',
            },
        ]
    },
    {
        title: 'AI Configuration',
        items: [
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
                label: 'AI Model',
                desc: 'Used for email classification and content generation',
                value: 'Claude Sonnet 4 (AWS Bedrock)',
            },
            {
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 20, height: 20 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
                label: 'Processing Mode',
                desc: 'Email classification and workflow automation mode',
                value: 'Autonomous',
                valueBg: '#eef2ff', valueColor: '#00275E',
            },
        ]
    },
];

export default function SettingsPage() {
    return (
        <div style={{ padding: '28px 32px', width: '100%', boxSizing: 'border-box', animation: 'fadeIn 0.35s ease' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', letterSpacing: -0.3 }}>Settings</h1>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>Platform configuration and integrations</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left column - first two sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {SETTINGS_DATA.slice(0, 2).map((section, i) => (
                        <div key={i}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                                {section.title}
                            </h3>
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                {section.items.map((item, ii) => (
                                    <div key={ii} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px',
                                        borderBottom: ii < section.items.length - 1 ? '1px solid #f5f5f5' : 'none',
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10, background: '#f9fafb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, color: '#6b7280',
                                        }}>{item.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                                                    background: item.valueBg || '#f3f4f6', color: item.valueColor || '#374151',
                                                    whiteSpace: 'nowrap', fontFamily: item.valueBg ? 'inherit' : 'monospace',
                                                }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right column - AI config + status info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {SETTINGS_DATA.slice(2).map((section, i) => (
                        <div key={i}>
                            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                                {section.title}
                            </h3>
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                                {section.items.map((item, ii) => (
                                    <div key={ii} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px',
                                        borderBottom: ii < section.items.length - 1 ? '1px solid #f5f5f5' : 'none',
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10, background: '#f9fafb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, color: '#6b7280',
                                        }}>{item.icon}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
                                                    background: item.valueBg || '#f3f4f6', color: item.valueColor || '#374151',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, lineHeight: 1.5 }}>{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* System Status Card */}
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                            System Status
                        </h3>
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: 20 }}>
                            {[
                                { label: 'Backend API', status: 'Running', ok: true },
                                { label: 'Email Polling', status: 'Active', ok: true },
                                { label: 'AI Service', status: 'Active', ok: true },
                                { label: 'Scheduler', status: 'Running', ok: true },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 0',
                                    borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: s.ok ? '#22c55e' : '#ef4444',
                                        }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{s.label}</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: s.ok ? '#059669' : '#ef4444', fontWeight: 600 }}>{s.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
