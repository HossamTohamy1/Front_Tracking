import React, { useState, useEffect, useCallback } from 'react';
import {
  TrackingService,
  type TrackingDto,
  type TrackingHistoryDto,
  type UpdateStageRequestDto,
  type UpdateCarrierInfoDto,
} from '../Trackingservice';
import { useAuth } from '../../auth/AuthContext';
import './TrackingPage.css';

// ── ImportRequestListDto ──────────────────────────────────────────────────────
// عدّل الـ fields دي حسب الـ DTO الحقيقي بتاعك من الـ backend
export interface ImportRequestListDto {
  id: string;
  status: string;
  createdAt: string;
  customerFullName?: string;   // اسم العميل — عدّله لو الـ field بتاعك مختلف
  userName?: string;           // fallback
  userEmail?: string;
}

// ── Import Requests Service calls ─────────────────────────────────────────────
// عدّل الـ base URL حسب الـ API بتاعك
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const ImportRequestService = {
  /** Office — يجيب الـ requests المسندة للـ office ده فقط */
  getOfficeRequests: async (status?: string): Promise<{ isSuccess: boolean; data?: ImportRequestListDto[]; message: string }> => {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/api/import-requests/office${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return res.json();
  },

  /** Customer — يجيب requests العميل بس */
  getMyRequests: async (status?: string): Promise<{ isSuccess: boolean; data?: ImportRequestListDto[]; message: string }> => {
    const params = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/api/import-requests/my${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return res.json();
  },
};

// ── Shipment Stages (ordered) ─────────────────────────────────────────────────
const STAGES = [
  { value: 'Purchased',      label: 'Purchased',        icon: '🛒' },
  { value: 'Processing',     label: 'Processing',       icon: '⚙️' },
  { value: 'ReadyToShip',    label: 'Ready to Ship',    icon: '📦' },
  { value: 'Shipped',        label: 'Shipped',          icon: '🚢' },
  { value: 'InTransit',      label: 'In Transit',       icon: '🌊' },
  { value: 'ArrivedPort',    label: 'Arrived at Port',  icon: '⚓' },
  { value: 'Customs',        label: 'Customs',          icon: '🏛️' },
  { value: 'OutForDelivery', label: 'Out for Delivery', icon: '🚚' },
  { value: 'Delivered',      label: 'Delivered',        icon: '✅' },
  { value: 'Exception',      label: 'Exception',        icon: '⚠️' },
];

// Valid next transitions — mirrors backend _allowedTransitions
const ALLOWED_NEXT: Record<string, string[]> = {
  Purchased:      ['Processing', 'Exception'],
  Processing:     ['ReadyToShip', 'Exception'],
  ReadyToShip:    ['Shipped', 'Exception'],
  Shipped:        ['InTransit', 'Exception'],
  InTransit:      ['ArrivedPort', 'Exception'],
  ArrivedPort:    ['Customs', 'Exception'],
  Customs:        ['OutForDelivery', 'Exception'],
  OutForDelivery: ['Delivered', 'Exception'],
  Delivered:      [],
  Exception:      ['Processing', 'ReadyToShip', 'Shipped', 'InTransit', 'ArrivedPort', 'Customs', 'OutForDelivery', 'Exception'],
};

const STAGE_FILTERS = [
  { label: 'All',        value: '' },
  { label: 'Active',     value: '__active__' },
  { label: 'In Transit', value: 'InTransit' },
  { label: 'Customs',    value: 'Customs' },
  { label: 'Delivered',  value: 'Delivered' },
  { label: 'Exception',  value: 'Exception' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const badgeClass = (stage: string) =>
  `tr-badge tr-badge--${stage.toLowerCase().replace(/ /g, '')}`;

const StageBadge: React.FC<{ stage: string }> = ({ stage }) => {
  const label = STAGES.find((s) => s.value === stage)?.label ?? stage;
  return (
    <span className={badgeClass(stage)}>
      <span className="tr-badge__dot" />
      {label}
    </span>
  );
};

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtTime = (v?: string | null) =>
  v ? new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 6 }).map((__, j) => (
          <td key={j}><div className="tr-skeleton" style={{ width: j === 5 ? 130 : '75%' }} /></td>
        ))}
      </tr>
    ))}
  </>
);

const SkeletonCards: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="tr-mobile-card" style={{ cursor: 'default', pointerEvents: 'none' }}>
        <div className="tr-skeleton" style={{ width: '55%', height: 15, marginBottom: 8 }} />
        <div className="tr-skeleton" style={{ width: '35%', height: 22, marginBottom: 10, borderRadius: 20 }} />
        <div className="tr-skeleton" style={{ width: '70%', height: 12, marginBottom: 5 }} />
        <div className="tr-skeleton" style={{ width: '45%', height: 12 }} />
      </div>
    ))}
  </>
);

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: 12, height: 12,
    border: '2px solid rgba(22,163,74,0.25)', borderTopColor: '#16a34a',
    borderRadius: '50%', animation: 'trSpin 0.7s linear infinite', verticalAlign: 'middle',
  }} />
);

