import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authService } from '../auth/AuthService';
import type { RegisterRequest } from '../auth/AuthService';

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

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { isMobile, isTablet } = useBreakpoint();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        role: 'Customer' as 'Customer' | 'ImportOffice' | 'Exporter',
        companyName: '',
        address: '',
        country: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const roleDescription: Record<string, string> = {
        Customer: 'Order and import products',
        ImportOffice: 'Manage shipments and handle customs',
        Exporter: 'List and sell export products',
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if ((formData.role as string) === 'ImportOffice' && !formData.companyName.trim())
            newErrors.companyName = 'Company name is required for ImportOffice';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const request: RegisterRequest = {
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                phoneNumber: formData.phoneNumber || undefined,
                role: formData.role,
                companyName: formData.companyName || undefined,
                address: formData.address || undefined,
                country: formData.country || undefined,
            };
            const response = await authService.register(request);
            if (response.message && !response.token) {
                setServerError(response.message);
                setTimeout(() => navigate('/login', { state: { message: response.message } }), 3000);
                return;
            }
            const user = {
                id: formData.email,
                email: response.email,
                fullName: response.fullName,
                role: response.role,
            };
            authService.setToken(response.token);
            login(response.token, user);
            navigate('/dashboard');
        } catch (err) {
            setServerError(err instanceof Error ? err.message : 'Registration failed');
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

    const inputErrStyle: React.CSSProperties = {
        ...inputStyle,
        borderColor: '#fecaca',
        background: '#fef2f2',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#334155',
        marginBottom: '8px',
    };

    /* ── layout decisions ── */
    const showLeftPanel = !isMobile;
    const leftPanelWidth = isTablet ? '38%' : '45%';
    const rightPadding = isMobile ? '24px' : isTablet ? '32px 40px' : '40px 48px';
    // On mobile/tablet collapse 2-col grids to 1-col
    const twoColGrid = isMobile ? '1fr' : '1fr 1fr';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>

            {/* ── MOBILE TOP BANNER ── */}
            {isMobile && (
                <div style={{
                    background: 'linear-gradient(135deg, #1a6b47 0%, #0a3d28 100%)',
                    padding: '20px 24px',
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
                    <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                    <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                    {/* Logo */}
                    <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: '700', color: 'white' }}>
                           
                            TRADE APP
                        </div>
                    </div>

                    {/* Illustration — hidden on tablet */}
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

                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                        <h2 style={{ fontSize: isTablet ? '20px' : '26px', fontWeight: '700', color: 'white', margin: '0 0 12px', lineHeight: '1.3' }}>
                            Join TRADE APP
                        </h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: '1.6' }}>
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
                justifyContent: 'flex-start',
                padding: rightPadding,
                paddingTop: isMobile ? '28px' : isTablet ? '32px' : '40px',
                background: '#ffffff',
                overflowY: 'auto',
            }}>
             

                <div style={{ width: '100%', maxWidth: isMobile ? '100%' : '440px' }}>
                    {/* Title */}
                    <h1 style={{ fontSize: isMobile ? '24px' : '30px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px', textAlign: 'center' }}>
                        Create Account
                    </h1>
                    <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', margin: '0 0 24px' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                            Sign In
                        </Link>
                    </p>

                    {/* Server Error */}
                    {serverError && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '13px' }}>
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Full Name + Email — stacks on mobile */}
                        <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    type="text" name="fullName" value={formData.fullName}
                                    onChange={handleChange} placeholder="John Doe"
                                    style={errors.fullName ? inputErrStyle : inputStyle}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = errors.fullName ? '#fecaca' : 'transparent'; e.currentTarget.style.background = errors.fullName ? '#fef2f2' : '#f0f4f8'; }}
                                />
                                {errors.fullName && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.fullName}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Email Address</label>
                                <input
                                    type="email" name="email" value={formData.email}
                                    onChange={handleChange} placeholder="you@company.com"
                                    style={errors.email ? inputErrStyle : inputStyle}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = errors.email ? '#fecaca' : 'transparent'; e.currentTarget.style.background = errors.email ? '#fef2f2' : '#f0f4f8'; }}
                                />
                                {errors.email && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.email}</p>}
                            </div>
                        </div>

                        {/* Account Type */}
                        <div>
                            <label style={labelStyle}>Account Type</label>
                            <select
                                name="role" value={formData.role} onChange={handleChange}
                                style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                                <option value="Customer">Customer — Order products</option>
                                <option value="ImportOffice">Import Office — Manage shipments</option>
                                <option value="Exporter">Exporter — Sell products</option>
                            </select>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0', fontStyle: 'italic' }}>
                                {roleDescription[formData.role]}
                            </p>
                        </div>

                        {/* Company Name (conditional) */}
                        {formData.role === 'ImportOffice' && (
                            <div>
                                <label style={labelStyle}>Company Name *</label>
                                <input
                                    type="text" name="companyName" value={formData.companyName}
                                    onChange={handleChange} placeholder="Your Company Ltd."
                                    style={errors.companyName ? inputErrStyle : inputStyle}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = errors.companyName ? '#fecaca' : 'transparent'; e.currentTarget.style.background = errors.companyName ? '#fef2f2' : '#f0f4f8'; }}
                                />
                                {errors.companyName && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.companyName}</p>}
                            </div>
                        )}

                        {/* Password + Confirm — stacks on mobile */}
                        <div style={{ display: 'grid', gridTemplateColumns: twoColGrid, gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password" name="password" value={formData.password}
                                    onChange={handleChange} placeholder="Min. 8 characters"
                                    style={errors.password ? inputErrStyle : inputStyle}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = errors.password ? '#fecaca' : 'transparent'; e.currentTarget.style.background = errors.password ? '#fef2f2' : '#f0f4f8'; }}
                                />
                                {errors.password && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.password}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <input
                                    type="password" name="confirmPassword" value={formData.confirmPassword}
                                    onChange={handleChange} placeholder="Repeat password"
                                    style={errors.confirmPassword ? inputErrStyle : inputStyle}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = errors.confirmPassword ? '#fecaca' : 'transparent'; e.currentTarget.style.background = errors.confirmPassword ? '#fef2f2' : '#f0f4f8'; }}
                                />
                                {errors.confirmPassword && <p style={{ fontSize: '12px', color: '#dc2626', margin: '4px 0 0' }}>{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={labelStyle}>
                                Phone Number{' '}
                                <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input
                                type="tel" name="phoneNumber" value={formData.phoneNumber}
                                onChange={handleChange} placeholder="+1 (555) 000-0000"
                                style={inputStyle}
                                onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#fff'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#f0f4f8'; }}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit" disabled={isLoading}
                            style={{
                                width: '100%', padding: '14px',
                                background: isLoading ? '#86efac' : '#16a34a',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '15px', fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                                marginTop: '4px',
                                minHeight: '50px',
                            }}
                            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = '#15803d'; }}
                            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = '#16a34a'; }}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Footer links */}
                    <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '16px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>
                            Login Here
                        </Link>
                    </div>

                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', paddingBottom: '24px' }}>
                        © 2024 TRADE APP GLOBAL LOGISTICS & LEDGER. ALL RIGHTS RESERVED.
                    </div>
                </div>
            </div>
        </div>
    );
};