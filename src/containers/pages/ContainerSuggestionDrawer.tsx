// ContainerSuggestionDrawer.tsx
import React, { useState, useEffect } from 'react';
import { ContainerService } from '../ContainerService';
import type { ContainerSuggestionDto } from '../ContainerService';
import { ImportRequestService } from '../../importRequests/ImportRequestService';

interface Props {
  requestId: string;
  requestWeight: number;
  requestVolume: number;
  productName?: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const ContainerSuggestionDrawer: React.FC<Props> = ({
  requestId, requestWeight, requestVolume, productName, onClose, onSuccess,
}) => {
  const [suggestions, setSuggestions]   = useState<ContainerSuggestionDto[]>([]);
  const [selected, setSelected]         = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [assigning, setAssigning]       = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    ContainerService.getContainerSuggestions(requestId)
      .then((res) => {
        if (res.isSuccess) setSuggestions(res.data ?? []);
        else setError(res.message);
      })
      .catch(() => setError('Failed to load container suggestions.'))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAssignAndApprove = async () => {
    if (!selected) { setError('Please select a container.'); return; }
    setAssigning(true);
    setError('');
    try {
      // 1. Approve first
      const approveRes = await ImportRequestService.approve(requestId);
      if (!approveRes.isSuccess) { setError(approveRes.message); return; }

      // 2. Assign container
      const assignRes = await ContainerService.assignContainer(requestId, selected);
      if (!assignRes.isSuccess) { setError(assignRes.message); return; }

      onSuccess('Request approved and assigned to container successfully.');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setAssigning(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#6b7280';

  const utilBar = (pct: number) => {
    const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';
    return (
      <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 2 }} />
      </div>
    );
  };

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
        width: '100%', maxWidth: 480,
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
              Assign Container
            </div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 3 }}>
              {productName && <><strong style={{ color: '#374151' }}>{productName}</strong> · </>}
              {requestWeight} kg · {requestVolume} CBM
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && (
            <div style={{
              padding: '10px 14px', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 9,
              fontSize: 13, color: '#dc2626',
            }}>{error}</div>
          )}

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 16,
              }}>
                {[80, 55, 40].map((w, j) => (
                  <div key={j} style={{
                    height: 12, borderRadius: 6, marginBottom: 8,
                    background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'drawerSkeleton 1.4s infinite',
                    width: `${w}%`,
                  }} />
                ))}
              </div>
            ))
          ) : suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🚢</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No containers available</div>
              <div style={{ fontSize: 13 }}>
                No open LCL containers with enough capacity.<br />
                Create a new container first, then approve.
              </div>
            </div>
          ) : (
            suggestions.map((s) => {
              const isSelected = selected === s.containerId;
              return (
                <div
                  key={s.containerId}
                  onClick={() => setSelected(s.containerId)}
                  style={{
                    border: isSelected ? '2px solid #16a34a' : '1.5px solid #e5e7eb',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    position: 'relative',
                    background: isSelected ? '#f0fdf4' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {/* Best match badge */}
                  {s.isBestMatch && (
                    <div style={{
                      position: 'absolute', top: -10, left: 12,
                      background: '#16a34a', color: '#fff',
                      fontSize: 10.5, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                      letterSpacing: '0.04em',
                    }}>
                      ★ BEST MATCH
                    </div>
                  )}

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {s.containerNumber}
                      </span>
                      {s.destinationPort && (
                        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                          → {s.destinationPort}
                        </span>
                      )}
                    </div>
                    {/* Score ring */}
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: `3px solid ${scoreColor(s.score)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: scoreColor(s.score),
                      flexShrink: 0,
                    }}>
                      {s.score}
                    </div>
                  </div>

                  {/* Utilization after */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Weight after
                      </div>
                      <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 600, marginTop: 2 }}>
                        {(s.currentWeightKg + requestWeight).toFixed(1)} / {s.maxWeightKg} kg
                      </div>
                      {utilBar(s.weightUtilizationAfter)}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.weightUtilizationAfter}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Volume after
                      </div>
                      <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 600, marginTop: 2 }}>
                        {(s.currentVolumeCbm + requestVolume).toFixed(2)} / {s.maxVolumeCbm} CBM
                      </div>
                      {utilBar(s.volumeUtilizationAfter)}
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.volumeUtilizationAfter}%</div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{
                    display: 'flex', gap: 12, fontSize: 12, color: '#6b7280',
                    borderTop: '1px solid #f3f4f6', paddingTop: 8,
                  }}>
                    <span>📦 {s.itemCount} items</span>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      ${s.totalShippingCost.toLocaleString()} shipping
                    </span>
                    {s.originPort && <span>From: {s.originPort}</span>}
                  </div>

                  {/* Selected check */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#16a34a', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex', gap: 10, flexDirection: 'column',
        }}>
          {selected && (() => {
            const s = suggestions.find(x => x.containerId === selected);
            return s ? (
              <div style={{
                padding: '8px 12px', background: '#f0fdf4',
                border: '1px solid #bbf7d0', borderRadius: 8,
                fontSize: 12.5, color: '#166534',
              }}>
                Selected: <strong>{s.containerNumber}</strong> · Score {s.score}/100
              </div>
            ) : null;
          })()}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={assigning}
              style={{
                flex: 1, padding: '10px 0',
                border: '1px solid #d1d5db', borderRadius: 9,
                background: '#fff', color: '#6b7280',
                fontSize: 13.5, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignAndApprove}
              disabled={!selected || assigning || loading}
              style={{
                flex: 2, padding: '10px 0',
                border: 'none', borderRadius: 9,
                background: !selected || assigning ? '#9ca3af' : '#16a34a',
                color: '#fff', fontSize: 13.5, fontWeight: 600,
                cursor: !selected || assigning ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {assigning ? 'Processing…' : '✓ Assign & Approve'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes drawerSkeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
};

export default ContainerSuggestionDrawer;