import React from 'react';
import type { ImportRequestDto } from '../types/importRequests';
import './ImportRequestsPage.css';

const SHIPMENT_STAGES = [
  'Purchased', 'Processing', 'ReadyToShip', 'Shipped',
  'InTransit', 'ArrivedPort', 'Customs', 'OutForDelivery', 'Delivered',
];

const STATUS_BADGE_CLASS: Record<string, string> = {
  Pending: 'ir-badge--pending',
  Approved: 'ir-badge--approved',
  Rejected: 'ir-badge--rejected',
  Processing: 'ir-badge--processing',
  Shipped: 'ir-badge--shipped',
  Customs: 'ir-badge--customs',
  OutForDelivery: 'ir-badge--outfordelivery',
  Delivered: 'ir-badge--delivered',
  Cancelled: 'ir-badge--cancelled',
};

interface Props {
  request: ImportRequestDto;
  role: string;
  onClose: () => void;
  onAction: () => void;
  showToast: (msg: string) => void;
}

const RequestDetailModal: React.FC<Props> = ({ request: req, onClose }) => {
  const stageIdx = req.tracking
    ? SHIPMENT_STAGES.indexOf(req.tracking.currentStage)
    : -1;

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal ir-modal--lg" onClick={(e) => e.stopPropagation()}>
        <div className="ir-modal__header">
          <h2 className="ir-modal__title">Request Details</h2>
          <button className="ir-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ir-modal__body">
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`ir-badge ${STATUS_BADGE_CLASS[req.status] ?? ''}`}>
              <span className="ir-badge__dot" />
              {req.status}
            </span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {req.shipmentType === 'FullContainer' ? '🚢 Full Container Load' : '📦 LCL'}
            </span>
          </div>

          {/* Basic Info */}
          <p className="ir-section-heading">Request Info</p>
          <div className="ir-detail-grid">
            <div className="ir-detail-item">
              <span className="ir-detail-label">Product</span>
              <span className="ir-detail-value">{req.productName ?? req.productId}</span>
            </div>
            <div className="ir-detail-item">
              <span className="ir-detail-label">Quantity</span>
              <span className="ir-detail-value">{req.quantity.toLocaleString()} units</span>
            </div>
            <div className="ir-detail-item">
              <span className="ir-detail-label">Total Weight</span>
              <span className="ir-detail-value">{req.totalWeightKg} kg</span>
            </div>
            <div className="ir-detail-item">
              <span className="ir-detail-label">Total Volume</span>
              <span className="ir-detail-value">{req.totalVolumeCbm} m³</span>
            </div>
            <div className="ir-detail-item">
              <span className="ir-detail-label">Assigned Office</span>
              <span className="ir-detail-value">{req.assignedOfficeName ?? '—'}</span>
            </div>
            <div className="ir-detail-item">
              <span className="ir-detail-label">Requested Delivery</span>
              <span className="ir-detail-value">
                {req.requestedDeliveryDate ? new Date(req.requestedDeliveryDate).toLocaleDateString() : '—'}
              </span>
            </div>
            <div className="ir-detail-item ir-detail-item--full">
              <span className="ir-detail-label">Shipping Address</span>
              <span className="ir-detail-value">{req.shippingAddress}</span>
            </div>
            {req.specialInstructions && (
              <div className="ir-detail-item ir-detail-item--full">
                <span className="ir-detail-label">Special Instructions</span>
                <span className="ir-detail-value">{req.specialInstructions}</span>
              </div>
            )}
            {req.rejectionReason && (
              <div className="ir-detail-item ir-detail-item--full">
                <span className="ir-detail-label" style={{ color: '#dc2626' }}>Rejection Reason</span>
                <span className="ir-detail-value" style={{ color: '#dc2626' }}>{req.rejectionReason}</span>
              </div>
            )}
          </div>

          {/* Tracking */}
          {req.tracking && (
            <>
              <p className="ir-section-heading">Shipment Tracking</p>
              <div className="ir-detail-grid" style={{ marginBottom: 12 }}>
                {req.tracking.trackingNumber && (
                  <div className="ir-detail-item">
                    <span className="ir-detail-label">Tracking #</span>
                    <span className="ir-detail-value" style={{ fontFamily: 'monospace' }}>{req.tracking.trackingNumber}</span>
                  </div>
                )}
                {req.tracking.carrierName && (
                  <div className="ir-detail-item">
                    <span className="ir-detail-label">Carrier</span>
                    <span className="ir-detail-value">{req.tracking.carrierName}</span>
                  </div>
                )}
                {req.tracking.currentLocation && (
                  <div className="ir-detail-item">
                    <span className="ir-detail-label">Current Location</span>
                    <span className="ir-detail-value">{req.tracking.currentLocation}</span>
                  </div>
                )}
                {req.tracking.estimatedDeliveryDate && (
                  <div className="ir-detail-item">
                    <span className="ir-detail-label">Est. Delivery</span>
                    <span className="ir-detail-value">{new Date(req.tracking.estimatedDeliveryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="ir-tracking">
                {SHIPMENT_STAGES.map((stage, i) => {
                  const isActive = i <= stageIdx;
                  const isCurrent = i === stageIdx;
                  return (
                    <div key={stage} className="ir-tracking-step">
                      <div className="ir-tracking-step__line">
                        <div className={`ir-tracking-step__dot${isActive ? ' ir-tracking-step__dot--active' : ''}`}
                          style={isCurrent ? { boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' } : undefined}
                        />
                        {i < SHIPMENT_STAGES.length - 1 && <div className="ir-tracking-step__connector" />}
                      </div>
                      <div className="ir-tracking-step__content">
                        <span className={isActive ? 'ir-tracking-step__stage' : 'ir-tracking-step__stage--inactive'}>
                          {stage}
                          {isCurrent && <span style={{ marginLeft: 6, fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>Current</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Cost Calculation */}
          {req.costCalculation && (
            <>
              <p className="ir-section-heading">Cost Breakdown</p>
              <div className="ir-detail-grid">
                {[
                  ['Base Shipping', req.costCalculation.baseShippingCost],
                  ['Customs Duty', req.costCalculation.customsDuty],
                  ['Tax', req.costCalculation.taxAmount],
                  ['Insurance', req.costCalculation.insuranceCost],
                  ['Handling Fee', req.costCalculation.handlingFee],
                  ['Other Fees', req.costCalculation.otherFees],
                ].map(([label, val]) => (
                  <div key={label as string} className="ir-detail-item">
                    <span className="ir-detail-label">{label}</span>
                    <span className="ir-detail-value">
                      {(val as number).toFixed(2)} {req.costCalculation!.currency}
                    </span>
                  </div>
                ))}
                {req.costCalculation.discountAmount > 0 && (
                  <div className="ir-detail-item">
                    <span className="ir-detail-label" style={{ color: '#16a34a' }}>Discount</span>
                    <span className="ir-detail-value" style={{ color: '#16a34a' }}>
                      -{req.costCalculation.discountAmount.toFixed(2)} {req.costCalculation.currency}
                    </span>
                  </div>
                )}
                <div className="ir-detail-item ir-detail-item--full" style={{ borderTop: '1px solid #d1fae5', paddingTop: 10, marginTop: 4 }}>
                  <span className="ir-detail-label">Final Amount</span>
                  <span className="ir-detail-value" style={{ fontSize: 18, fontWeight: 700, color: '#14532d' }}>
                    {req.costCalculation.finalAmount.toFixed(2)} {req.costCalculation.currency}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Timestamps */}
          <div style={{ display: 'flex', gap: 20, fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
            <span>Created: {new Date(req.createdAt).toLocaleString()}</span>
            {req.updatedAt && <span>Updated: {new Date(req.updatedAt).toLocaleString()}</span>}
          </div>
        </div>

        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailModal;