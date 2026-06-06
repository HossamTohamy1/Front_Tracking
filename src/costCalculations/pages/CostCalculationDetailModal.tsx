import React, { useState } from 'react';
import { CostCalculationService } from '../CostCalculationService';
import type { CostCalculationDto } from '../types/costCalculations';
import PaymentModal from '../../payments/Paymentmodal';
import './CostCalculationsPage.css';

interface Props {
  calc: CostCalculationDto;
  role: string;
  onClose: () => void;
  onAction: (updated: CostCalculationDto) => void;
  onPaymentSuccess?: () => void; // called after successful payment
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const CostCalculationDetailModal: React.FC<Props> = ({
  calc,
  role,
  onClose,
  onAction,
  onPaymentSuccess,
  showToast,
}) => {
  const isOffice   = role === 'ImportOffice';
  const isAdmin    = role === 'Admin';
  const isCustomer = role === 'Customer';

  const canEdit     = isOffice && !calc.isLocked;
  const canDiscount = (isAdmin || isOffice) && !calc.isLocked;
  // Customer can pay only if: cost is set, not yet paid, has a final amount
  const canPay = isCustomer && !calc.isLocked && calc.finalAmount > 0;

  const [tab, setTab]             = useState<'breakdown' | 'edit' | 'discount'>('breakdown');
  const [loading, setLoading]     = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    baseShippingCost: String(calc.baseShippingCost),
    customsDuty:      String(calc.customsDuty),
    taxAmount:        String(calc.taxAmount),
    insuranceCost:    String(calc.insuranceCost),
    handlingFee:      String(calc.handlingFee),
    otherFees:        String(calc.otherFees),
    currency:         calc.currency,
    notes:            calc.notes ?? '',
  });

  // Discount form state
  const [discountForm, setDiscountForm] = useState({
    discountAmount: String(calc.discountAmount),
    notes:          calc.notes ?? '',
  });

  const setEdit = (k: string, v: string) =>
    setEditForm((f) => ({ ...f, [k]: v }));
  const setDisc = (k: string, v: string) =>
    setDiscountForm((f) => ({ ...f, [k]: v }));

  // Derived preview totals from edit form
  const previewTotal =
    (Number(editForm.baseShippingCost) || 0) +
    (Number(editForm.customsDuty)      || 0) +
    (Number(editForm.taxAmount)        || 0) +
    (Number(editForm.insuranceCost)    || 0) +
    (Number(editForm.handlingFee)      || 0) +
    (Number(editForm.otherFees)        || 0);

  const handleSaveCosts = async () => {
    setLoading(true);
    try {
      const res = await CostCalculationService.updateCostComponents(
        calc.importRequestId,
        {
          baseShippingCost: Number(editForm.baseShippingCost),
          customsDuty:      Number(editForm.customsDuty),
          taxAmount:        Number(editForm.taxAmount),
          insuranceCost:    Number(editForm.insuranceCost),
          handlingFee:      Number(editForm.handlingFee),
          otherFees:        Number(editForm.otherFees),
          currency:         editForm.currency,
          notes:            editForm.notes || undefined,
        }
      );
      if (res.isSuccess) {
        showToast('Cost components updated.');
        onAction(res.data);
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to update costs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDiscount = async () => {
    const discountVal = Number(discountForm.discountAmount) || 0;

    // ✅ Client-side guard matching backend validation
    if (discountVal < 0) {
      showToast('Discount cannot be negative.', 'error');
      return;
    }
    if (discountVal > calc.totalBeforeDiscount) {
      showToast('Discount cannot exceed the total amount.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await CostCalculationService.updateDiscount(
        calc.importRequestId,
        {
          discountAmount: discountVal,
          notes:          discountForm.notes || undefined,
        }
      );
      if (res.isSuccess) {
        showToast('Discount applied.');
        onAction(res.data); 
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to apply discount.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number, currency = calc.currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

  const fmtDate = (v?: string | null) =>
    v
      ? new Date(v).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        })
      : '—';

  const tabs = [
    { key: 'breakdown', label: 'Cost Breakdown' },
    ...(canEdit     ? [{ key: 'edit',     label: 'Edit Costs' }] : []),
    ...(canDiscount ? [{ key: 'discount', label: 'Discount'   }] : []),
  ] as const;

  return (
    <>
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal cc-modal--wide" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="cc-modal__header">
          <div>
            <h2 className="cc-modal__title">Cost Calculation</h2>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
              Request #{calc.requestNumber || calc.importRequestId.slice(0, 8) + '…'}
              {calc.customerName && (
                <span style={{ marginLeft: 8, color: '#374151', fontWeight: 500 }}>
                  · {calc.customerName}
                </span>
              )}
            </div>
            {calc.isLocked && (
              <span className="cc-badge cc-badge--locked" style={{ marginTop: 6, display: 'inline-flex' }}>
                🔒 Locked — payment completed
              </span>
            )}
          </div>
          <button className="cc-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Tab bar */}
        <div className="cc-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`cc-tab${tab === t.key ? ' cc-tab--active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="cc-modal__body">

          {/* ── BREAKDOWN TAB ── */}
          {tab === 'breakdown' && (
            <>
              {/* Final amount hero */}
              <div className="cc-hero">
                <div className="cc-hero__label">Final Amount</div>
                <div className="cc-hero__amount">{fmt(calc.finalAmount)}</div>
                {calc.discountAmount > 0 && (
                  <div className="cc-hero__sub">
                    Saved {fmt(calc.discountAmount)} · Before discount: {fmt(calc.totalBeforeDiscount)}
                  </div>
                )}
              </div>

              {/* Pay Now button — Customer only */}
              {canPay && (
                <button
                  onClick={() => setShowPayment(true)}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    border: 'none',
                    borderRadius: 12,
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'background 0.15s',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#16a34a')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Pay {fmt(calc.finalAmount, calc.currency)}
                </button>
              )}

              {/* Already paid badge */}
              {isCustomer && calc.isLocked && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  fontSize: 13.5,
                  color: '#15803d',
                  fontWeight: 600,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Payment completed — your shipment is being processed
                </div>
              )}

              {/* Cost breakdown rows */}
              <div className="cc-breakdown">
                {[
                  { label: 'Base Shipping Cost', value: calc.baseShippingCost, icon: '🚢' },
                  { label: 'Customs Duty',        value: calc.customsDuty,      icon: '🏛️' },
                  { label: 'Tax Amount',           value: calc.taxAmount,        icon: '📋' },
                  { label: 'Insurance',            value: calc.insuranceCost,    icon: '🛡️' },
                  { label: 'Handling Fee',         value: calc.handlingFee,      icon: '⚙️' },
                  { label: 'Other Fees',           value: calc.otherFees,        icon: '💼' },
                ].map((row) => (
                  <div className="cc-breakdown__row" key={row.label}>
                    <span className="cc-breakdown__icon">{row.icon}</span>
                    <span className="cc-breakdown__label">{row.label}</span>
                    <span className="cc-breakdown__bar-wrap">
                      <span
                        className="cc-breakdown__bar"
                        style={{
                          width: calc.totalBeforeDiscount > 0
                            ? `${Math.min(100, (row.value / calc.totalBeforeDiscount) * 100)}%`
                            : '0%',
                        }}
                      />
                    </span>
                    <span className="cc-breakdown__value">{fmt(row.value)}</span>
                  </div>
                ))}

                <div className="cc-breakdown__divider" />

                <div className="cc-breakdown__row cc-breakdown__row--total">
                  <span className="cc-breakdown__icon">Σ</span>
                  <span className="cc-breakdown__label">Total Before Discount</span>
                  <span className="cc-breakdown__bar-wrap" />
                  <span className="cc-breakdown__value">{fmt(calc.totalBeforeDiscount)}</span>
                </div>

                {calc.discountAmount > 0 && (
                  <div className="cc-breakdown__row cc-breakdown__row--discount">
                    <span className="cc-breakdown__icon">🎁</span>
                    <span className="cc-breakdown__label">Discount</span>
                    <span className="cc-breakdown__bar-wrap" />
                    <span className="cc-breakdown__value">−{fmt(calc.discountAmount)}</span>
                  </div>
                )}

                <div className="cc-breakdown__row cc-breakdown__row--final">
                  <span className="cc-breakdown__icon">✅</span>
                  <span className="cc-breakdown__label">Final Amount</span>
                  <span className="cc-breakdown__bar-wrap" />
                  <span className="cc-breakdown__value">{fmt(calc.finalAmount)}</span>
                </div>
              </div>

              <hr className="cc-divider" />

              {/* Meta info */}
              <div className="cc-detail-grid">
                <div className="cc-detail-item">
                  <div className="cc-detail-item__label">Weight</div>
                  <div className="cc-detail-item__value">{calc.weightKg} kg</div>
                </div>
                <div className="cc-detail-item">
                  <div className="cc-detail-item__label">Volume</div>
                  <div className="cc-detail-item__value">{calc.volumeCbm} CBM</div>
                </div>
                <div className="cc-detail-item">
                  <div className="cc-detail-item__label">Currency</div>
                  <div className="cc-detail-item__value">{calc.currency}</div>
                </div>
                <div className="cc-detail-item">
                  <div className="cc-detail-item__label">Created</div>
                  <div className="cc-detail-item__value">{fmtDate(calc.createdAt)}</div>
                </div>
                {calc.updatedAt && (
                  <div className="cc-detail-item">
                    <div className="cc-detail-item__label">Last Updated</div>
                    <div className="cc-detail-item__value">{fmtDate(calc.updatedAt)}</div>
                  </div>
                )}
              </div>

              {calc.notes && (
                <div className="cc-notes">
                  <div className="cc-notes__label">Notes</div>
                  <div className="cc-notes__text">{calc.notes}</div>
                </div>
              )}
            </>
          )}

          {/* ── EDIT COSTS TAB ── */}
          {tab === 'edit' && (
            <>
              <div className="cc-form-row">
                {[
                  { key: 'baseShippingCost', label: 'Base Shipping Cost' },
                  { key: 'customsDuty',      label: 'Customs Duty'       },
                  { key: 'taxAmount',        label: 'Tax Amount'          },
                  { key: 'insuranceCost',    label: 'Insurance Cost'      },
                  { key: 'handlingFee',      label: 'Handling Fee'        },
                  { key: 'otherFees',        label: 'Other Fees'          },
                ].map((field) => (
                  <div className="cc-form-group" key={field.key}>
                    <label className="cc-form-label">{field.label}</label>
                    <input
                      className="cc-form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={(editForm as any)[field.key]}
                      onChange={(e) => setEdit(field.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label className="cc-form-label">Currency</label>
                  <select
                    className="cc-form-select"
                    value={editForm.currency}
                    onChange={(e) => setEdit('currency', e.target.value)}
                  >
                    {['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live preview */}
              <div className="cc-preview">
                <div className="cc-preview__title">Live Preview</div>
                <div className="cc-preview__row">
                  <span>Total Before Discount</span>
                  <strong>{fmt(previewTotal, editForm.currency)}</strong>
                </div>
                <div className="cc-preview__row">
                  <span>Current Discount</span>
                  <strong style={{ color: '#dc2626' }}>−{fmt(calc.discountAmount, editForm.currency)}</strong>
                </div>
                <div className="cc-preview__row cc-preview__row--final">
                  <span>Final Amount</span>
                  <strong style={{ color: '#16a34a', fontSize: 16 }}>
                    {fmt(Math.max(0, previewTotal - calc.discountAmount), editForm.currency)}
                  </strong>
                </div>
              </div>

              <div className="cc-form-group">
                <label className="cc-form-label">Notes</label>
                <textarea
                  className="cc-form-input cc-form-textarea"
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEdit('notes', e.target.value)}
                  placeholder="Optional notes…"
                />
              </div>
            </>
          )}

          {/* ── DISCOUNT TAB ── */}
          {tab === 'discount' && (
            <>
              <div className="cc-hero cc-hero--discount">
                <div className="cc-hero__label">Current Discount</div>
                <div className="cc-hero__amount" style={{ color: '#dc2626' }}>
                  −{fmt(calc.discountAmount)}
                </div>
                <div className="cc-hero__sub">
                  Final after discount: {fmt(calc.finalAmount)}
                </div>
              </div>

              <div className="cc-form-group">
                <label className="cc-form-label">New Discount Amount ({calc.currency})</label>
                <input
                  className="cc-form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  max={calc.totalBeforeDiscount}
                  value={discountForm.discountAmount}
                  onChange={(e) => setDisc('discountAmount', e.target.value)}
                />
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Max: {fmt(calc.totalBeforeDiscount)} (full amount)
                </div>
              </div>

              {/* Discount preview */}
              <div className="cc-preview">
                <div className="cc-preview__title">After Applying Discount</div>
                <div className="cc-preview__row">
                  <span>Total Before Discount</span>
                  <strong>{fmt(calc.totalBeforeDiscount)}</strong>
                </div>
                <div className="cc-preview__row">
                  <span>New Discount</span>
                  <strong style={{ color: '#dc2626' }}>
                    −{fmt(Number(discountForm.discountAmount) || 0)}
                  </strong>
                </div>
                <div className="cc-preview__row cc-preview__row--final">
                  <span>New Final Amount</span>
                  <strong style={{ color: '#16a34a', fontSize: 16 }}>
                    {fmt(Math.max(0, calc.totalBeforeDiscount - (Number(discountForm.discountAmount) || 0)))}
                  </strong>
                </div>
              </div>

              <div className="cc-form-group">
                <label className="cc-form-label">Notes</label>
                <textarea
                  className="cc-form-input cc-form-textarea"
                  rows={3}
                  value={discountForm.notes}
                  onChange={(e) => setDisc('notes', e.target.value)}
                  placeholder="Reason for discount…"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cc-modal__footer">
          <button className="cc-btn cc-btn--cancel-outline" onClick={onClose} disabled={loading}>
            Close
          </button>
          {tab === 'edit' && canEdit && (
            <button className="cc-btn cc-btn--primary" onClick={handleSaveCosts} disabled={loading}>
              {loading ? 'Saving…' : '💾 Save Costs'}
            </button>
          )}
          {tab === 'discount' && canDiscount && (
            <button className="cc-btn cc-btn--primary" onClick={handleSaveDiscount} disabled={loading}>
              {loading ? 'Applying…' : '🎁 Apply Discount'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Payment Modal — rendered outside main modal to avoid stacking issues */}
    {showPayment && (
      <PaymentModal
        calc={calc}
        onClose={() => setShowPayment(false)}
        onSuccess={() => {
          setShowPayment(false);
          onPaymentSuccess?.();
          onClose();
        }}
        showToast={showToast}
      />
    )}
  </>
  );
};

export default CostCalculationDetailModal;