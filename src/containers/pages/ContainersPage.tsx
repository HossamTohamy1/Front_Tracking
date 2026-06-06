import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ContainerService } from '../ContainerService';
import type { ContainerListItemDto, ContainerDto } from '../types/containers';
import { CONTAINER_STATUS } from '../types/containers';
import { useAuth } from '../../auth/AuthContext';
import './ContainersPage.css';
import ContainerStatusUpdateModal from './Containerstatusupdatemodal';
import CreateContainerModal from './CreateContainerModal';
import ContainerDetailModal from './ContainerDetailModal';
import ReactDOM from 'react-dom';

// ── Status filter config ──────────────────────────────
const STATUS_FILTERS = [
  { label: 'All', value: -1 },
  { label: 'Open', value: 0 },
  { label: 'Closed', value: 1 },
  { label: 'Shipped', value: 2 },
  { label: 'In Transit', value: 3 },
  { label: 'Arrived Port', value: 4 },
  { label: 'In Customs', value: 5 },
  { label: 'Delivered', value: 6 },
];

const CONTAINER_STATUS_OPTIONS = [
  { label: 'Closed', value: 1, color: '#6b7280' },
  { label: 'Shipped', value: 2, color: '#1d4ed8' },
  { label: 'In Transit', value: 3, color: '#7c3aed' },
  { label: 'Arrived Port', value: 4, color: '#d97706' },
  { label: 'In Customs', value: 5, color: '#c2410c' },
  { label: 'Delivered', value: 6, color: '#16a34a' },
];

const STATUS_BADGE_CLASS: Record<number, string> = {
  0: 'cn-badge--open',
  1: 'cn-badge--closed',
  2: 'cn-badge--shipped',
  3: 'cn-badge--intransit',
  4: 'cn-badge--arrivedport',
  5: 'cn-badge--incustoms',
  6: 'cn-badge--delivered',
  7: 'cn-badge--cancelled',
};

// ── Small helpers ─────────────────────────────────────
const StatusBadge: React.FC<{ status: number; statusName?: string }> = ({ status, statusName }) => {
  const name = statusName || CONTAINER_STATUS[status as keyof typeof CONTAINER_STATUS] || 'Unknown';
  return (
    <span className={`cn-badge ${STATUS_BADGE_CLASS[status] ?? ''}`}>
      <span className="cn-badge__dot" />{name}
    </span>
  );
};

const ProgressBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#16a34a';
  return (
    <div className="cn-progress">
      <div className="cn-progress__bar">
        <div className="cn-progress__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="cn-progress__label">{current} / {max} ({pct.toFixed(0)}%)</div>
    </div>
  );
};

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 6 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 8 }).map((__, j) => (
          <td key={j}><div className="cn-skeleton" style={{ width: j === 0 ? 50 : j === 7 ? 130 : '80%' }} /></td>
        ))}
      </tr>
    ))}
  </>
);

const SkeletonCards: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="cn-mobile-card cn-mobile-card--skeleton">
        <div className="cn-skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
        <div className="cn-skeleton" style={{ width: '40%', height: 12, marginBottom: 12 }} />
        <div className="cn-skeleton" style={{ width: '100%', height: 5, marginBottom: 4 }} />
        <div className="cn-skeleton" style={{ width: '80%', height: 11 }} />
      </div>
    ))}
  </>
);

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: 12, height: 12,
    border: '2px solid rgba(22,163,74,0.25)', borderTopColor: '#16a34a',
    borderRadius: '50%', animation: 'cnSpin 0.7s linear infinite', verticalAlign: 'middle',
  }} />
);

// ── Status Popover ────────────────────────────────────
interface StatusPopoverProps {
  containerId: string;
  currentStatus: number;
  isUpdating: boolean;
  onSelect: (containerId: string, newStatus: number, e: React.MouseEvent) => void;
}

