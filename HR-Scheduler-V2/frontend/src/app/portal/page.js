'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { portalLogin } from '@/lib/api';

export default function PortalLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const emp = await portalLogin(email, password);
            localStorage.setItem('portal_employee', JSON.stringify(emp));
            if (emp.portal_onboarding_complete) {
                router.push('/portal/dashboard');
            } else {
                router.push('/portal/onboarding');
            }
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        }
        setLoading(false);
    }

    return (
        <div style={{
            fontFamily: "'Inter', sans-serif", background: '#f0f4ff', height: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
            {/* Background orbs — matching main login */}
            <div style={{
                position: 'absolute', width: 320, height: 320, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,173,239,0.06) 0%, transparent 70%)',
                top: '10%', left: '15%', filter: 'blur(40px)',
            }} />
            <div style={{
                position: 'absolute', width: 260, height: 260, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,39,94,0.05) 0%, transparent 70%)',
                bottom: '15%', right: '20%', filter: 'blur(40px)',
            }} />

            {/* Login Card — matching main login style */}
            <div style={{
                width: 380, background: '#fff', borderRadius: 24, padding: '40px 36px',
                boxShadow: '0 12px 48px rgba(0,39,94,0.08), 0 2px 8px rgba(0,39,94,0.04)',
                border: '1px solid #e8ecf4', position: 'relative', zIndex: 1,
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <img src="/sk-icon.svg" alt="SK" style={{ width: 48, height: 48, marginBottom: 12 }} />
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#00275E', margin: '0 0 4px' }}>
                        Employee Portal
                    </h1>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        Sign in to your workspace
                    </p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Email
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="email" value={email}
                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                placeholder="name@shellkode.com" required autoComplete="email"
                                style={{
                                    width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
                                    border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
                                    outline: 'none', fontFamily: "'Inter', sans-serif",
                                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                                    background: '#f8fafc',
                                }}
                                onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                                <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" />
                            </svg>
                        </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'} value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                placeholder="Enter your password" required autoComplete="current-password"
                                style={{
                                    width: '100%', padding: '11px 40px 11px 40px', borderRadius: 10,
                                    border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b',
                                    outline: 'none', fontFamily: "'Inter', sans-serif",
                                    boxSizing: 'border-box', transition: 'border-color 0.2s',
                                    background: '#f8fafc',
                                }}
                                onFocus={e => e.target.style.borderColor = '#00ADEF'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                                <rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <><path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.1" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                ) : (
                                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                )}
                            </svg>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                            borderRadius: 10, marginBottom: 16,
                            background: '#fef2f2', border: '1px solid #fecaca',
                            fontSize: 12, color: '#dc2626', fontWeight: 500,
                        }}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                        background: loading ? '#94a3b8' : '#00275E',
                        color: '#fff', fontSize: 14, fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 14px rgba(0,39,94,0.15)',
                    }}>
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                {/* Demo hint */}
                <div style={{
                    marginTop: 20, padding: '10px 14px', borderRadius: 10,
                    background: '#f0f4ff', border: '1px solid #e2e8f0',
                    fontSize: 11, color: '#64748b', textAlign: 'center',
                }}>
                    <span style={{ fontWeight: 600, color: '#00ADEF' }}>Demo: </span>
                    priya.sharma@shellkode.com / welcome123
                </div>

                <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16, marginBottom: 0 }}>
                    Employee access only • <a href="/login" style={{ color: '#00ADEF', textDecoration: 'none', fontWeight: 600 }}>Admin Login</a>
                </p>
            </div>

            <div style={{
                position: 'fixed', bottom: 16, fontSize: 11, color: '#94a3b8',
                fontFamily: "'Inter', sans-serif",
            }}>
                Powered by <span style={{ fontWeight: 700, color: '#00275E' }}>Shellkode</span>
            </div>
        </div>
    );
}