// ── Tracking Detail Modal ─────────────────────────────────────────────────────
interface DetailModalProps {
  tracking: TrackingDto;
  history: TrackingHistoryDto[];
  historyLoading: boolean;
  onClose: () => void;
}

const TrackingDetailModal: React.FC<DetailModalProps> = ({
  tracking, history, historyLoading, onClose,
}) => {
  const currentIdx = STAGES.findIndex((s) => s.value === tracking.currentStage);

  return (
    <div className="tr-modal-overlay" onClick={onClose}>
      <div className="tr-modal tr-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__header">
          <h2 className="tr-modal__title">Shipment Tracking</h2>
          <button className="tr-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="tr-modal__body">
          <StageBadge stage={tracking.currentStage} />

          <p className="tr-section-heading">Shipment Info</p>
          <div className="tr-detail-grid">
            {tracking.trackingNumber && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Tracking #</span>
                <span className="tr-detail-value" style={{ fontFamily: 'monospace' }}>{tracking.trackingNumber}</span>
              </div>
            )}
            {tracking.carrierName && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Carrier</span>
                <span className="tr-detail-value">{tracking.carrierName}</span>
              </div>
            )}
            {tracking.currentLocation && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Current Location</span>
                <span className="tr-detail-value">📍 {tracking.currentLocation}</span>
              </div>
            )}
            {tracking.estimatedDeliveryDate && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Est. Delivery</span>
                <span className="tr-detail-value">📅 {fmtDate(tracking.estimatedDeliveryDate)}</span>
              </div>
            )}
            {tracking.shippedAt && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Shipped At</span>
                <span className="tr-detail-value">{fmtDate(tracking.shippedAt)}</span>
              </div>
            )}
            {tracking.deliveredAt && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Delivered At</span>
                <span className="tr-detail-value">{fmtDate(tracking.deliveredAt)}</span>
              </div>
            )}
          </div>

          <p className="tr-section-heading">Stage Progress</p>
          <div className="tr-timeline">
            {STAGES.filter((s) => s.value !== 'Exception').map((stage, i) => {
              const isActive  = i <= currentIdx && tracking.currentStage !== 'Exception';
              const isCurrent = stage.value === tracking.currentStage;
              return (
                <div key={stage.value} className="tr-timeline-step">
                  <div className="tr-timeline-step__line">
                    <div
                      className={`tr-timeline-step__dot${isActive ? ' tr-timeline-step__dot--active' : ''}`}
                      style={isCurrent ? { boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' } : undefined}
                    />
                    {i < STAGES.filter((s) => s.value !== 'Exception').length - 1 && (
                      <div className="tr-timeline-step__connector" />
                    )}
                  </div>
                  <div className="tr-timeline-step__content">
                    <span
                      className="tr-timeline-step__stage"
                      style={{ color: isActive ? '#14532d' : '#9ca3af', fontWeight: isActive ? 600 : 400 }}
                    >
                      {stage.icon} {stage.label}
                      {isCurrent && (
                        <span style={{ marginLeft: 6, fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                          Current
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
            {tracking.currentStage === 'Exception' && (
              <div className="tr-timeline-step">
                <div className="tr-timeline-step__line">
                  <div className="tr-timeline-step__dot tr-timeline-step__dot--active" style={{ borderColor: '#dc2626', background: '#dc2626' }} />
                </div>
                <div className="tr-timeline-step__content">
                  <span className="tr-timeline-step__stage" style={{ color: '#dc2626' }}>
                    ⚠️ Exception
                    <span style={{ marginLeft: 6, fontSize: 10, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>Current</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <>
              <p className="tr-section-heading">History</p>
              {historyLoading ? (
                <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading history…</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {history.map((h) => (
                    <div key={h.id} style={{
                      background: '#f9fafb', border: '1px solid #f3f4f6',
                      borderRadius: 10, padding: '10px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <StageBadge stage={h.stage} />
                        <span style={{ fontSize: 11.5, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtTime(h.occurredAt)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#374151', marginTop: 5 }}>{h.description}</div>
                      {h.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>📍 {h.location}</div>}
                      {h.updatedByUserName && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Updated by: {h.updatedByUserName}</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="tr-modal__footer">
          <button className="tr-btn tr-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Update Stage Modal ────────────────────────────────────────────────────────
interface UpdateStageModalProps {
  tracking: TrackingDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const UpdateStageModal: React.FC<UpdateStageModalProps> = ({ tracking, onClose, onSuccess }) => {
  const allowedNext = ALLOWED_NEXT[tracking.currentStage] ?? [];
  const [form, setForm] = useState<UpdateStageRequestDto>({
    stage: allowedNext[0] ?? '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMeta = STAGES.find((s) => s.value === form.stage);

  const handleSubmit = async () => {
    if (!form.stage) { setError('Please select a stage.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await TrackingService.updateStage(tracking.importRequestId, {
        stage: form.stage,
        location: form.location || undefined,
        description: form.description || undefined,
      });
      if (res.isSuccess) onSuccess(`Stage updated to ${form.stage}.`);
      else setError(res.message);
    } catch {
      setError('Failed to update stage.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-modal-overlay" onClick={onClose}>
      <div className="tr-modal tr-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__header">
          <h2 className="tr-modal__title">Update Shipment Stage</h2>
          <button className="tr-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="tr-modal__body">
          {error && <div className="tr-alert tr-alert--error">{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600 }}>Current:</span>
            <StageBadge stage={tracking.currentStage} />
            {form.stage && (
              <>
                <span style={{ fontSize: 18, color: '#d1d5db' }}>→</span>
                <StageBadge stage={form.stage} />
              </>
            )}
          </div>

          {allowedNext.length === 0 ? (
            <div className="tr-pipeline-card">
              <span className="tr-pipeline-card__icon">🎉</span>
              <div>
                <div className="tr-pipeline-card__title">Shipment Delivered</div>
                <div className="tr-pipeline-card__desc">No further stage updates are possible.</div>
              </div>
            </div>
          ) : (
            <>
              {selectedMeta && (
                <div className="tr-pipeline-card">
                  <span className="tr-pipeline-card__icon">{selectedMeta.icon}</span>
                  <div>
                    <div className="tr-pipeline-card__title">Moving to: {selectedMeta.label}</div>
                  </div>
                </div>
              )}

              <div className="tr-form-group">
                <label className="tr-form-label">New Stage *</label>
                <select
                  className="tr-form-select"
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                >
                  {allowedNext.map((s) => {
                    const meta = STAGES.find((x) => x.value === s);
                    return <option key={s} value={s}>{meta?.icon} {meta?.label ?? s}</option>;
                  })}
                </select>
              </div>

              <div className="tr-form-row">
                <div className="tr-form-group">
                  <label className="tr-form-label">Current Location</label>
                  <input
                    className="tr-form-input"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Port Said, Egypt"
                  />
                </div>
              </div>

              <div className="tr-form-group">
                <label className="tr-form-label">Description / Notes</label>
                <textarea
                  className="tr-form-textarea"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Any details about this stage update…"
                />
              </div>
            </>
          )}
        </div>
        <div className="tr-modal__footer">
          <button className="tr-btn tr-btn--cancel" onClick={onClose} disabled={loading}>
            {allowedNext.length === 0 ? 'Close' : 'Cancel'}
          </button>
          {allowedNext.length > 0 && (
            <button className="tr-btn tr-btn--stage" onClick={handleSubmit} disabled={loading || !form.stage} style={{ padding: '7px 18px' }}>
              {loading ? 'Updating…' : `Move to ${selectedMeta?.label ?? '…'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Update Carrier Modal ──────────────────────────────────────────────────────
interface UpdateCarrierModalProps {
  tracking: TrackingDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const UpdateCarrierModal: React.FC<UpdateCarrierModalProps> = ({ tracking, onClose, onSuccess }) => {
  const [form, setForm] = useState<UpdateCarrierInfoDto>({
    trackingNumber: tracking.trackingNumber ?? '',
    carrierName: tracking.carrierName ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.trackingNumber.trim() || !form.carrierName.trim()) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await TrackingService.updateCarrier(tracking.importRequestId, form);
      if (res.isSuccess) onSuccess('Carrier info updated successfully.');
      else setError(res.message);
    } catch {
      setError('Failed to update carrier info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-modal-overlay" onClick={onClose}>
      <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__header">
          <h2 className="tr-modal__title">Set Carrier Info</h2>
          <button className="tr-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="tr-modal__body">
          {error && <div className="tr-alert tr-alert--error">{error}</div>}
          <div className="tr-form-group">
            <label className="tr-form-label">Tracking Number *</label>
            <input
              className="tr-form-input"
              value={form.trackingNumber}
              onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
              placeholder="e.g. MSC123456789"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="tr-form-group">
            <label className="tr-form-label">Carrier / Shipping Line *</label>
            <input
              className="tr-form-input"
              value={form.carrierName}
              onChange={(e) => setForm((f) => ({ ...f, carrierName: e.target.value }))}
              placeholder="e.g. MSC, Maersk, CMA CGM"
            />
          </div>
        </div>
        <div className="tr-modal__footer">
          <button className="tr-btn tr-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="tr-btn tr-btn--stage" onClick={handleSubmit} disabled={loading} style={{ padding: '7px 18px' }}>
            {loading ? 'Saving…' : '💾 Save Carrier Info'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Update Location Modal ─────────────────────────────────────────────────────
interface UpdateLocationModalProps {
  tracking: TrackingDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const UpdateLocationModal: React.FC<UpdateLocationModalProps> = ({ tracking, onClose, onSuccess }) => {
  const [location, setLocation] = useState(tracking.currentLocation ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!location.trim()) { setError('Location is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await TrackingService.updateLocation(tracking.importRequestId, location.trim());
      if (res.isSuccess) onSuccess('Location updated successfully.');
      else setError(res.message);
    } catch {
      setError('Failed to update location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-modal-overlay" onClick={onClose}>
      <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__header">
          <h2 className="tr-modal__title">Update Location</h2>
          <button className="tr-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="tr-modal__body">
          {error && <div className="tr-alert tr-alert--error">{error}</div>}
          <div className="tr-form-group">
            <label className="tr-form-label">Current Location *</label>
            <input
              className="tr-form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Port Said, Egypt"
            />
          </div>
        </div>
        <div className="tr-modal__footer">
          <button className="tr-btn tr-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="tr-btn tr-btn--stage" onClick={handleSubmit} disabled={loading} style={{ padding: '7px 18px' }}>
            {loading ? 'Saving…' : '📍 Update Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Update Estimated Date Modal ───────────────────────────────────────────────
interface UpdateDateModalProps {
  tracking: TrackingDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const UpdateEstimatedDateModal: React.FC<UpdateDateModalProps> = ({ tracking, onClose, onSuccess }) => {
  const [date, setDate] = useState(
    tracking.estimatedDeliveryDate
      ? new Date(tracking.estimatedDeliveryDate).toISOString().split('T')[0]
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!date) { setError('Date is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await TrackingService.updateEstimatedDate(tracking.importRequestId, date);
      if (res.isSuccess) onSuccess('Estimated delivery date updated.');
      else setError(res.message);
    } catch {
      setError('Failed to update date.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tr-modal-overlay" onClick={onClose}>
      <div className="tr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__header">
          <h2 className="tr-modal__title">Update Estimated Delivery</h2>
          <button className="tr-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="tr-modal__body">
          {error && <div className="tr-alert tr-alert--error">{error}</div>}
          <div className="tr-form-group">
            <label className="tr-form-label">Estimated Delivery Date *</label>
            <input
              className="tr-form-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        <div className="tr-modal__footer">
          <button className="tr-btn tr-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="tr-btn tr-btn--stage" onClick={handleSubmit} disabled={loading} style={{ padding: '7px 18px' }}>
            {loading ? 'Saving…' : '📅 Save Date'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TrackingPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const isAdmin   = role === 'Admin';
  const isSupport = role === 'Support';
  const isOffice  = role === 'ImportOffice';

  const canSeeAdminList = isAdmin || isSupport;

  const [shipments, setShipments] = useState<TrackingDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [page, setPage]           = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  const [stageFilter, setStageFilter] = useState('');
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' }>({ msg: '' });

  const [detailTarget,   setDetailTarget]   = useState<TrackingDto | null>(null);
  const [history,        setHistory]        = useState<TrackingHistoryDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stageTarget,    setStageTarget]    = useState<TrackingDto | null>(null);
  const [carrierTarget,  setCarrierTarget]  = useState<TrackingDto | null>(null);
  const [locationTarget, setLocationTarget] = useState<TrackingDto | null>(null);
  const [dateTarget,     setDateTarget]     = useState<TrackingDto | null>(null);
  const [viewLoadingId,  setViewLoadingId]  = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const fetchShipments = useCallback(async () => {
    if (!canSeeAdminList) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await TrackingService.getAllActive({ page, pageSize: PAGE_SIZE });
      if (res.isSuccess && res.data) {
        setShipments(res.data.items ?? []);
        setTotalCount(res.data.totalCount ?? 0);
        setTotalPages(res.data.totalPages ?? 1);
      } else {
        setError(res.message || 'Failed to load shipments.');
      }
    } catch {
      setError('Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  }, [page, canSeeAdminList]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  useEffect(() => {
    if (!detailTarget) { setHistory([]); return; }
    setHistoryLoading(true);
    TrackingService.getHistory(detailTarget.importRequestId)
      .then((res) => { if (res.isSuccess) setHistory(res.data ?? []); })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [detailTarget]);

  const openDetail = async (t: TrackingDto) => {
    if (viewLoadingId) return;
    setViewLoadingId(t.id);
    try {
      const res = await TrackingService.getByRequestId(t.importRequestId);
      if (res.isSuccess) setDetailTarget(res.data);
      else showToast(res.message, 'error');
    } catch {
      showToast('Failed to load tracking details.', 'error');
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleSuccess = (msg: string) => {
    setStageTarget(null);
    setCarrierTarget(null);
    setLocationTarget(null);
    setDateTarget(null);
    showToast(msg);
    fetchShipments();
  };

  const ACTIVE_STAGES = ['Purchased', 'Processing', 'ReadyToShip', 'Shipped', 'InTransit', 'ArrivedPort', 'Customs', 'OutForDelivery'];
  const filtered = stageFilter === ''
    ? shipments
    : stageFilter === '__active__'
    ? shipments.filter((s) => ACTIVE_STAGES.includes(s.currentStage))
    : shipments.filter((s) => s.currentStage === stageFilter);

  const stats = {
    total:     totalCount,
    inTransit: shipments.filter((s) => s.currentStage === 'InTransit' || s.currentStage === 'Shipped').length,
    customs:   shipments.filter((s) => s.currentStage === 'Customs').length,
    exception: shipments.filter((s) => s.currentStage === 'Exception').length,
    delivered: shipments.filter((s) => s.currentStage === 'Delivered').length,
  };

  const canUpdateStage    = isOffice || isSupport || isAdmin;
  const canUpdateCarrier  = isOffice || isAdmin;
  const canUpdateLocation = isOffice || isSupport || isAdmin;
  const canUpdateDate     = isOffice || isSupport || isAdmin;

  const emptyState = (
    <div className="tr-empty">
      <div className="tr-empty__icon">🚢</div>
      <p className="tr-empty__text">No shipments found</p>
    </div>
  );

  const pagination = !loading && totalCount > PAGE_SIZE && (
    <div className="tr-pagination">
      <button className="tr-pagination__btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
      <span className="tr-pagination__info">Page {page} of {totalPages} · {totalCount} total</span>
      <button className="tr-pagination__btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
    </div>
  );

  if (!canSeeAdminList) {
    return <TrackingSearchPage role={role} showToast={showToast} />;
  }

  return (
    <div className="tr-page">
      {toast.msg && (
        <div className={`tr-toast${toast.type === 'error' ? ' tr-toast--error' : ''}`}>
          {toast.type === 'error' ? '✕  ' : '✓  '}{toast.msg}
        </div>
      )}

      <div className="tr-header">
        <div>
          <h1 className="tr-header__title">Shipment Tracking</h1>
          <p className="tr-header__sub">Monitor and manage all active shipments across the platform</p>
        </div>
      </div>

      <div className="tr-stats">
        {[
          { label: 'Total',      value: stats.total,     color: '#14532d' },
          { label: 'In Transit', value: stats.inTransit, color: '#0369a1' },
          { label: 'Customs',    value: stats.customs,   color: '#92400e' },
          { label: 'Exception',  value: stats.exception, color: '#dc2626' },
          { label: 'Delivered',  value: stats.delivered, color: '#065f46' },
        ].map((s) => (
          <div key={s.label} className="tr-stat-card">
            <span className="tr-stat-card__value" style={{ color: s.color }}>{s.value}</span>
            <span className="tr-stat-card__label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="tr-filters">
        {STAGE_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`tr-filter-btn${stageFilter === f.value ? ' tr-filter-btn--active' : ''}`}
            onClick={() => setStageFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="tr-alert tr-alert--error">⚠  {error}</div>}

      {/* ── Desktop Table ── */}
      <div className="tr-table-wrap tr-desktop-only">
        <table className="tr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Request ID</th>
              <th>Current Stage</th>
              <th>Carrier / Tracking #</th>
              <th>Location</th>
              <th>Est. Delivery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>{emptyState}</td></tr>
            ) : (
              filtered.map((t, idx) => (
                <tr key={t.id} onClick={() => openDetail(t)}>
                  <td style={{ color: '#9ca3af', fontWeight: 600, fontSize: 12 }}>
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#374151' }}>
                      #{t.importRequestId.slice(0, 8)}…
                    </span>
                  </td>
                  <td><StageBadge stage={t.currentStage} /></td>
                  <td>
                    {t.carrierName ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{t.carrierName}</div>
                        {t.trackingNumber && (
                          <div style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#6b7280' }}>{t.trackingNumber}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>Not set</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#374151' }}>
                    {t.currentLocation ? <>📍 {t.currentLocation}</> : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {fmtDate(t.estimatedDeliveryDate)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="tr-actions">
                      <button
                        className="tr-btn tr-btn--view"
                        disabled={viewLoadingId === t.id}
                        onClick={() => openDetail(t)}
                        style={{ minWidth: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        {viewLoadingId === t.id ? <Spinner /> : 'View'}
                      </button>
                      {canUpdateStage && t.currentStage !== 'Delivered' && (
                        <button className="tr-btn tr-btn--stage" onClick={() => setStageTarget(t)}>✏️ Stage</button>
                      )}
                      {canUpdateCarrier && (
                        <button className="tr-btn tr-btn--edit" onClick={() => setCarrierTarget(t)}>🚢 Carrier</button>
                      )}
                      {canUpdateLocation && (
                        <button className="tr-btn tr-btn--edit" onClick={() => setLocationTarget(t)}>📍 Location</button>
                      )}
                      {canUpdateDate && (
                        <button className="tr-btn tr-btn--edit" onClick={() => setDateTarget(t)}>📅 Date</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="tr-mobile-only">
        {loading ? (
          <div className="tr-mobile-list"><SkeletonCards /></div>
        ) : filtered.length === 0 ? (
          <div className="tr-table-wrap">{emptyState}</div>
        ) : (
          <div className="tr-mobile-list">
            {filtered.map((t) => (
              <div key={t.id} className="tr-mobile-card" onClick={() => openDetail(t)}>
                <div className="tr-mobile-card__top">
                  <div>
                    <div className="tr-mobile-card__title" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      #{t.importRequestId.slice(0, 8)}…
                    </div>
                    {t.carrierName && (
                      <div className="tr-mobile-card__sub">🚢 {t.carrierName}</div>
                    )}
                  </div>
                  <StageBadge stage={t.currentStage} />
                </div>
                <div className="tr-mobile-card__meta">
                  {t.currentLocation && <span>📍 {t.currentLocation}</span>}
                  {t.estimatedDeliveryDate && <span>📅 {fmtDate(t.estimatedDeliveryDate)}</span>}
                </div>
                <div className="tr-mobile-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="tr-btn tr-btn--view"
                    disabled={viewLoadingId === t.id}
                    onClick={(e) => { e.stopPropagation(); openDetail(t); }}
                    style={{ flex: 1 }}
                  >
                    {viewLoadingId === t.id ? <Spinner /> : 'View'}
                  </button>
                  {canUpdateStage && t.currentStage !== 'Delivered' && (
                    <button className="tr-btn tr-btn--stage" onClick={(e) => { e.stopPropagation(); setStageTarget(t); }}>✏️ Stage</button>
                  )}
                  {canUpdateCarrier && (
                    <button className="tr-btn tr-btn--edit" onClick={(e) => { e.stopPropagation(); setCarrierTarget(t); }}>🚢</button>
                  )}
                  {canUpdateLocation && (
                    <button className="tr-btn tr-btn--edit" onClick={(e) => { e.stopPropagation(); setLocationTarget(t); }}>📍</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {pagination}
      </div>

      {detailTarget && (
        <TrackingDetailModal
          tracking={detailTarget}
          history={history}
          historyLoading={historyLoading}
          onClose={() => setDetailTarget(null)}
        />
      )}
      {stageTarget    && <UpdateStageModal        tracking={stageTarget}    onClose={() => setStageTarget(null)}    onSuccess={handleSuccess} />}
      {carrierTarget  && <UpdateCarrierModal       tracking={carrierTarget}  onClose={() => setCarrierTarget(null)}  onSuccess={handleSuccess} />}
      {locationTarget && <UpdateLocationModal      tracking={locationTarget} onClose={() => setLocationTarget(null)} onSuccess={handleSuccess} />}
      {dateTarget     && <UpdateEstimatedDateModal tracking={dateTarget}     onClose={() => setDateTarget(null)}     onSuccess={handleSuccess} />}

      <style>{`@keyframes trSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ── Tracking Search Page (ImportOffice / Customer) ────────────────────────────
interface TrackingSearchPageProps {
  role: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const TrackingSearchPage: React.FC<TrackingSearchPageProps> = ({ role, showToast }) => {
  const isOffice   = role === 'ImportOffice';
  const isCustomer = role === 'Customer';

  // ── قائمة الـ Requests للـ Dropdown ──────────────────────────────────────
  const [requestList,        setRequestList]        = useState<ImportRequestListDto[]>([]);
  const [requestListLoading, setRequestListLoading] = useState(false);
  const [requestListError,   setRequestListError]   = useState('');

  useEffect(() => {
    setRequestListLoading(true);
    setRequestListError('');

    // Office تجيب الـ requests المسندة ليها — Customer تجيب requests بتاعتها
    const fetchFn = isOffice
      ? ImportRequestService.getOfficeRequests()
      : ImportRequestService.getMyRequests();

    fetchFn
      .then((res) => {
        if (res.isSuccess) setRequestList(res.data ?? []);
        else setRequestListError('Failed to load requests.');
      })
      .catch(() => setRequestListError('Failed to load requests.'))
      .finally(() => setRequestListLoading(false));
  }, [isOffice]);

  // ── Tracking State ────────────────────────────────────────────────────────
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [tracking,          setTracking]          = useState<TrackingDto | null>(null);
  const [history,           setHistory]           = useState<TrackingHistoryDto[]>([]);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');

  const [stageTarget,    setStageTarget]    = useState<TrackingDto | null>(null);
  const [carrierTarget,  setCarrierTarget]  = useState<TrackingDto | null>(null);
  const [locationTarget, setLocationTarget] = useState<TrackingDto | null>(null);
  const [dateTarget,     setDateTarget]     = useState<TrackingDto | null>(null);

  // ── Auto-track عند اختيار request من الـ dropdown ────────────────────────
  useEffect(() => {
    if (selectedRequestId) handleSearch(selectedRequestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequestId]);

  const handleSearch = async (idOverride?: string) => {
    const id = (idOverride ?? selectedRequestId).trim();
    if (!id) { setError('Please select a shipment request.'); return; }
    setLoading(true);
    setError('');
    setTracking(null);
    setHistory([]);
    try {
      const [trackRes, histRes] = await Promise.all([
        TrackingService.getByRequestId(id),
        TrackingService.getHistory(id),
      ]);
      if (trackRes.isSuccess) {
        setTracking(trackRes.data);
        if (histRes.isSuccess) setHistory(histRes.data ?? []);
      } else {
        setError(trackRes.message || 'Tracking not found.');
      }
    } catch {
      setError('Failed to load tracking.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (msg: string) => {
    setStageTarget(null);
    setCarrierTarget(null);
    setLocationTarget(null);
    setDateTarget(null);
    showToast(msg);
    if (selectedRequestId) handleSearch(selectedRequestId);
  };

  // ── Label للـ dropdown option ─────────────────────────────────────────────
  // ⚠️ عدّل أسماء الـ fields دي حسب الـ ImportRequestListDto الحقيقي بتاعك
  const requestLabel = (r: ImportRequestListDto) => {
    const name  = r.customerFullName ?? r.userName ?? 'Unknown Customer';
    const short = r.id.slice(0, 8);
    return `${name}  ·  ${r.status}  [#${short}…]`;
  };

  const currentIdx = tracking ? STAGES.findIndex((s) => s.value === tracking.currentStage) : -1;

  return (
    <div className="tr-page">
      <div className="tr-header">
        <div>
          <h1 className="tr-header__title">Shipment Tracking</h1>
          <p className="tr-header__sub">
            {isCustomer
              ? 'اختار الشحنة اللي عايز تتابعها'
              : 'اختار الطلب اللي عايز تشوف تراكينجه'}
          </p>
        </div>
      </div>

      {/* ── Dropdown + Track Button ── */}
      <div className="tr-table-wrap" style={{ padding: '20px 24px' }}>
        {requestListError && (
          <div className="tr-alert tr-alert--error" style={{ marginBottom: 12 }}>{requestListError}</div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Dropdown */}
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <select
              className="tr-form-select"
              value={selectedRequestId}
              disabled={requestListLoading}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">
                {requestListLoading
                  ? '⏳ Loading requests…'
                  : requestList.length === 0
                  ? 'No requests available'
                  : '— Select a shipment —'}
              </option>
              {requestList.map((r) => (
                <option key={r.id} value={r.id}>
                  {requestLabel(r)}
                </option>
              ))}
            </select>

            {/* Spinner داخل الـ select لما بيلود */}
            {requestListLoading && (
              <span style={{
                position: 'absolute', right: 36, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }}>
                <Spinner />
              </span>
            )}
          </div>

          {/* Track Button */}
          <button
            className="tr-btn tr-btn--stage"
            onClick={() => handleSearch()}
            disabled={loading || !selectedRequestId || requestListLoading}
            style={{ padding: '9px 20px', fontSize: 13.5, whiteSpace: 'nowrap' }}
          >
            {loading ? <><Spinner /> &nbsp;Loading…</> : '🔍 Track'}
          </button>
        </div>

        {error && (
          <div className="tr-alert tr-alert--error" style={{ marginTop: 12 }}>{error}</div>
        )}
      </div>

      {/* ── Tracking Result ── */}
      {tracking && (
        <div className="tr-table-wrap" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status + Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StageBadge stage={tracking.currentStage} />

            {isOffice && tracking.currentStage !== 'Delivered' && (
              <button className="tr-btn tr-btn--stage" onClick={() => setStageTarget(tracking)}>
                ✏️ Update Stage
              </button>
            )}
            {isOffice && (
              <>
                <button className="tr-btn tr-btn--edit" onClick={() => setCarrierTarget(tracking)}>🚢 Carrier</button>
                <button className="tr-btn tr-btn--edit" onClick={() => setLocationTarget(tracking)}>📍 Location</button>
                <button className="tr-btn tr-btn--edit" onClick={() => setDateTarget(tracking)}>📅 Est. Date</button>
              </>
            )}
          </div>

          {/* Key Info */}
          <div className="tr-detail-grid">
            {tracking.trackingNumber && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Tracking #</span>
                <span className="tr-detail-value" style={{ fontFamily: 'monospace' }}>{tracking.trackingNumber}</span>
              </div>
            )}
            {tracking.carrierName && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Carrier</span>
                <span className="tr-detail-value">{tracking.carrierName}</span>
              </div>
            )}
            {tracking.currentLocation && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Current Location</span>
                <span className="tr-detail-value">📍 {tracking.currentLocation}</span>
              </div>
            )}
            {tracking.estimatedDeliveryDate && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Est. Delivery</span>
                <span className="tr-detail-value">📅 {fmtDate(tracking.estimatedDeliveryDate)}</span>
              </div>
            )}
            {tracking.shippedAt && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Shipped At</span>
                <span className="tr-detail-value">{fmtDate(tracking.shippedAt)}</span>
              </div>
            )}
            {tracking.deliveredAt && (
              <div className="tr-detail-item">
                <span className="tr-detail-label">Delivered At</span>
                <span className="tr-detail-value">{fmtDate(tracking.deliveredAt)}</span>
              </div>
            )}
          </div>

          {/* Stage Timeline */}
          <div>
            <p className="tr-section-heading" style={{ marginBottom: 12 }}>Stage Progress</p>
            <div className="tr-timeline">
              {STAGES.filter((s) => s.value !== 'Exception').map((stage, i) => {
                const isActive  = i <= currentIdx && tracking.currentStage !== 'Exception';
                const isCurrent = stage.value === tracking.currentStage;
                return (
                  <div key={stage.value} className="tr-timeline-step">
                    <div className="tr-timeline-step__line">
                      <div
                        className={`tr-timeline-step__dot${isActive ? ' tr-timeline-step__dot--active' : ''}`}
                        style={isCurrent ? { boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' } : undefined}
                      />
                      {i < STAGES.filter((s) => s.value !== 'Exception').length - 1 && (
                        <div className="tr-timeline-step__connector" />
                      )}
                    </div>
                    <div className="tr-timeline-step__content">
                      <span
                        className="tr-timeline-step__stage"
                        style={{ color: isActive ? '#14532d' : '#9ca3af', fontWeight: isActive ? 600 : 400 }}
                      >
                        {stage.icon} {stage.label}
                        {isCurrent && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                            Current
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              {tracking.currentStage === 'Exception' && (
                <div className="tr-timeline-step">
                  <div className="tr-timeline-step__line">
                    <div className="tr-timeline-step__dot tr-timeline-step__dot--active"
                         style={{ borderColor: '#dc2626', background: '#dc2626' }} />
                  </div>
                  <div className="tr-timeline-step__content">
                    <span className="tr-timeline-step__stage" style={{ color: '#dc2626' }}>
                      ⚠️ Exception
                      <span style={{ marginLeft: 6, fontSize: 10, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>
                        Current
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <p className="tr-section-heading" style={{ marginBottom: 12 }}>History</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h) => (
                  <div key={h.id} style={{
                    background: '#f9fafb', border: '1px solid #f3f4f6',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <StageBadge stage={h.stage} />
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>{fmtTime(h.occurredAt)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#374151', marginTop: 5 }}>{h.description}</div>
                    {h.location && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>📍 {h.location}</div>}
                    {h.updatedByUserName && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Updated by: {h.updatedByUserName}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {stageTarget    && <UpdateStageModal        tracking={stageTarget}    onClose={() => setStageTarget(null)}    onSuccess={handleSuccess} />}
      {carrierTarget  && <UpdateCarrierModal       tracking={carrierTarget}  onClose={() => setCarrierTarget(null)}  onSuccess={handleSuccess} />}
      {locationTarget && <UpdateLocationModal      tracking={locationTarget} onClose={() => setLocationTarget(null)} onSuccess={handleSuccess} />}
      {dateTarget     && <UpdateEstimatedDateModal tracking={dateTarget}     onClose={() => setDateTarget(null)}     onSuccess={handleSuccess} />}

      <style>{`@keyframes trSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TrackingPage;