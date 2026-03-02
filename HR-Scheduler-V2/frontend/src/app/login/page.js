'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const USERS = {
    'hr@shellkode.com': { name: 'HR', role: 'hr', pass: '1234' },
    'recruiter@shellkode.com': { name: 'Recruiter', role: 'recruiter', pass: '1234' },
    'asset@shellkode.com': { name: 'Asset Manager', role: 'asset', pass: '1234' },
    'adhithya@shellkode.com': { name: 'Adhithya', role: 'employee', pass: '1234' },
};

const WELCOME_MESSAGES = {
    hr: { line1: 'Your HR command center is ready.', line2: "Let's manage your onboarding pipeline and keep things running smoothly." },
    recruiter: { line1: 'Your recruitment dashboard is ready.', line2: "Let's find and onboard the best talent for the team." },
    asset: { line1: 'Your asset management portal is ready.', line2: "Let's track, assign and manage company assets efficiently." },
    employee: { line1: 'Your onboarding portal is ready.', line2: "Let's get you set up and ready to go for your new role." },
};

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loginState, setLoginState] = useState('idle');

    const [transitioning, setTransitioning] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userName, setUserName] = useState('Admin');
    const [userRole, setUserRole] = useState('hr');
    const particlesRef = useRef(null);
    const introRef = useRef(null);
    const loginRef = useRef(null);
    const svgWrapRef = useRef(null);

    useEffect(() => {
        // Clear any previous auth state since this is a standalone isolated version
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sk_auth');
        }

        // Generate intro particles
        const pc = particlesRef.current;
        if (pc) {
            for (let i = 0; i < 25; i++) {
                const p = document.createElement('div');
                p.className = 'intro-particle';
                p.style.left = Math.random() * 100 + '%';
                p.style.top = 30 + Math.random() * 40 + '%';
                p.style.animationDelay = Math.random() * 4 + 's';
                p.style.animationDuration = (3 + Math.random() * 3) + 's';
                pc.appendChild(p);
            }
        }

        // Compress to SK at 2.6s
        const compressTimer = setTimeout(() => {
            document.querySelectorAll('.svg-collapse').forEach(el => el.classList.add('hide'));
            document.querySelectorAll('.svg-slide-s, .svg-slide-k').forEach(el => el.classList.add('compressed'));
            const wrap = svgWrapRef.current;
            if (wrap) {
                wrap.style.opacity = '1';
                wrap.style.transform = 'translateX(0) scale(1)';
                wrap.style.animation = 'none';
                wrap.offsetHeight;
                wrap.style.transition = 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                requestAnimationFrame(() => { wrap.style.transform = 'translateX(30%) scale(1)'; });
            }
        }, 2600);

        // Show login after intro
        const loginTimer = setTimeout(() => {
            if (introRef.current) introRef.current.style.display = 'none';
            if (loginRef.current) loginRef.current.classList.add('show');
            document.querySelectorAll('.bg-orb').forEach(o => o.classList.add('show'));
            const gridDots = document.querySelector('.grid-dots');
            if (gridDots) gridDots.classList.add('show');
            const powered = document.querySelector('.powered');
            if (powered) powered.classList.add('show');
        }, 6300);

        return () => { clearTimeout(compressTimer); clearTimeout(loginTimer); };
    }, [router]);

    const handleLogin = (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoginState('loading');

        setTimeout(() => {
            const user = USERS[email.toLowerCase()];
            if (user && password === user.pass) {
                setUserName(user.name);
                setUserRole(user.role);
                localStorage.setItem('sk_auth', JSON.stringify({ email, name: user.name, role: user.role, ts: Date.now() }));
                setLoginState('falling');
                setTimeout(() => {
                    setLoginState('welcome');
                }, 2000);
            } else {
                setLoginState('error');
                setErrorMsg('Invalid email or password. Please try again.');
            }
        }, 800);
    };

    // Auto-redirect after 3 seconds on welcome screen
    useEffect(() => {
        if (loginState === 'welcome') {
            const autoRedirectTimer = setTimeout(() => {
                setTransitioning(true);
                setTimeout(() => {
                    const dest = userRole === 'recruiter' ? '/recruiter' : '/dashboard';
                    router.push(dest);
                }, 900);
            }, 5000);
            return () => clearTimeout(autoRedirectTimer);
        }
    }, [loginState, router]);

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", background: '#f0f4ff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* ═══ INTRO ═══ */}
            <div id="sk-intro" ref={introRef}>
                <div className="intro-particles" ref={particlesRef}></div>
                <div className="light-sweep"></div>
                <div className="flash-bar"></div>

                <div className="intro-svg-wrap" ref={svgWrapRef}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="147.26 248.65 543.36 97.97">
                        <g>
                            {/* X chevron mark — STAYS */}
                            <g className="svg-part svg-stay">
                                <g><path fill="#00ADEF" d="M218.859,258.583l-29.872,29.87c-0.33,0.265-0.655,0.55-0.963,0.858c-2.295,2.297-3.436,5.308-3.425,8.319c-0.016,3.015,1.123,6.041,3.425,8.339c0.308,0.307,0.631,0.591,0.958,0.854l29.877,29.878c4.571,4.569,11.982,4.569,16.553,0c4.571-4.57,4.571-11.979,0-16.553l-22.506-22.507l22.506-22.505c4.571-4.571,4.571-11.98,0-16.554C230.842,254.011,223.43,254.011,218.859,258.583z" /></g>
                                <g>
                                    <path fill="#00275E" d="M165.467,343.377c-3.995,0-7.751-1.555-10.573-4.379c-5.831-5.835-5.831-15.323,0-21.152l20.207-20.206l-20.207-20.207c-2.824-2.825-4.38-6.581-4.38-10.576s1.556-7.751,4.38-10.575c2.822-2.824,6.578-4.379,10.573-4.379s7.751,1.555,10.574,4.379l29.77,29.765c0.389,0.321,0.74,0.64,1.07,0.971c2.837,2.833,4.394,6.614,4.374,10.64c0.015,3.996-1.542,7.772-4.38,10.61c-0.318,0.321-0.677,0.644-1.082,0.976l-29.752,29.754C173.218,341.822,169.462,343.377,165.467,343.377z" />
                                    <path fill="#FFFFFF" d="M165.467,255.154c2.996,0,5.991,1.142,8.276,3.427l29.885,29.881c0.327,0.265,0.646,0.546,0.949,0.851c2.302,2.298,3.442,5.317,3.428,8.331c0.011,3.011-1.127,6.027-3.428,8.326c-0.308,0.311-0.63,0.591-0.962,0.857L173.743,336.7c-2.285,2.285-5.28,3.427-8.276,3.427c-2.995,0-5.991-1.142-8.275-3.427c-4.57-4.573-4.574-11.983,0-16.557l22.505-22.503l-22.505-22.505c-4.57-4.571-4.57-11.984,0-16.554C159.476,256.296,162.472,255.154,165.467,255.154z" />
                                </g>
                                <g><rect x="185.488" y="324.612" transform="matrix(0.707 0.7072 -0.7072 0.707 290.8928 -34.6899)" fill="#00ADEF" width="3.644" height="18.176" /></g>
                                <g><rect x="179.061" y="259.757" transform="matrix(0.7072 0.707 -0.707 0.7072 240.0417 -56.4316)" fill="#00ADEF" width="18.176" height="3.644" /></g>
                            </g>
                            {/* S (gear) — STAYS */}
                            <g className="svg-part svg-stay svg-slide-s">
                                <path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M283.547,295.313c-0.208-0.429-0.402-0.871-0.572-1.313h6.371c1.716,2.379,4.589,3.537,8.75,3.537h19.759c3.603,0,9.53,1.859,12.469,8.021h-6.825c-2.275-2.25-5.123-2.354-5.644-2.354h-19.759C289.28,303.204,285.315,298.914,283.547,295.313z" />
                                <path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M332.104,314.54c0,7.046-0.143,15.64-10.687,15.64h-1.273c-4.108,0-7.657-0.025-9.166,1.469c-0.871,0.871-1.325,2.561-1.325,4.992h-5.669c-0.025-1.053-0.559-6.461-8.735-6.461c-10.635,0-13.703-2.521-13.703-11.284v-5.785h5.669v5.785c0,2.301,0.13,3.965,0.754,4.511c0.819,0.742,3.263,1.104,7.28,1.104c5.291,0,8.774,1.717,10.985,3.967c0.233-0.3,0.481-0.573,0.741-0.846c3.172-3.159,8.033-3.146,13.194-3.121h1.248c4.304,0,4.992-1.313,5.006-9.971H332.104z" />
                                <path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M332.104,281.494v5.616h-5.681v-5.616c0-2.822-0.56-4.16-5.708-4.16c-0.571,0-1.169,0.026-1.781,0.052c-3.679,0.104-8.254,0.247-11.621-2.912c-0.39-0.364-0.742-0.754-1.066-1.183c-1.65,2.327-4.057,4.043-7.436,4.043h-8.398c-0.794,0-3.198,0-3.198,6.292v0.195c0,0.377,0,0.767,0.013,1.196h-5.669c-0.013-0.429-0.013-0.832-0.013-1.196v-0.195c0-10.791,6.202-11.96,8.867-11.96h8.398c3.939,0,4.822-7.541,4.835-7.619l5.655,0.196c0.091,2.951,0.729,4.992,1.898,6.097c1.65,1.56,4.653,1.469,7.553,1.365c0.676-0.013,1.34-0.039,1.963-0.039C323.523,271.665,332.104,271.665,332.104,281.494z" />
                            </g>
                            {/* h — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M382.025,312.93c0-10.047-8.133-18.183-18.183-18.183c-9.856,0-18.185,8.517-18.185,18.183v23.923h-5.739v-71.771h5.739v32.345c4.403-5.167,10.91-8.422,18.185-8.422c13.206,0,23.924,10.717,23.924,23.925v23.923h-5.741V312.93z" /></g>
                            {/* e — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M421.258,331.113c4.974,0,9.567-2.012,12.824-5.264l4.111,3.925c-4.305,4.398-10.336,7.078-16.936,7.078c-13.206,0-23.926-10.719-23.926-23.923c0-13.208,10.72-23.925,23.926-23.925c13.202,0,23.921,10.717,23.921,23.925v2.872h-41.913C404.699,324.511,412.168,331.113,421.258,331.113z M403.266,310.059h35.883c-1.338-8.709-8.802-15.312-17.891-15.312C412.168,294.747,404.699,301.35,403.266,310.059z" /></g>
                            {/* l (first) — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M454.746,265.081h5.742v71.771h-5.742V265.081z" /></g>
                            {/* l (second) — STAYS */}
                            <g className="svg-part svg-stay svg-slide-k"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M470.055,265.081h5.742v71.771h-5.742V265.081z" /></g>
                            {/* < bracket — STAYS */}
                            <g className="svg-part svg-stay svg-slide-k"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M496.839,312.993l23.603,16.065v7.794l-35.008-23.819l35.008-24.029v7.521L496.839,312.993z" /></g>
                            {/* o — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M550.876,289.004c13.204,0,23.922,10.717,23.922,23.925c0,13.204-10.718,23.923-23.922,23.923c-13.209,0-23.927-10.719-23.927-23.923C526.949,299.722,537.667,289.004,550.876,289.004z M550.876,331.113c10.044,0,18.179-8.137,18.179-18.184s-8.135-18.183-18.179-18.183c-10.05,0-18.187,8.136-18.187,18.183S540.826,331.113,550.876,331.113z" /></g>
                            {/* d — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M632.213,336.853h-5.744v-8.324c-4.402,5.071-10.91,8.324-18.182,8.324c-13.206,0-23.924-10.719-23.924-23.923c0-13.208,10.718-23.925,23.924-23.925c7.271,0,13.779,3.254,18.182,8.422v-32.345h5.744V336.853z M608.287,294.747c-10.048,0-18.182,8.136-18.182,18.183s8.134,18.184,18.182,18.184c10.047,0,18.182-8.137,18.182-18.184C626.469,302.498,618.143,294.747,608.287,294.747z" /></g>
                            {/* e (last) — COLLAPSES */}
                            <g className="svg-part svg-collapse"><path fill="#00ADEF" stroke="#00ADEF" strokeWidth="2" strokeMiterlimit="10" d="M665.701,331.113c4.977,0,9.567-2.012,12.822-5.264l4.116,3.925c-4.306,4.398-10.337,7.078-16.938,7.078c-13.207,0-23.926-10.719-23.926-23.923c0-13.208,10.719-23.925,23.926-23.925c13.204,0,23.926,10.717,23.926,23.925v2.872h-41.919C649.146,324.511,656.61,331.113,665.701,331.113z M647.708,310.059h35.889c-1.342-8.709-8.808-15.312-17.896-15.312C656.61,294.747,649.146,301.35,647.708,310.059z" /></g>
                        </g>
                    </svg>
                </div>
                <div className="intro-subtitle">HR Scheduler</div>
            </div>

            {/* ═══ WELCOME PAGE ═══ */}
            {(loginState === 'welcome') && (
                <div className={`welcome-screen ${transitioning ? 'welcome-exit' : ''}`}>
                    <div className="welcome-top-logo">
                        <img src="/sk-logo.svg" alt="Shellkode" />
                    </div>
                    <div className="welcome-content">
                        <div className="welcome-text-block">
                            <h1 className="welcome-greeting" style={{ marginLeft: '40px' }}>
                                Hi {userName} <span style={{ display: 'inline-block', marginLeft: 6, animation: 'waveHand 1.8s 1s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span>
                            </h1>
                            <div className="welcome-brand">Welcome to Shellkode</div>
                        </div>
                        <div className="typewriter-block">
                            <p className="typewriter-line typewriter-line-1">
                                {WELCOME_MESSAGES[userRole]?.line1}
                            </p>
                            <p className="typewriter-line typewriter-line-2">
                                {WELCOME_MESSAGES[userRole]?.line2}
                            </p>
                        </div>
                        <div className="welcome-loader">
                            <div className="welcome-loader-bar"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ LOGIN ═══ */}
            <div className="bg-orb"></div>
            <div className="bg-orb"></div>
            <div className="grid-dots"></div>

            <div id="sk-login" ref={loginRef} className={`${loginState === 'falling' ? 'login-falling' : ''} ${loginState === 'welcome' ? 'login-hidden' : ''}`}>
                <div className="login-card">
                    <div className={`card-brand ${loginState === 'falling' ? 'logo-falling' : ''}`}>
                        {loginState === 'falling' ? (
                            <div className="falling-letters">
                                {'Shellkode'.split('').map((letter, i) => (
                                    <span key={i} className="fall-letter" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                                        {letter}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <>
                                <img className="card-logo-img" src="/sk-logo.svg" alt="Shellkode" />
                                <p className="card-subtitle">Sign in to your workspace</p>
                            </>
                        )}
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrap">
                                <input type="email" id="email" placeholder="username@shellkode.com" autoComplete="email"
                                    value={email} onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); setLoginState('idle'); }} />
                                <svg className="icon" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M2 7l10 7 10-7" /></svg>
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrap">
                                <input type={showPassword ? 'text' : 'password'} id="password" placeholder="Enter your password"
                                    autoComplete="current-password" value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); setLoginState('idle'); }} />
                                <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                <svg className="toggle-pass" viewBox="0 0 24 24" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <><path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.1" /><line x1="1" y1="1" x2="23" y2="23" /></>
                                    ) : (
                                        <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                                    )}
                                </svg>
                            </div>
                        </div>

                        {loginState === 'error' && (
                            <div className="login-error">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {errorMsg}
                            </div>
                        )}

                        <div className="options-row">
                            <label className="remember"><input type="checkbox" /> Remember me</label>
                            <a href="#" className="forgot">Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-login" disabled={loginState === 'loading'}>
                            {loginState === 'loading' ? <span className="btn-spinner"></span> : 'Sign In →'}
                        </button>

                        <div className="divider"><span>or continue with</span></div>

                        <div className="social-row">
                            <button type="button" className="btn-social">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 01-2 3.1v2.5h3.3c1.9-1.7 3-4.3 3-7.4z" fill="#4285F4" />
                                    <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.5c-.9.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1H3.1v2.6A10 10 0 0012 22z" fill="#34A853" />
                                    <path d="M6.5 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A10 10 0 002 12c0 1.6.4 3.1 1.1 4.6L6.5 14z" fill="#FBBC05" />
                                    <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0012 2 10 10 0 003.1 7.4L6.5 10c.8-2.4 3-4.1 5.5-4.1z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                        </div>
                    </form>

                    <p className="form-footer">
                        Admin access only • <a href="#" onClick={(e) => { e.preventDefault(); }}>Contact IT</a>
                    </p>
                </div>
            </div>

            <div className="powered">Powered by <span>Shellkode</span></div>
        </div>
    );
}
