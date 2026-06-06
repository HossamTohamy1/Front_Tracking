import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../auth/AuthService';
import type { LoginRequest } from '../auth/AuthService';

/* ── responsive hook ── */
function useBreakpoint() {
    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return {
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        width,
    };
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { isMobile, isTablet } = useBreakpoint();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const request: LoginRequest = { email, password };
            const response = await authService.login(request);
            const user = {
                id: email,
                email: response.email,
                fullName: response.fullName,
                role: response.role,
            };
            authService.setToken(response.token);
            login(response.token, user);
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        background: '#f0f4f8',
        border: '1.5px solid transparent',
        borderRadius: '8px',
        color: '#1a1a2e',
        outline: 'none',
        transition: 'border-color 0.2s, background 0.2s',
        boxSizing: 'border-box',
    };

    /* ── layout decisions ── */
    const showLeftPanel = !isMobile;                  // hide on phone
    const leftPanelWidth = isTablet ? '38%' : '45%'; // narrower on tablet
    const rightPadding = isMobile ? '24px' : isTablet ? '40px' : '60px 48px';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>

            {/* ── MOBILE TOP BANNER (replaces left panel) ── */}
            {isMobile && (
                <div style={{
                    background: 'linear-gradient(135deg, #1a6b47 0%, #0a3d28 100%)',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                }}>
                 
                    <span style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>TRADE APP</span>
                </div>
            )}

            {/* ── LEFT PANEL (tablet + desktop) ── */}
            {showLeftPanel && (
                <div style={{
                    width: leftPanelWidth,
                    background: 'linear-gradient(160deg, #1a6b47 0%, #0d4f34 60%, #0a3d28 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: isTablet ? '40px 32px' : '60px 48px',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}>
                    {/* decorative circles */}
                    <div style={{
                        position: 'absolute', top: '-80px', left: '-80px',
                        width: '300px', height: '300px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-60px', right: '-60px',
                        width: '250px', height: '250px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.04)',
                    }} />

                    {/* Logo */}
                    <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            fontSize: '22px', fontWeight: '700', color: 'white',
                        }}>
                         
                            TRADE APP
                        </div>
                    </div>

                    {/* Illustration — hidden on tablet to save space */}
                    {!isTablet && (
                        <div style={{ marginBottom: '40px', width: '100%', maxWidth: '320px' }}>
                            <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', opacity: 0.9 }}>
                                <rect x="40" y="185" width="240" height="8" rx="4" fill="rgba(255,255,255,0.15)" />
                                <rect x="60" y="193" width="10" height="40" rx="3" fill="rgba(255,255,255,0.1)" />
                                <rect x="250" y="193" width="10" height="40" rx="3" fill="rgba(255,255,255,0.1)" />
                                <rect x="100" y="145" width="110" height="42" rx="4" fill="rgba(255,255,255,0.12)" />
                                <rect x="104" y="148" width="102" height="36" rx="2" fill="#22c55e" opacity="0.3" />
                                <rect x="85" y="185" width="140" height="5" rx="3" fill="rgba(255,255,255,0.2)" />
                                <rect x="112" y="155" width="60" height="3" rx="2" fill="rgba(255,255,255,0.5)" />
                                <rect x="112" y="162" width="40" height="3" rx="2" fill="rgba(255,255,255,0.3)" />
                                <rect x="112" y="169" width="50" height="3" rx="2" fill="rgba(255,255,255,0.3)" />
                                <ellipse cx="160" cy="130" rx="18" ry="22" fill="rgba(255,255,255,0.15)" />
                                <circle cx="160" cy="100" r="18" fill="rgba(255,255,255,0.2)" />
                                <path d="M142 95 Q160 78 178 95" stroke="#60a5fa" strokeWidth="3" fill="none" strokeLinecap="round" />
                                <circle cx="148" cy="92" r="4" fill="#60a5fa" />
                                <circle cx="172" cy="92" r="4" fill="#60a5fa" />
                                <circle cx="155" cy="101" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
                                <circle cx="168" cy="101" r="6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
                                <line x1="161" y1="101" x2="162" y2="101" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                                <path d="M142 128 Q125 150 130 165" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" strokeLinecap="round" />
                                <path d="M178 128 Q195 150 190 165" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" strokeLinecap="round" />
                                <path d="M152 152 Q148 175 148 185" stroke="#60a5fa" strokeWidth="10" fill="none" strokeLinecap="round" />
                                <path d="M168 152 Q172 175 172 185" stroke="#60a5fa" strokeWidth="10" fill="none" strokeLinecap="round" />
                                <circle cx="220" cy="75" r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x="213" y="80" fontSize="13" fill="rgba(255,255,255,0.6)">⚙️</text>
                                <circle cx="265" cy="115" r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x="258" y="120" fontSize="13" fill="rgba(255,255,255,0.6)">✉️</text>
                                <circle cx="85" cy="95" r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x="78" y="100" fontSize="13" fill="rgba(255,255,255,0.6)">🔒</text>
                                <circle cx="255" cy="165" r="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                <text x="248" y="170" fontSize="13" fill="rgba(255,255,255,0.6)">📄</text>
                            </svg>
                        </div>
                    )}

                    {/* Text */}
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <h2 style={{
                            fontSize: isTablet ? '20px' : '26px',
                            fontWeight: '700', color: 'white',
                            margin: '0 0 12px', lineHeight: '1.3',
                        }}>
                            Welcome to TRADE APP
                        </h2>
                        <p style={{
                            fontSize: '14px', color: 'rgba(255,255,255,0.65)',
                            margin: 0, lineHeight: '1.6',
                        }}>
                            Global Logistics & Ledger —<br />all in one place.
                        </p>
                    </div>
                </div>
            )}

            {/* ── RIGHT PANEL ── */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: rightPadding,
                background: '#ffffff',
                overflowY: 'auto',
                minHeight: isMobile ? 'auto' : '100vh',
            }}>
                <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '400px' }}>
                    {/* Title */}
                    <h1 style={{
                        fontSize: isMobile ? '24px' : '30px',
                        fontWeight: '700', color: '#0f172a',
                        margin: '0 0 6px', textAlign: 'center',
                    }}>Sign In</h1>
                    <p style={{
                        fontSize: '14px', color: '#94a3b8',
                        textAlign: 'center', margin: '0 0 28px',
                    }}>
                        New here?{' '}
                        <Link to="/register" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                            Create an Account
                        </Link>
                    </p>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '12px 16px',
                            marginBottom: '20px', color: '#dc2626', fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'block', fontSize: '14px', fontWeight: '500',
                                color: '#334155', marginBottom: '8px',
                            }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f0f4f8'; }}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>Password</label>
                                <a href="/forgot-password" style={{
                                    fontSize: '13px', color: '#16a34a', textDecoration: 'none', fontWeight: '500',
                                }}>Forgot Password?</a>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ ...inputStyle, paddingRight: '44px' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f0f4f8'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#94a3b8', fontSize: '16px', padding: '0',
                                    }}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94a10.94 10.94 0 0 1-15.88 0m15.88-15.88L2.06 17.94" />
                                            <path d="M10 6a4 4 0 0 0 0 8" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 10s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z" />
                                            <circle cx="10" cy="10" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                onClick={() => setRememberMe(!rememberMe)}
                                style={{
                                    width: '42px', height: '24px', borderRadius: '12px',
                                    background: rememberMe ? '#16a34a' : '#cbd5e1',
                                    position: 'relative', cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{
                                    position: 'absolute', top: '3px',
                                    left: rememberMe ? '21px' : '3px',
                                    width: '18px', height: '18px', borderRadius: '50%',
                                    background: 'white', transition: 'left 0.2s',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }} />
                            </div>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>Remember Me</span>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            style={{
                                width: '100%', padding: '14px',
                                background: isLoading ? '#86efac' : '#16a34a',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '15px', fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s, transform 0.1s',
                                marginTop: '4px',
                                // Make tap target large enough on mobile
                                minHeight: '50px',
                            }}
                            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#15803d'; }}
                            onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#16a34a'; }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </div>

                    {isMobile && (
                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                            © 2024 TRADE APP GLOBAL LOGISTICS & LEDGER.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};