import React, { useState, useEffect, useCallback } from 'react';
import { ImportRequestService } from '../ImportRequestService';
import type {
  ImportRequestListDto,
  ImportRequestDto,
} from '../types/importRequests';
import { useAuth } from '../../auth/AuthContext';
import './ImportRequestsPage.css';
import SubmitRequestModal from './SubmitRequestModal';
import RequestDetailModal from './RequestDetailModal';
import RejectModal from './RejectModal';
import AssignOfficeModal from './AssignOfficeModal';
import CancelConfirmModal from './CancelConfirmModal';
import UpdateStageModal from './Updatestagemodal';
import ContainerSuggestionDrawer from '../../containers/pages/ContainerSuggestionDrawer';
import FCLContainerDrawer from '../../containers/pages/FCLContainerDrawer';

const STATUS_FILTERS = [
  { label: 'All',              value: '' },
  { label: 'Pending',          value: 'Pending' },
  { label: 'Approved',         value: 'Approved' },
  { label: 'Rejected',         value: 'Rejected' },
  { label: 'Processing',       value: 'Processing' },
  { label: 'Shipped',          value: 'Shipped' },
  { label: 'Customs',          value: 'Customs' },
  { label: 'Out for Delivery', value: 'OutForDelivery' },
  { label: 'Delivered',        value: 'Delivered' },
  { label: 'Cancelled',        value: 'Cancelled' },
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  Pending:         'ir-badge--pending',
  Approved:        'ir-badge--approved',
  Rejected:        'ir-badge--rejected',
  Processing:      'ir-badge--processing',
  Shipped:         'ir-badge--shipped',
  Customs:         'ir-badge--customs',
  OutForDelivery:  'ir-badge--outfordelivery',
  Delivered:       'ir-badge--delivered',
  Cancelled:       'ir-badge--cancelled',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`ir-badge ${STATUS_BADGE_CLASS[status] ?? ''}`}>
    <span className="ir-badge__dot" />
    {status === 'OutForDelivery' ? 'Out for Delivery' : status}
  </span>
);

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="ir-skeleton-row">
        {Array.from({ length: 7 }).map((__, j) => (
          <td key={j}>
            <div className="ir-skeleton" style={{ width: j === 0 ? 60 : j === 6 ? 140 : '85%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const SkeletonCards: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="ir-mobile-card ir-mobile-card--skeleton">
        <div className="ir-skeleton" style={{ width: '55%', height: 16, marginBottom: 8 }} />
        <div className="ir-skeleton" style={{ width: '30%', height: 22, marginBottom: 10, borderRadius: 20 }} />
        <div className="ir-skeleton" style={{ width: '70%', height: 12, marginBottom: 6 }} />
        <div className="ir-skeleton" style={{ width: '50%', height: 12 }} />
      </div>
    ))}
  </>
);

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: 12, height: 12,
    border: '2px solid rgba(22,163,74,0.25)', borderTopColor: '#16a34a',
    borderRadius: '50%', animation: 'irSpin 0.7s linear infinite', verticalAlign: 'middle',
  }} />
);

