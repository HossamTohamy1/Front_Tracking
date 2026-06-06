
import React, { useState } from 'react';
import { ImportRequestService } from '../../importRequests/ImportRequestService';
import type { ImportRequestListDto } from '../../importRequests/types/importRequests';

interface Props {
  request: ImportRequestListDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const FCLContainerDrawer: React.FC<Props> = ({ request, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    originPort: '',
    destinationPort: '',
    expectedArrival: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const approveRes = await ImportRequestService.approve(request.id, {
        originPort:      form.originPort.trim()      || undefined,
        destinationPort: form.destinationPort.trim() || undefined,
        expectedArrival: form.expectedArrival.trim() || undefined,
      });

      if (!approveRes.isSuccess) {
        setError(approveRes.message);
        return;
      }

      const hasPortInfo =
        form.originPort.trim() ||
        form.destinationPort.trim() ||
        form.expectedArrival.trim();

      onSuccess(
        `FCL request approved! A dedicated container has been created.${
          hasPortInfo
            ? ' Port details have been saved to the container.'
            : ' You can set port details later in the Containers page.'
        }`
      );
    } catch {
      setError('Failed to approve request.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 1100,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 460,
        background: '#fff',
        zIndex: 1200,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
              🚢 Approve FCL Request
            </div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
              <strong style={{ color: '#374151' }}>{request.productName}</strong>
              {' · '}{request.quantity.toLocaleString()} units
              {' · '}{request.totalWeightKg} kg
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: 'none', background: '#f3f4f6',
              cursor: 'pointer', fontSize: 15, color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 9,
              fontSize: 13, color: '#dc2626',
            }}>{error}</div>
          )}

          {/* Info banner */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>📦</span>
            <div>
              <div style={{ fontWeight: 700, color: '#14532d', fontSize: 13.5 }}>
                Full Container Load (FCL)
              </div>
              <div style={{ fontSize: 12.5, color: '#374151', marginTop: 3, lineHeight: 1.5 }}>
                A dedicated container will be automatically created for this shipment.
                Fill in the shipping route below — it will be saved directly to the container.
              </div>
            </div>
          </div>

          {/* Shipment summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            background: '#f9fafb', borderRadius: 10, padding: '14px 16px',
          }}>
            {[
              ['Product',       request.productName ?? '—'],
              ['Quantity',      `${request.quantity.toLocaleString()} units`],
              ['Total Weight',  `${request.totalWeightKg} kg`],
              ['Total Volume',  `${request.totalVolumeCbm} CBM`],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: '#111827', fontWeight: 600, marginTop: 2 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f3f4f6' }} />

          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
            Shipping Route{' '}
            <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>(Optional)</span>
          </div>

          {/* Origin Port */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Origin Port
            </label>
            <input
              style={{
                padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9,
                fontSize: 13.5, color: '#111827', outline: 'none', background: '#fff',
              }}
              value={form.originPort}
              onChange={(e) => set('originPort', e.target.value)}
              placeholder="e.g. Shanghai, China"
              onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
              onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {/* Destination Port */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Destination Port
            </label>
            <input
              style={{
                padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9,
                fontSize: 13.5, color: '#111827', outline: 'none', background: '#fff',
              }}
              value={form.destinationPort}
              onChange={(e) => set('destinationPort', e.target.value)}
              placeholder="e.g. Alexandria, Egypt"
              onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
              onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {/* Expected Arrival */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              Expected Arrival Date
            </label>
            <input
              type="date"
              style={{
                padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 9,
                fontSize: 13.5, color: '#111827', outline: 'none', background: '#fff',
              }}
              value={form.expectedArrival}
              min={today}
              onChange={(e) => set('expectedArrival', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#16a34a')}
              onBlur={(e)  => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
            💡 If port details are filled, they will be automatically saved to the container after approval.
            You can always update them later from the Containers page.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex', gap: 10,
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0',
              border: '1px solid #d1d5db', borderRadius: 9,
              background: '#fff', color: '#6b7280',
              fontSize: 13.5, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              flex: 2, padding: '10px 0',
              border: 'none', borderRadius: 9,
              background: loading ? '#9ca3af' : '#16a34a',
              color: '#fff', fontSize: 13.5, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block', width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  borderRadius: '50%', animation: 'fclSpin 0.7s linear infinite',
                }} />
                Approving…
              </>
            ) : (
              '✓ Confirm & Approve'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fclSpin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

export default FCLContainerDrawer;