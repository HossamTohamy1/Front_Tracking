

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PaymentService } from './PaymentService';
import type { CostCalculationDto } from '../costCalculations/types/costCalculations';

// ── Stripe singleton init ────────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

// ── Inner checkout form (must live inside <Elements>) ────────────────────────
interface CheckoutFormProps {
  calc: CostCalculationDto;
  paymentId: string;
  onSuccess: () => void;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  calc,
  paymentId,
  onSuccess,
  onClose,
  showToast,
}) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg('');

    // ── Return URL للـ 3DS redirects (في حالة الدفع اللي يحتاج redirect) ──
    const returnUrl =
      `${window.location.origin}/payment-success` +
      `?paymentId=${paymentId}` +
      `&amount=${calc.finalAmount}` +
      `&currency=${calc.currency}` +
      `&requestNum=${calc.requestNumber ?? calc.importRequestId.slice(0, 8)}`;

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      // Stays on page for simple card payments; redirects only when required
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message ?? 'Payment failed. Please try again.');
      showToast(error.message ?? 'Payment failed. Please try again.', 'error');
      setSubmitting(false);
    } else if (paymentIntent?.status === 'succeeded') {
      // ✅ Inline payment succeeded (no redirect needed)
      showToast('Payment successful! Your shipment is being processed.', 'success');
      
      // Navigate to success page with query params
      navigate(
        `/payment-success?paymentId=${paymentId}` +
        `&amount=${calc.finalAmount}` +
        `&currency=${calc.currency}` +
        `&requestNum=${calc.requestNumber ?? calc.importRequestId.slice(0, 8)}`
      );
      
      // Trigger parent callback
      onSuccess();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Amount summary */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Amount Due
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#15803d', marginTop: 2 }}>
            {fmt(calc.finalAmount, calc.currency)}
          </div>
          {calc.discountAmount > 0 && (
            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
              You saved {fmt(calc.discountAmount, calc.currency)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
          <div>
            Request #{calc.requestNumber ?? calc.importRequestId.slice(0, 8) + '…'}
          </div>
          <div style={{ marginTop: 4 }}>{calc.weightKg} kg · {calc.volumeCbm} CBM</div>
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
          Payment Details
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultValues: { billingDetails: { address: { country: 'EG' } } },
          }}
        />
      </div>

      {/* Error message */}
      {errorMsg && (
        <div style={{
          padding: '10px 14px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 9,
          fontSize: 13,
          color: '#dc2626',
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Security note */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#9ca3af',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Secured by Stripe · SSL encrypted · We never store your card details
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            flex: 1,
            padding: '11px 0',
            border: '1px solid #d1d5db',
            borderRadius: 10,
            background: '#fff',
            color: '#6b7280',
            fontSize: 14,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !stripe || !elements}
          style={{
            flex: 2,
            padding: '11px 0',
            border: 'none',
            borderRadius: 10,
            background: submitting || !stripe ? '#9ca3af' : '#16a34a',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting || !stripe ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!submitting && stripe && elements) {
              e.currentTarget.style.background = '#15803d';
            }
          }}
          onMouseLeave={(e) => {
            if (!submitting && stripe && elements) {
              e.currentTarget.style.background = '#16a34a';
            }
          }}
        >
          {submitting ? (
            <>
              <span style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'pmSpin 0.7s linear infinite',
              }} />
              Processing…
            </>
          ) : (
            `Pay ${fmt(calc.finalAmount, calc.currency)}`
          )}
        </button>
      </div>

      <style>{`@keyframes pmSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Main PaymentModal ────────────────────────────────────────────────────────

interface Props {
  calc: CostCalculationDto;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const PaymentModal: React.FC<Props> = ({ calc, onClose, onSuccess, showToast }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await PaymentService.createPaymentIntent({
          importRequestId: calc.importRequestId,
          currency: calc.currency,
        });

        if (cancelled) return;

        if (res.isSuccess && res.data?.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setPaymentId(res.data.paymentId);
        } else {
          setInitError(res.message || 'Failed to initialize payment. Please try again.');
        }
      } catch (err: any) {
        if (!cancelled) {
          // ── FIX: surface backend error message if available ──
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Network error. Please check your connection.';
          setInitError(msg);
          showToast(msg, 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Cleanup: don't update state if modal unmounts before fetch completes
    return () => { cancelled = true; };
  }, [calc.importRequestId, calc.currency, showToast]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
              Complete Payment
            </div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
              Shipping cost for your import request
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30,
              borderRadius: 8,
              border: 'none',
              background: '#f3f4f6',
              cursor: 'pointer',
              fontSize: 15,
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[60, 100, 45, 30].map((w, i) => (
                <div key={i} style={{
                  height: i === 1 ? 120 : 16,
                  width: `${w}%`,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'pmSkeleton 1.4s infinite',
                }} />
              ))}
              <style>{`@keyframes pmSkeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
            </div>
          )}

          {/* Init error */}
          {!loading && initError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                fontSize: 13,
                color: '#dc2626',
              }}>
                ⚠️ {initError}
              </div>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 0',
                  border: '1px solid #d1d5db',
                  borderRadius: 9,
                  background: '#fff',
                  color: '#6b7280',
                  fontSize: 13.5,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* Stripe Elements — only render when clientSecret is ready */}
          {!loading && !initError && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#16a34a',
                    colorBackground: '#ffffff',
                    colorText: '#111827',
                    colorDanger: '#dc2626',
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    borderRadius: '9px',
                  },
                },
              }}
            >
              <CheckoutForm
                calc={calc}
                paymentId={paymentId}
                onSuccess={onSuccess}
                onClose={onClose}
                showToast={showToast}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;