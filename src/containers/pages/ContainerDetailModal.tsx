import React, { useState } from 'react';
import { ContainerService } from '../ContainerService';
import type { ContainerDto } from '../types/containers';
import { CONTAINER_STATUS } from '../types/containers';
import './ContainersPage.css';

interface Props {
  container: ContainerDto;
  role: string;
  onClose: () => void;
  onAction: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}


const StatusBadge: React.FC<{ status: number }> = ({ status }) => {
  const name = CONTAINER_STATUS[status as keyof typeof CONTAINER_STATUS] ?? 'Unknown';
  const cls: Record<string, string> = {
    Open: 'cn-badge--open', Closed: 'cn-badge--closed',
    Shipped: 'cn-badge--shipped', InCustoms: 'cn-badge--incustoms',
    Delivered: 'cn-badge--delivered',
  };
  return (
    <span className={`cn-badge ${cls[name] ?? ''}`}>
      <span className="cn-badge__dot" />{name}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="cn-progress">
      <div className="cn-progress__bar">
        <div className="cn-progress__fill" style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a' }} />
      </div>
      <div className="cn-progress__label">{label} — {pct.toFixed(1)}%</div>
    </div>
  );
};

const ContainerDetailModal: React.FC<Props> = ({ container, role, onClose, onAction, showToast }) => {
  const isOffice = role === 'ImportOffice';
  const isAdmin  = role === 'Admin';
  const isSupport = role === 'Support';

  const [tab, setTab]       = useState<'info' | 'items'>('info');
  const [loading, setLoading] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const act = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    try { await fn(); }
    finally { setLoading(null); }
  };

  const handleClose = () => act('close', async () => {
    const res = await ContainerService.close(container.id);
    if (res.isSuccess) { showToast('Container closed.'); onAction(); }
    else showToast(res.message, 'error');
  });

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      const res = await ContainerService.removeItem(container.id, itemId);
      if (res.isSuccess) { showToast('Item removed.'); onAction(); }
      else showToast(res.message, 'error');
    } finally { setRemovingId(null); }
  };

  const fmt = (v?: string | null) => v ? new Date(v).toLocaleDateString() : '—';

  return (
    <div className="cn-modal-overlay" onClick={onClose}>
      <div className="cn-modal cn-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="cn-modal__header">
          <div>
            <h2 className="cn-modal__title">{container.containerNumber}</h2>
            <div style={{ marginTop: 4 }}><StatusBadge status={container.status} /></div>
          </div>
          <button className="cn-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f3f4f6' }}>
          {(['info', 'items'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none',
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? '#16a34a' : '#6b7280',
                borderBottom: tab === t ? '2px solid #16a34a' : '2px solid transparent',
                cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
              }}
            >
              {t === 'items' ? `Items (${container.items?.length ?? 0})` : 'Info'}
            </button>
          ))}
        </div>

        <div className="cn-modal__body">
          {tab === 'info' && (
            <>
              {/* Utilization */}
              <div className="cn-util-row">
                <div className="cn-util-block">
                  <div className="cn-util-block__label">Volume Used</div>
                  <div className="cn-util-block__value">{container.currentVolumeCbm} / {container.maxVolumeCbm} CBM</div>
                  <ProgressBar value={container.volumeUtilizationPercent} label="Volume" />
                </div>
                <div className="cn-util-block">
                  <div className="cn-util-block__label">Weight Used</div>
                  <div className="cn-util-block__value">{container.currentWeightKg} / {container.maxWeightKg} kg</div>
                  <ProgressBar value={container.weightUtilizationPercent} label="Weight" />
                </div>
              </div>

              <hr className="cn-divider" />

              {/* Details grid */}
              <div className="cn-detail-grid">
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Managed By</div>
                  <div className="cn-detail-item__value">{container.managedByOfficeName || '—'}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Shipping Cost</div>
                  <div className="cn-detail-item__value">${container.totalShippingCost.toLocaleString()}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Origin Port</div>
                  <div className="cn-detail-item__value">{container.originPort || '—'}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Destination Port</div>
                  <div className="cn-detail-item__value">{container.destinationPort || '—'}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Expected Arrival</div>
                  <div className="cn-detail-item__value">{fmt(container.expectedArrival)}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Shipped At</div>
                  <div className="cn-detail-item__value">{fmt(container.shippedAt)}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Delivered At</div>
                  <div className="cn-detail-item__value">{fmt(container.deliveredAt)}</div>
                </div>
                <div className="cn-detail-item">
                  <div className="cn-detail-item__label">Created At</div>
                  <div className="cn-detail-item__value">{fmt(container.createdAt)}</div>
                </div>
              </div>


              {/* Actions */}
              {(isOffice || isAdmin || isSupport) && (
                <>
                  {/* Close container */}
                  {isOffice && container.status === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        className="cn-btn cn-btn--close"
                        disabled={loading === 'close'}
                        onClick={handleClose}
                        style={{ padding: '8px 16px' }}
                      >
                        {loading === 'close' ? 'Closing…' : '🔒 Close Container'}
                      </button>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>No more items can be added after closing</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {tab === 'items' && (
            <>
              {(!container.items || container.items.length === 0) ? (
                <div className="cn-empty">
                  <div className="cn-empty__icon">📦</div>
                  <p className="cn-empty__text">No items in this container yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="cn-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Request ID</th>
                        <th>Weight (kg)</th>
                        <th>Volume (CBM)</th>
                        <th>Cost Share</th>
                        {(isOffice || isAdmin) ? <th>Action</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {container.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.requestNumber || item.importRequestId.slice(0, 8)}…</td>
                          <td>{item.weightKg}</td>
                          <td>{item.volumeCbm}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>${item.costShare.toFixed(2)}</td>
                          {(isOffice || isAdmin) ? (
                            <td>
                              <button
                                className="cn-btn cn-btn--delete"
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                disabled={removingId === item.id}
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                {removingId === item.id ? '…' : 'Remove'}
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="cn-modal__footer">
          <button className="cn-btn cn-btn--cancel-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ContainerDetailModal;