const StatusPopover: React.FC<StatusPopoverProps> = ({ containerId, currentStatus, isUpdating, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX + rect.width / 2,
      width: rect.width,
    });
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const menu = open && !isUpdating ? ReactDOM.createPortal(
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', top: pos.top, left: pos.left,
        transform: 'translateX(-50%)', background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 99999,
        minWidth: 168, overflow: 'hidden', animation: 'cnPopoverIn 0.15s ease',
      }}
    >
      <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 6, background: '#fff', clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.06))' }} />
      <div style={{ padding: '4px 0' }}>
        {CONTAINER_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={(e) => { e.stopPropagation(); setOpen(false); onSelect(containerId, opt.value, e); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', fontSize: 13,
              fontWeight: opt.value === currentStatus ? 600 : 400,
              color: opt.value === currentStatus ? opt.color : '#374151',
              background: opt.value === currentStatus ? `${opt.color}12` : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${opt.color}18`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = opt.value === currentStatus ? `${opt.color}12` : 'transparent'; }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
            {opt.label}
            {opt.value === currentStatus && <span style={{ marginLeft: 'auto', color: opt.color, fontSize: 11 }}>✓</span>}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        className="cn-btn cn-btn--status"
        style={{ padding: '4px 12px', fontSize: 12, whiteSpace: 'nowrap', height: 30, display: 'flex', alignItems: 'center', gap: 5 }}
        disabled={isUpdating}
        onClick={openPopover}
      >
        {isUpdating ? <Spinner /> : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Update Status</span>
          </>
        )}
      </button>
      {menu}
    </div>
  );
};

// ── Mobile Container Card ─────────────────────────────
interface MobileCardProps {
  c: ContainerListItemDto;
  idx: number;
  isAdmin: boolean;
  isOffice: boolean;
  isSupport: boolean;
  viewLoadingId: string | null;
  deleteLoadingId: string | null;
  updatingStatusId: string | null;
  onView: (c: ContainerListItemDto) => void;
  onDelete: (c: ContainerListItemDto, e: React.MouseEvent) => void;
  onStatusSelect: (containerId: string, newStatus: number, e: React.MouseEvent) => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
  c, idx: _idx, isAdmin, isOffice, isSupport,
  viewLoadingId, deleteLoadingId, updatingStatusId,
  onView, onDelete, onStatusSelect,
}) => {
  const volPct = c.maxVolumeCbm > 0 ? Math.min(100, (c.currentVolumeCbm / c.maxVolumeCbm) * 100) : 0;
  const volColor = volPct >= 90 ? '#ef4444' : volPct >= 70 ? '#f59e0b' : '#16a34a';

  return (
    <div
      className="cn-mobile-card"
      style={{ opacity: deleteLoadingId === c.id ? 0.5 : 1 }}
      onClick={() => onView(c)}
    >
      {/* Top row: number + status */}
      <div className="cn-mobile-card__top">
        <div className="cn-mobile-card__number">{c.containerNumber}</div>
        <StatusBadge status={c.status} statusName={c.statusName} />
      </div>

      {/* Route */}
      {(c.originPort || c.destinationPort) && (
        <div className="cn-mobile-card__route">
          {c.originPort && c.destinationPort
            ? `${c.originPort} → ${c.destinationPort}`
            : c.originPort || c.destinationPort}
        </div>
      )}

      {/* Volume bar */}
      <div className="cn-mobile-card__vol-label">
        Volume: {c.currentVolumeCbm} / {c.maxVolumeCbm} CBM
      </div>
      <div className="cn-progress__bar" style={{ marginBottom: 8 }}>
        <div className="cn-progress__fill" style={{ width: `${volPct}%`, background: volColor }} />
      </div>

      {/* Meta row */}
      <div className="cn-mobile-card__meta">
        <span>📦 {c.itemCount} items</span>
        <span style={{ color: '#16a34a', fontWeight: 600 }}>${c.totalShippingCost.toLocaleString()}</span>
        {c.expectedArrival && (
          <span>🗓 {new Date(c.expectedArrival).toLocaleDateString()}</span>
        )}
      </div>

      {/* Actions */}
      <div className="cn-mobile-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="cn-btn cn-btn--view"
          disabled={viewLoadingId === c.id}
          onClick={(e) => { e.stopPropagation(); onView(c); }}
          style={{ flex: 1 }}
        >
          {viewLoadingId === c.id ? <Spinner /> : 'View Details'}
        </button>

        {(isAdmin || isSupport || isOffice) && (
          <StatusPopover
            containerId={c.id}
            currentStatus={c.status}
            isUpdating={updatingStatusId === c.id}
            onSelect={onStatusSelect}
          />
        )}

        {isAdmin && (
          <button
            className="cn-btn cn-btn--delete"
            disabled={deleteLoadingId === c.id}
            onClick={(e) => onDelete(c, e)}
          >
            {deleteLoadingId === c.id ? '…' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────
const ContainersPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';

  const isAdmin = role === 'Admin';
  const isSupport = role === 'Support';
  const isOffice = role === 'ImportOffice';

  const [containers, setContainers] = useState<ContainerListItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' }>({ msg: '' });
  const [statusFilter, setStatusFilter] = useState(-1);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [detailContainer, setDetailContainer] = useState<ContainerDto | null>(null);
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<ContainerListItemDto | null>(null);  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3500);
  };

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: statusFilter >= 0 ? statusFilter : undefined,
        page,
        pageSize: PAGE_SIZE,
      };
      const res = (isAdmin || isSupport)
        ? await ContainerService.getAllContainers(params)
        : await ContainerService.getOfficeContainers(params);

      if (res.isSuccess) {
        setContainers(res.data?.items ?? []);
        setTotalCount(res.data?.totalCount ?? 0);
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to load containers.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, isAdmin, isSupport]);

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  const openDetail = async (c: ContainerListItemDto) => {
    if (viewLoadingId === c.id) return;
    setViewLoadingId(c.id);
    try {
      const res = await ContainerService.getById(c.id);
      if (res.isSuccess) setDetailContainer(res.data);
      else showToast(res.message, 'error');
    } catch {
      showToast('Failed to load container details.', 'error');
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleDelete = async (c: ContainerListItemDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete container ${c.containerNumber}?`)) return;
    setDeleteLoadingId(c.id);
    try {
      const res = await ContainerService.delete(c.id);
      if (res.isSuccess) { showToast('Container deleted.'); fetchContainers(); }
      else showToast(res.message, 'error');
    } catch {
      showToast('Failed to delete container.', 'error');
    } finally {
      setDeleteLoadingId(null);
    }
  };

