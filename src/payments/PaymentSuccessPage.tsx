import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [isVisible, setIsVisible] = useState(false);

  const paymentId  = searchParams.get('paymentId')  ?? '—';
  const currency   = searchParams.get('currency')   ?? 'USD';
  const amount     = Number(searchParams.get('amount') ?? 0);
  const requestNum = searchParams.get('requestNum') ?? '—';

  const fmt = (v: number, cur = currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(v);

  // Show animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Countdown ثم navigate للـ dashboard
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/dashboard');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
      padding: 16,
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Checkmark circle with animation */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#f0fdf4',
          border: '2px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: isVisible ? 'psScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards' : 'none',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.5)',
        }}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="#16a34a" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              animation: isVisible ? 'psCheckmark 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards' : 'none',
              opacity: 0,
            }}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>

        {/* Title with stagger animation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 22, 
            fontWeight: 700, 
            color: '#111827',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
          }}>
            Payment Successful!
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: 14, 
            color: '#6b7280', 
            lineHeight: 1.6,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
          }}>
            Your payment has been processed and your shipment is now being prepared.
          </p>
        </div>

        {/* Details card with animation */}
        <div style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 14,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
        }}>
          {[
            { label: 'Amount Paid', value: fmt(amount), color: '#16a34a', emoji: '💰' },
            { label: 'Request',     value: `#${requestNum}`,  color: '#111827', emoji: '📦' },
            { label: 'Payment ID',  value: paymentId.slice(0, 16) + (paymentId.length > 16 ? '…' : ''), color: '#6b7280', emoji: '🆔' },
            { label: 'Status',      value: 'Completed',       color: '#16a34a', emoji: '✅' },
          ].map(({ label, value, color, emoji }) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13.5,
              paddingBottom: 10,
              borderBottom: label !== 'Status' ? '1px solid #e5e7eb' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span style={{ color: '#9ca3af', fontWeight: 500 }}>{label}</span>
              </div>
              <span style={{ 
                color, 
                fontWeight: 600, 
                fontFamily: label === 'Request' || label === 'Payment ID' ? 'monospace' : 'inherit',
                wordBreak: 'break-all',
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: '#f3f4f6' }} />

        {/* Countdown with pulse animation */}
        <p style={{ 
          margin: 0, 
          fontSize: 13, 
          color: '#9ca3af',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
        }}>
          Redirecting to dashboard in{' '}
          <span style={{ 
            color: '#16a34a', 
            fontWeight: 700,
            animation: 'psPulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            display: 'inline-block',
            minWidth: 20,
          }}>
            {countdown}s
          </span>…
        </p>

        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: 10, 
          width: '100%',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.7s',
        }}>
          <button
            onClick={() => navigate('/cost-calculations')}
            style={{
              flex: 1,
              padding: '11px 0',
              border: '1px solid #d1d5db',
              borderRadius: 10,
              background: '#fff',
              color: '#6b7280',
              fontSize: 13.5,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.background = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.background = '#fff';
            }}
          >
            💳 My Payments
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 2,
              padding: '11px 0',
              border: 'none',
              borderRadius: 10,
              background: '#16a34a',
              color: '#fff',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#15803d';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#16a34a';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🎉 Go to Dashboard
          </button>
        </div>

      </div>

      {/* Global animations */}
      <style>{`
        @keyframes psScale {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes psCheckmark {
          from {
            opacity: 0;
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
          }
          to {
            opacity: 1;
            stroke-dasharray: 50;
            stroke-dashoffset: 0;
          }
        }

        @keyframes psPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;