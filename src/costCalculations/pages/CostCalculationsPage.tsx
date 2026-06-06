import React, { useState, useEffect, useCallback } from 'react';
import { CostCalculationService } from '../CostCalculationService';
import type { CostCalculationDto } from '../types/costCalculations';
import { useAuth } from '../../auth/AuthContext';
import './CostCalculationsPage.css';
import CostCalculationDetailModal from './CostCalculationDetailModal';

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

const SkeletonRows: React.FC<{ cols: number }> = ({ cols }) => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((__, j) => (
          <td key={j}>
            <div className="cc-skeleton" style={{ width: j === 0 ? 28 : j === cols - 1 ? 90 : '70%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const SkeletonCards: React.FC = () => (
  <>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="cc-mobile-card cc-mobile-card--skeleton">
        <div className="cc-skeleton" style={{ width: '55%', height: 14, marginBottom: 8 }} />
        <div className="cc-skeleton" style={{ width: '35%', height: 12, marginBottom: 14 }} />
        <div className="cc-skeleton" style={{ width: '40%', height: 22 }} />
      </div>
    ))}
  </>
);

const fmt = (v: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

// ── Mobile Card ───────────────────────────────────────────────────────────────

interface MobileCardProps {
  calc: CostCalculationDto;
  idx: number;
  page: number;
  isAdmin: boolean;
  isOffice: boolean;
  isCustomer: boolean;
  onView: () => void;
}

const MobileCard: React.FC<MobileCardProps> = ({
  calc, idx, page, isAdmin, isOffice, isCustomer, onView,
}) => (
  <div className="cc-mobile-card" onClick={onView}>
    <div className="cc-mobile-card__top">
      <div className="cc-mobile-card__num">#{(page - 1) * PAGE_SIZE + idx + 1}</div>
      <div className="cc-mobile-card__date">{fmtDate(calc.createdAt)}</div>
    </div>

    <div className="cc-mobile-card__id">
      {calc.requestNumber
        ? `#${calc.requestNumber}`
        : `#${calc.importRequestId.slice(0, 14)}…`}
    </div>

    {/* Customer لا يحتاج يشوف اسمه — بس Admin/Office يشوفوا اسم العميل */}
    {!isCustomer && calc.customerName && (
      <div className="cc-mobile-card__customer">👤 {calc.customerName}</div>
    )}

    <div className="cc-mobile-card__meta">
      <span>{calc.weightKg} kg</span>
      <span className="cc-mobile-card__dot">·</span>
      <span>{calc.volumeCbm} CBM</span>
      <span className="cc-mobile-card__dot">·</span>
      <span>{calc.currency}</span>
    </div>

    <div className="cc-mobile-card__amounts">
      {calc.discountAmount > 0 && (
        <div className="cc-mobile-card__before">
          {fmt(calc.totalBeforeDiscount, calc.currency)}
        </div>
      )}
      <div className="cc-mobile-card__final">{fmt(calc.finalAmount, calc.currency)}</div>
      {calc.discountAmount > 0 && (
        <span className="cc-discount-tag">−{fmt(calc.discountAmount, calc.currency)}</span>
      )}
    </div>

    {calc.isLocked && (
      <span className="cc-badge cc-badge--locked" style={{ alignSelf: 'flex-start' }}>
        🔒 Paid
      </span>
    )}

    <div className="cc-mobile-card__actions" onClick={(e) => e.stopPropagation()}>
      <button className="cc-btn cc-btn--view cc-btn--full" onClick={onView}>
        View Details
      </button>
      {(isAdmin || isOffice) && !calc.isLocked && (
        <button className="cc-btn cc-btn--discount cc-btn--full" onClick={onView}>
          🎁 Discount
        </button>
      )}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const CostCalculationsPage: React.FC = () => {
  const { user } = useAuth();
  const role      = user?.role ?? '';
  const isAdmin   = role === 'Admin';
  const isSupport = role === 'Support';
  const isOffice  = role === 'ImportOffice';
  const isCustomer = role === 'Customer';

  // Admin/Support/Office يشوفوا القائمة الكاملة
  // Customer يشوف بياناته فقط عبر /my endpoint
  const canSeeList = isAdmin || isSupport || isOffice || isCustomer;

  const [calcs, setCalcs]           = useState<CostCalculationDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currency, setCurrency]     = useState('');
  const [search, setSearch]         = useState('');

  const [selectedCalc, setSelectedCalc] = useState<CostCalculationDto | null>(null);
  const [toast, setToast] = useState<{ msg: string; type?: 'success' | 'error' }>({ msg: '' });
  const [stats, setStats] = useState({ total: 0, totalValue: 0, discounted: 0 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 3000);
  };

  const fetchCalcs = useCallback(async () => {
    if (!canSeeList) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = { page, pageSize: PAGE_SIZE, currency: currency || undefined };

      // Customer يستخدم /my — غيره يستخدم /admin
      const res = isCustomer
        ? await CostCalculationService.getMy(params)
        : await CostCalculationService.getAll(params);

      if (res.isSuccess && res.data) {
        const { items, totalCount: tc, totalPages: tp } = res.data;
        setCalcs(items);
        setTotalCount(tc);
        setTotalPages(tp);
        setStats({
          total:      tc,
          totalValue: items.reduce((s, c) => s + c.finalAmount, 0),
          discounted: items.filter((c) => c.discountAmount > 0).length,
        });
      } else {
        setError(res.message || 'Failed to load cost calculations.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  }, [page, currency, canSeeList, isCustomer]);

  useEffect(() => {
    fetchCalcs();
  }, [fetchCalcs]);

  const handleModalAction = (updated: CostCalculationDto) => {
    setCalcs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCalc(null);
  };

  // ── Customer لا يشوف الـ rows اللي لسه الـ ImportOffice معدلش عليها ─────────
  // إذا totalBeforeDiscount === 0 ده معناه إن الـ cost لسه 0 (freshly created)
  const visibleCalcs = isCustomer
    ? calcs.filter((c) => c.totalBeforeDiscount > 0)
    : calcs;

  const filtered = search.trim()
    ? visibleCalcs.filter(
        (c) =>
          (c.requestNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (c.customerName  ?? '').toLowerCase().includes(search.toLowerCase()) ||
          c.importRequestId.toLowerCase().includes(search.toLowerCase())
      )
    : visibleCalcs;

  // ── عناوين الـ table حسب الـ Role ────────────────────────────────────────
  // Customer لا يحتاج عمود Customer
  const tableHeaders = isCustomer
    ? ['#', 'Request', 'Before Discount', 'Discount', 'Final Amount', 'Status', 'Date', 'Actions']
    : ['#', 'Request', 'Customer', 'Before Discount', 'Discount', 'Final Amount', 'Date', 'Actions'];

  return (
    <div className="cc-page">

      {/* ── Header ── */}
      <div className="cc-header">
        <div>
          <h1 className="cc-header__title">
            {isCustomer ? '💰 My Cost Calculations' : '💰 Cost Calculations'}
          </h1>
          <p className="cc-header__sub">
            {isCustomer
              ? 'View shipping cost breakdowns for your shipments'
              : 'Manage shipping cost breakdowns and discounts'}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      {canSeeList && (
        <div className="cc-stats">
          <div className="cc-stat">
            <div className="cc-stat__value">{totalCount}</div>
            <div className="cc-stat__label">
              {isCustomer ? 'My Shipments' : 'Total Records'}
            </div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat__value cc-stat__value--green">
              {fmt(stats.totalValue)}
            </div>
            <div className="cc-stat__label">Total Value (page)</div>
          </div>
          <div className="cc-stat">
            <div className="cc-stat__value cc-stat__value--red">{stats.discounted}</div>
            <div className="cc-stat__label">With Discount</div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      {canSeeList && (
        <div className="cc-toolbar">
          <input
            className="cc-search"
            placeholder="🔍  Search by request #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="cc-currency-select"
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setPage(1); }}
          >
            <option value="">All Currencies</option>
            {['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="cc-alert cc-alert--error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      {/* ── Content ── */}
      {canSeeList && (
        <>
          {/* Desktop Table */}
          <div className="cc-card cc-table-visible">
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    {tableHeaders.map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows cols={tableHeaders.length} />
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={tableHeaders.length}>
                        <div className="cc-empty">
                          <div className="cc-empty__icon">💰</div>
                          <p className="cc-empty__text">
                            {search
                              ? 'No matching records found'
                              : isCustomer
                                ? 'No cost calculations yet for your shipments'
                                : 'No cost calculations yet'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c, idx) => (
                      <tr key={c.id} onClick={() => setSelectedCalc(c)}>

                        {/* # */}
                        <td style={{ color: '#9ca3af', fontWeight: 600, fontSize: 12 }}>
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>

                        {/* Request */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#111827', fontFamily: 'monospace', fontSize: 12.5 }}>
                            #{c.requestNumber || c.importRequestId.slice(0, 8) + '…'}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            {c.weightKg}kg · {c.volumeCbm}CBM
                          </div>
                        </td>

                        {/* Customer — مخفي عند Customer */}
                        {!isCustomer && (
                          <td style={{ color: '#374151', fontWeight: 500, fontSize: 13 }}>
                            {c.customerName || '—'}
                          </td>
                        )}

                        {/* Before Discount */}
                        <td>
                          {c.discountAmount > 0 ? (
                            <span className="cc-amount cc-amount--before">
                              {fmt(c.totalBeforeDiscount, c.currency)}
                            </span>
                          ) : (
                            <span style={{ color: '#374151', fontSize: 13 }}>
                              {fmt(c.totalBeforeDiscount, c.currency)}
                            </span>
                          )}
                        </td>

                        {/* Discount */}
                        <td>
                          {c.discountAmount > 0 ? (
                            <span className="cc-discount-tag">−{fmt(c.discountAmount, c.currency)}</span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Final Amount */}
                        <td>
                          <span className="cc-amount cc-amount--final">
                            {fmt(c.finalAmount, c.currency)}
                          </span>
                        </td>

                        {/* Status — للـ Customer فقط */}
                        {isCustomer && (
                          <td>
                            {c.isLocked ? (
                              <span className="cc-badge cc-badge--locked">🔒 Paid</span>
                            ) : (
                              <span className="cc-badge cc-badge--editable">⏳ Pending</span>
                            )}
                          </td>
                        )}

                        {/* Date */}
                        <td style={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {fmtDate(c.createdAt)}
                        </td>

                        {/* Actions */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="cc-actions">
                            <button
                              className="cc-btn cc-btn--view"
                              onClick={(e) => { e.stopPropagation(); setSelectedCalc(c); }}
                            >
                              View
                            </button>
                            {(isAdmin || isOffice) && !c.isLocked && (
                              <button
                                className="cc-btn cc-btn--discount"
                                onClick={(e) => { e.stopPropagation(); setSelectedCalc(c); }}
                              >
                                🎁 Discount
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

            {!loading && totalCount > PAGE_SIZE && (
              <div className="cc-pagination">
                <button
                  className="cc-pagination__btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="cc-pagination__info">
                  Page {page} of {totalPages} · {totalCount} total
                </span>
                <button
                  className="cc-pagination__btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="cc-cards-visible">
            {loading ? (
              <SkeletonCards />
            ) : filtered.length === 0 ? (
              <div className="cc-card">
                <div className="cc-empty">
                  <div className="cc-empty__icon">💰</div>
                  <p className="cc-empty__text">
                    {search
                      ? 'No matching records'
                      : isCustomer
                        ? 'No cost calculations yet for your shipments'
                        : 'No cost calculations yet'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {filtered.map((c, idx) => (
                  <MobileCard
                    key={c.id}
                    calc={c}
                    idx={idx}
                    page={page}
                    isAdmin={isAdmin}
                    isOffice={isOffice}
                    isCustomer={isCustomer}
                    onView={() => setSelectedCalc(c)}
                  />
                ))}
                {totalCount > PAGE_SIZE && (
                  <div className="cc-pagination">
                    <button
                      className="cc-pagination__btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Prev
                    </button>
                    <span className="cc-pagination__info">{page} / {totalPages}</span>
                    <button
                      className="cc-pagination__btn"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedCalc && (
        <CostCalculationDetailModal
          calc={selectedCalc}
          role={role}
          onClose={() => setSelectedCalc(null)}
          onAction={handleModalAction}
onPaymentSuccess={() => {
  setSelectedCalc(null);
  
  // ✅ Optimistic update: غير الـ status فوراً في الـ state
  if (selectedCalc) {
    setCalcs((prev) =>
      prev.map((c) =>
        c.id === selectedCalc.id
          ? { ...c, isLocked: true }
          : c
      )
    );
  }
  
  showToast("Payment successful ✅");
  
  setTimeout(() => {
    fetchCalcs();
  }, 3000);
}}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast.msg && (
        <div className={`cc-toast cc-toast--${toast.type ?? 'success'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default CostCalculationsPage;