// في ContainersPage.tsx — غيّر handleStatusSelect
const handleStatusSelect = async (containerId: string, newStatus: number, e: React.MouseEvent) => {
  e.stopPropagation();
  
  // Open status — بيفتح الـ close endpoint مباشرة (مفيش location)
  if (newStatus === 1) {
    setUpdatingStatusId(containerId);
    try {
      const res = await ContainerService.close(containerId);
      if (res.isSuccess) { showToast('Container closed.'); fetchContainers(); }
      else showToast(res.message, 'error');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
    return;
  }
const container = containers.find((c) => c.id === containerId);
if (container) {
  setStatusUpdateTarget(container);
}
};
  const stats = {
    total: totalCount,
    open: containers.filter((c) => c.status === 0).length,
    shipped: containers.filter((c) => c.status === 2).length,
    delivered: containers.filter((c) => c.status === 6).length,
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterChange = (v: number) => { setStatusFilter(v); setPage(1); };

  const emptyState = (
    <div className="cn-empty">
      <div className="cn-empty__icon">🚢</div>
      <p className="cn-empty__text">
        {statusFilter >= 0
          ? `No ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label} containers`
          : 'No containers found'}
      </p>
      {isOffice && (
        <button className="cn-btn cn-btn--primary" style={{ marginTop: 10 }} onClick={() => setCreateOpen(true)}>
          + Create your first container
        </button>
      )}
    </div>
  );

  const pagination = !loading && totalCount > PAGE_SIZE && (
    <div className="cn-pagination">
      <button className="cn-pagination__btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
      <span className="cn-pagination__info">Page {page} of {totalPages} · {totalCount} total</span>
      <button className="cn-pagination__btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
    </div>
  );

  return (
    <div className="cn-page">
      {/* ── Header ── */}
      <div className="cn-header">
        <div>
          <h1 className="cn-header__title">Containers</h1>
          <p className="cn-header__sub">
            {isAdmin || isSupport
              ? 'Manage all shipping containers across the platform'
              : 'Manage your shipping containers and track cargo'}
          </p>
        </div>
        {isOffice && (
          <button className="cn-btn cn-btn--primary" onClick={() => setCreateOpen(true)}>
            + New Container
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="cn-stats">
        <div className="cn-stat">
          <div className="cn-stat__value">{stats.total}</div>
          <div className="cn-stat__label">Total</div>
        </div>
        <div className="cn-stat">
          <div className="cn-stat__value" style={{ color: '#16a34a' }}>{stats.open}</div>
          <div className="cn-stat__label">Open</div>
        </div>
        <div className="cn-stat">
          <div className="cn-stat__value" style={{ color: '#1d4ed8' }}>{stats.shipped}</div>
          <div className="cn-stat__label">Shipped</div>
        </div>
        <div className="cn-stat">
          <div className="cn-stat__value" style={{ color: '#6d28d9' }}>{stats.delivered}</div>
          <div className="cn-stat__label">Delivered</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="cn-filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`cn-filter-btn${statusFilter === f.value ? ' cn-filter-btn--active' : ''}`}
            onClick={() => handleFilterChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="cn-alert cn-alert--error" style={{ marginBottom: 14 }}>{error}</div>}

      {/* ── Desktop Table ── */}
      <div className="cn-card cn-desktop-only">
        <div className="cn-table-wrap">
          <table className="cn-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Container</th>
                <th>Status</th>
                <th>Volume</th>
                <th>Items</th>
                <th>Expected Arrival</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : containers.length === 0 ? (
                <tr><td colSpan={8}>{emptyState}</td></tr>
              ) : (
                containers.map((c, idx) => (
                  <tr key={c.id} onClick={() => openDetail(c)} style={{ opacity: deleteLoadingId === c.id ? 0.5 : 1 }}>
                    <td style={{ color: '#9ca3af', fontWeight: 600, fontSize: 12 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{c.containerNumber}</div>
                      <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                        {c.originPort && c.destinationPort ? `${c.originPort} → ${c.destinationPort}` : c.originPort || c.destinationPort || '—'}
                      </div>
                    </td>
                    <td><StatusBadge status={c.status} statusName={c.statusName} /></td>
                    <td><ProgressBar current={c.currentVolumeCbm} max={c.maxVolumeCbm} /></td>
                    <td style={{
                      fontWeight: 600,
                      color: '#374151',
                      textAlign: 'center',
                      display: 'table-cell',
                      verticalAlign: 'middle',
                      width: '60px' 
                    }}>
                      {c.itemCount}
                    </td>                    <td style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {c.expectedArrival ? new Date(c.expectedArrival).toLocaleDateString() : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="cn-actions" style={{ gap: 6 }}>
                        <button
                          className="cn-btn cn-btn--view"
                          disabled={viewLoadingId === c.id}
                          onClick={(e) => { e.stopPropagation(); openDetail(c); }}
                          style={{ minWidth: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        >
                          {viewLoadingId === c.id ? <Spinner /> : 'View'}
                        </button>
                        {(isAdmin || isSupport || isOffice) && (
                          <StatusPopover
                            containerId={c.id}
                            currentStatus={c.status}
                            isUpdating={updatingStatusId === c.id}
                            onSelect={handleStatusSelect}
                          />
                        )}
                        {isAdmin && (
                          <button
                            className="cn-btn cn-btn--delete"
                            disabled={deleteLoadingId === c.id}
                            onClick={(e) => handleDelete(c, e)}
                          >
                            {deleteLoadingId === c.id ? '…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="cn-mobile-only">
        {loading ? (
          <div className="cn-mobile-list"><SkeletonCards /></div>
        ) : containers.length === 0 ? (
          <div className="cn-card">{emptyState}</div>
        ) : (
          <div className="cn-mobile-list">
            {containers.map((c, idx) => (
              <MobileCard
                key={c.id}
                c={c}
                idx={(page - 1) * PAGE_SIZE + idx}
                isAdmin={isAdmin}
                isOffice={isOffice}
                isSupport={isSupport}
                viewLoadingId={viewLoadingId}
                deleteLoadingId={deleteLoadingId}
                updatingStatusId={updatingStatusId}
                onView={openDetail}
                onDelete={handleDelete}
                onStatusSelect={handleStatusSelect}
              />
            ))}
          </div>
        )}
        {pagination}
      </div>

      {/* ── Modals ── */}
      {createOpen && (
        <CreateContainerModal
          onClose={() => setCreateOpen(false)}
          onSuccess={(msg) => { setCreateOpen(false); showToast(msg); fetchContainers(); }}
        />
      )}

      {detailContainer && (
        <ContainerDetailModal
          container={detailContainer}
          role={role}
          onClose={() => setDetailContainer(null)}
          onAction={() => { setDetailContainer(null); fetchContainers(); }}
          showToast={showToast}
        />
      )}
      {/* زود في الـ modals section */}
{statusUpdateTarget && (
  <ContainerStatusUpdateModal
    container={statusUpdateTarget}
    onClose={() => setStatusUpdateTarget(null)}
    onSuccess={(msg) => {
      setStatusUpdateTarget(null);
      showToast(msg);
      fetchContainers();
    }}
  />
)}

      {toast.msg && (
        <div className={`cn-toast cn-toast--${toast.type ?? 'success'}`}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes cnSpin { to { transform: rotate(360deg); } }
        @keyframes cnPopoverIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ContainersPage;