// ── Mobile Request Card ───────────────────────────────
interface MobileCardProps {
  req: ImportRequestListDto;
  isAdmin: boolean;
  isOffice: boolean;
  isSupport: boolean;
  isCustomer: boolean;
  viewLoadingId: string | null;
  actionLoading: string | null;
  cancelLoading: boolean;
  cancelTarget: ImportRequestListDto | null;
  canCancel: (r: ImportRequestListDto) => boolean;
  canApprove: (r: ImportRequestListDto) => boolean;
  canReject: (r: ImportRequestListDto) => boolean;
  canAssign: (r: ImportRequestListDto) => boolean;
  canUpdateStage: (r: ImportRequestListDto) => boolean;
  onView: (r: ImportRequestListDto) => void;
  onApprove: (r: ImportRequestListDto) => void;
  onReject: (r: ImportRequestListDto) => void;
  onAssign: (r: ImportRequestListDto) => void;
  onStage: (r: ImportRequestListDto) => void;
  onCancel: (r: ImportRequestListDto) => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
  req, isAdmin, isSupport,
  viewLoadingId, actionLoading, cancelLoading, cancelTarget,
  canCancel, canApprove, canReject, canAssign, canUpdateStage,
  onView, onApprove, onReject, onAssign, onStage, onCancel,
}) => (
  <div
    className="ir-mobile-card"
    style={{ opacity: actionLoading === req.id ? 0.6 : 1 }}
    onClick={() => onView(req)}
  >
    <div className="ir-mobile-card__top">
      <div className="ir-mobile-card__product">
        <div className="ir-mobile-card__name">{req.productName ?? '—'}</div>
        <div className="ir-mobile-card__type">
          {req.shipmentType === 'FullContainer' ? '🚢 FCL' : '📦 LCL'}
        </div>
      </div>
      <StatusBadge status={req.status} />
    </div>

    <div className="ir-mobile-card__meta">
      <span>📦 {req.quantity.toLocaleString()} units · {req.totalWeightKg} kg</span>
      <span>🗓 {new Date(req.createdAt).toLocaleDateString()}</span>
      {(isAdmin || isSupport) && req.assignedOfficeName && (
        <span>🏢 {req.assignedOfficeName}</span>
      )}
    </div>

    <div className="ir-mobile-card__actions" onClick={(e) => e.stopPropagation()}>
      <button
        className="ir-btn ir-btn--view"
        disabled={viewLoadingId === req.id}
        onClick={(e) => { e.stopPropagation(); onView(req); }}
        style={{ flex: 1 }}
      >
        {viewLoadingId === req.id ? <Spinner /> : 'View'}
      </button>

      {canApprove(req) && (
        <button
          className="ir-btn ir-btn--approve"
          disabled={actionLoading === req.id}
          onClick={(e) => { e.stopPropagation(); onApprove(req); }}
        >
          {actionLoading === req.id
            ? '…'
            : req.shipmentType === 'LCL'
            ? '📦 Approve'
            : '🚢 Approve'}
        </button>
      )}

      {canReject(req) && (
        <button className="ir-btn ir-btn--reject"
          onClick={(e) => { e.stopPropagation(); onReject(req); }}>
          Reject
        </button>
      )}

      {canUpdateStage(req) && (
        <button className="ir-btn ir-btn--assign"
          onClick={(e) => { e.stopPropagation(); onStage(req); }}>
          ✏️ Update Stage
        </button>
      )}

      {canAssign(req) && (
        <button className="ir-btn ir-btn--assign"
          onClick={(e) => { e.stopPropagation(); onAssign(req); }}>
          Assign
        </button>
      )}

      {canCancel(req) && (
        <button className="ir-btn ir-btn--cancel"
          disabled={cancelLoading && cancelTarget?.id === req.id}
          onClick={(e) => { e.stopPropagation(); onCancel(req); }}>
          Cancel
        </button>
      )}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────
const ImportRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const isAdmin    = role === 'Admin';
  const isSupport  = role === 'Support';
  const isOffice   = role === 'ImportOffice';
  const isCustomer = role === 'Customer';

  const [requests, setRequests]           = useState<ImportRequestListDto[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [toast, setToast]                 = useState<{ msg: string; type?: 'success' | 'error' }>({ msg: '' });
  const [statusFilter, setStatusFilter]   = useState('__active__');
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 12;

  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);
  const actionLoading: string | null = null; // drawers handle their own loading state

  const [submitOpen, setSubmitOpen]       = useState(false);
  const [detailRequest, setDetailRequest] = useState<ImportRequestDto | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<ImportRequestListDto | null>(null);
  const [assignTarget, setAssignTarget]   = useState<ImportRequestListDto | null>(null);
  const [cancelTarget, setCancelTarget]   = useState<ImportRequestListDto | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [stageTarget, setStageTarget]     = useState<ImportRequestListDto | null>(null);

  // ── Drawers for approve flows ──────────────────────
  // LCL: container suggestion drawer
  const [lclApproveTarget, setLclApproveTarget] = useState<ImportRequestListDto | null>(null);
  // FCL: container info drawer (ports + expected arrival)
  const [fclApproveTarget, setFclApproveTarget] = useState<ImportRequestListDto | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    const apiStatus = (statusFilter === '__active__' || statusFilter === '') ? undefined : statusFilter;
    try {
      let res;
      if (isAdmin || isSupport) {
        res = await ImportRequestService.getAll({ status: apiStatus });
      } else if (isOffice) {
        res = await ImportRequestService.getOffice(apiStatus);
      } else {
        res = await ImportRequestService.getMy(apiStatus);
      }
      if (res.isSuccess) setRequests(res.data ?? []);
      else setError(res.message);
    } catch {
      setError('Failed to load import requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isAdmin, isSupport, isOffice]);

  useEffect(() => { setPage(1); fetchRequests(); }, [fetchRequests]);

  const openDetail = async (req: ImportRequestListDto) => {
    if (viewLoadingId === req.id) return;
    setViewLoadingId(req.id);
    try {
      const res = await ImportRequestService.getById(req.id);
      if (res.isSuccess) setDetailRequest(res.data);
      else showToast(res.message, 'error');
    } catch {
      showToast('Failed to load request details.', 'error');
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const res = await ImportRequestService.cancel(cancelTarget.id);
      if (res.isSuccess) {
        showToast('Request cancelled successfully.');
        setCancelTarget(null);
        fetchRequests();
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to cancel request.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Smart approve router ───────────────────────────
  // LCL → ContainerSuggestionDrawer (pick existing open LCL container)
  // FCL → FCLContainerDrawer       (enter port info, then approve)
  const handleApproveClick = (req: ImportRequestListDto) => {
    if (req.shipmentType === 'LCL') {
      setLclApproveTarget(req);
    } else {
      setFclApproveTarget(req);
    }
  };

  const stats = {
    total:     requests.length,
    pending:   requests.filter((r) => r.status === 'Pending').length,
    approved:  requests.filter((r) => r.status === 'Approved').length,
    shipped:   requests.filter((r) => r.status === 'Shipped').length,
    delivered: requests.filter((r) => r.status === 'Delivered').length,
  };

  const filteredRequests = statusFilter === '__active__'
    ? requests.filter((r) => r.status !== 'Cancelled')
    : requests;

  const paginated  = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);

  const canCancel      = (req: ImportRequestListDto) => {
    if (isAdmin)    return req.status !== 'Delivered' && req.status !== 'Cancelled';
    if (isCustomer) return req.status === 'Pending';
    return false;
  };
  const canApprove     = (req: ImportRequestListDto) => isOffice && req.status === 'Pending';
  const canReject      = (req: ImportRequestListDto) => isOffice && req.status === 'Pending';
  const canAssign      = (req: ImportRequestListDto) => isAdmin && !req.assignedOfficeId;
  const UPDATABLE_STATUSES = ['Approved', 'Processing', 'Shipped', 'Customs', 'OutForDelivery'];
  const canUpdateStage = (req: ImportRequestListDto) =>
    isOffice && UPDATABLE_STATUSES.includes(req.status);

  const emptyState = (
    <div className="ir-empty">
      <div className="ir-empty__icon"></div>
      <p className="ir-empty__text">
        {statusFilter === '__active__'
          ? 'No active requests found'
          : statusFilter
          ? `No ${statusFilter === 'OutForDelivery' ? 'Out for Delivery' : statusFilter} requests found`
          : 'No import requests found'}
      </p>
      {isCustomer && statusFilter === '__active__' && (
        <button className="ir-btn ir-btn--approve" style={{ marginTop: 8 }} onClick={() => setSubmitOpen(true)}>
          + Submit your first request
        </button>
      )}
    </div>
  );

  const pagination = !loading && filteredRequests.length > PAGE_SIZE && (
    <div className="ir-pagination">
      <button className="ir-pagination__btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
      <span className="ir-pagination__info">Page {page} of {totalPages} · {filteredRequests.length} total</span>
      <button className="ir-pagination__btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
    </div>
  );

  const cardProps = {
    isAdmin, isOffice, isSupport, isCustomer,
    viewLoadingId, actionLoading, cancelLoading, cancelTarget,
    canCancel, canApprove, canReject, canAssign, canUpdateStage,
    onView:   openDetail,
    onApprove: handleApproveClick,
    onReject: (r: ImportRequestListDto) => setRejectTarget(r),
    onAssign: (r: ImportRequestListDto) => setAssignTarget(r),
    onStage:  (r: ImportRequestListDto) => setStageTarget(r),
    onCancel: (r: ImportRequestListDto) => setCancelTarget(r),
  };

  return (
    <div className="ir-page">

      {toast.msg && (
        <div className="ir-toast" style={toast.type === 'error' ? { background: '#dc2626' } : undefined}>
          {toast.type === 'error' ? '✕  ' : '✓  '}{toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="ir-page__header">
        <div>
          <h1 className="ir-page__title">Import Requests</h1>
          <p className="ir-page__subtitle">
            {isAdmin || isSupport
              ? 'Manage all import requests across the platform'
              : isOffice
              ? 'Review and manage requests assigned to your office'
              : 'Track and manage your import requests'}
          </p>
        </div>
        {isCustomer && (
          <button
            className="ir-btn ir-btn--approve"
            style={{ padding: '9px 20px', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setSubmitOpen(true)}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Request
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="ir-stats">
        {[
          { label: 'Total',     value: stats.total,     color: '#14532d' },
          { label: 'Pending',   value: stats.pending,   color: '#854d0e' },
          { label: 'Approved',  value: stats.approved,  color: '#166534' },
          { label: 'Shipped',   value: stats.shipped,   color: '#5b21b6' },
          { label: 'Delivered', value: stats.delivered, color: '#065f46' },
        ].map((s) => (
          <div key={s.label} className="ir-stat-card">
            <span className="ir-stat-card__value" style={{ color: s.color }}>{s.value}</span>
            <span className="ir-stat-card__label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="ir-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`ir-filter-btn${statusFilter === f.value ? ' ir-filter-btn--active' : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="ir-alert ir-alert--error">⚠  {error}</div>}

      {/* ── Desktop Table ── */}
      <div className="ir-table-wrap ir-desktop-only">
        <table className="ir-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Qty / Weight</th>
              <th>Status</th>
              <th>Date</th>
              {(isAdmin || isSupport) && <th>Customer</th>}
              {(isAdmin || isSupport) && <th>Office</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8}>{emptyState}</td></tr>
            ) : (
              paginated.map((req, idx) => (
                <tr
                  key={req.id}
                  onClick={() => openDetail(req)}
                  style={{ opacity: actionLoading === req.id ? 0.6 : 1 }}
                >
                  <td style={{ color: '#9ca3af', fontWeight: 600, fontSize: 12 }}>
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{req.productName ?? '—'}</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                      {req.shipmentType === 'FullContainer' ? '🚢 FCL' : '📦 LCL'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{req.quantity.toLocaleString()} units</div>
                    <div style={{ fontSize: 11.5, color: '#6b7280' }}>{req.totalWeightKg} kg</div>
                  </td>
                  <td><StatusBadge status={req.status} /></td>
                  <td style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  {(isAdmin || isSupport) && (
                    <td style={{ fontSize: 12.5, color: '#374151' }}>
                      {req.userId ? <span title={req.userId}>{req.userId.slice(0, 8)}…</span> : '—'}
                    </td>
                  )}
                  {(isAdmin || isSupport) && (
                    <td style={{ fontSize: 12.5 }}>
                      {req.assignedOfficeName
                        ? <span style={{ color: '#374151', fontWeight: 500 }}>{req.assignedOfficeName}</span>
                        : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}
                    </td>
                  )}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="ir-actions">
                      <button
                        className="ir-btn ir-btn--view"
                        disabled={viewLoadingId === req.id}
                        onClick={() => openDetail(req)}
                        style={{ minWidth: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                      >
                        {viewLoadingId === req.id ? <Spinner /> : 'View'}
                      </button>

                      {canApprove(req) && (
                        <button
                          className="ir-btn ir-btn--approve"
                          disabled={actionLoading === req.id}
                          onClick={() => handleApproveClick(req)}
                          title={
                            req.shipmentType === 'LCL'
                              ? 'Select a container for this LCL shipment'
                              : 'Enter container details and approve'
                          }
                        >
                          {actionLoading === req.id
                            ? '…'
                            : req.shipmentType === 'LCL'
                            ? '📦 Approve'
                            : '🚢 Approve'}
                        </button>
                      )}

                      {canReject(req) && (
                        <button className="ir-btn ir-btn--reject" disabled={actionLoading === req.id}
                          onClick={() => setRejectTarget(req)}>Reject</button>
                      )}

                      {canUpdateStage(req) && (
                        <button className="ir-btn ir-btn--assign" disabled={actionLoading === req.id}
                          onClick={() => setStageTarget(req)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                          {' '}Update Stage
                        </button>
                      )}

                      {canAssign(req) && (
                        <button className="ir-btn ir-btn--assign" onClick={() => setAssignTarget(req)}>Assign</button>
                      )}

                      {canCancel(req) && (
                        <button className="ir-btn ir-btn--cancel"
                          disabled={cancelLoading && cancelTarget?.id === req.id}
                          onClick={() => setCancelTarget(req)}>Cancel</button>
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
      <div className="ir-mobile-only">
        {loading ? (
          <div className="ir-mobile-list"><SkeletonCards /></div>
        ) : paginated.length === 0 ? (
          <div className="ir-table-wrap">{emptyState}</div>
        ) : (
          <div className="ir-mobile-list">
            {paginated.map((req) => (
              <MobileCard key={req.id} req={req} {...cardProps} />
            ))}
          </div>
        )}
        {pagination}
      </div>

      {/* ── Modals ── */}
      {submitOpen && (
        <SubmitRequestModal
          onClose={() => setSubmitOpen(false)}
          onSuccess={(msg) => { setSubmitOpen(false); showToast(msg); fetchRequests(); }}
        />
      )}

      {detailRequest && (
        <RequestDetailModal
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          role={role}
          onAction={() => { setDetailRequest(null); fetchRequests(); }}
          showToast={showToast}
        />
      )}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={(msg) => { setRejectTarget(null); showToast(msg); fetchRequests(); }}
        />
      )}

      {assignTarget && (
        <AssignOfficeModal
          request={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={(msg) => { setAssignTarget(null); showToast(msg); fetchRequests(); }}
        />
      )}

      {cancelTarget && (
        <CancelConfirmModal
          productName={cancelTarget.productName}
          onClose={() => { if (!cancelLoading) setCancelTarget(null); }}
          onConfirm={handleCancelConfirm}
          loading={cancelLoading}
        />
      )}

      {stageTarget && (
        <UpdateStageModal
          request={stageTarget}
          onClose={() => setStageTarget(null)}
          onSuccess={(msg) => { setStageTarget(null); showToast(msg); fetchRequests(); }}
        />
      )}

      {/* ── LCL: Container Suggestion Drawer ── */}
      {lclApproveTarget && (
        <ContainerSuggestionDrawer
          requestId={lclApproveTarget.id}
          requestWeight={lclApproveTarget.totalWeightKg}
          requestVolume={lclApproveTarget.totalVolumeCbm}
          productName={lclApproveTarget.productName}
          onClose={() => setLclApproveTarget(null)}
          onSuccess={(msg) => {
            setLclApproveTarget(null);
            showToast(msg);
            fetchRequests();
          }}
        />
      )}

      {/* ── FCL: Container Info Drawer ── */}
      {fclApproveTarget && (
        <FCLContainerDrawer
          request={fclApproveTarget}
          onClose={() => setFclApproveTarget(null)}
          onSuccess={(msg) => {
            setFclApproveTarget(null);
            showToast(msg);
            fetchRequests();
          }}
        />
      )}

      <style>{`@keyframes irSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ImportRequestsPage;