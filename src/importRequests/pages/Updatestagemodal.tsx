import React, { useState } from 'react';
import { ImportRequestService } from '../ImportRequestService';
import type { ImportRequestListDto } from '../types/importRequests';
import type { UpdateStageDto } from '../types/importRequests';
import './ImportRequestsPage.css';


const STAGE_PIPELINE: {
  value: string;
  label: string;
  icon: string;
  description: string;
  fromStatus: string;   
}[] = [
  {
    value: 'Processing',
    label: 'Processing',
    icon: '⚙️',
    description: 'The shipment is being prepared and packed.',
    fromStatus: 'Approved',
  },
  {
    value: 'Shipped',
    label: 'Shipped',
    icon: '🚢',
    description: 'The shipment has left the origin port.',
    fromStatus: 'Processing',
  },
  {
    value: 'Customs',
    label: 'Customs',
    icon: '🏛️',
    description: 'The shipment has arrived at the destination port and is under customs clearance.',
    fromStatus: 'Shipped',
  },
  {
    value: 'OutForDelivery',
    label: 'Out for Delivery',
    icon: '🚚',
    description: 'The shipment has cleared customs and is on its way to the customer.',
    fromStatus: 'Customs',
  },
  {
    value: 'Delivered',
    label: 'Delivered',
    icon: '📦',
    description: 'The shipment has been delivered to the customer.',
    fromStatus: 'OutForDelivery',
  },
];

interface Props {
  request: ImportRequestListDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const UpdateStageModal: React.FC<Props> = ({ request, onClose, onSuccess }) => {
  const nextStage = STAGE_PIPELINE.find((s) => s.fromStatus === request.status);

  const [form, setForm] = useState({
    stage:                 nextStage?.value ?? '',
    location:              '',
    notes:                 '',
    trackingNumber:        '',
    carrierName:           '',
    estimatedDeliveryDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const selectedStageMeta = STAGE_PIPELINE.find((s) => s.value === form.stage);

  const handleSubmit = async () => {
    if (!form.stage) { setError('Please select a stage.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await ImportRequestService.updateStage(request.id, {
        stage:                form.stage as UpdateStageDto['stage'],
        location:             form.location || undefined,
        notes:                form.notes || undefined,
        trackingNumber:       form.trackingNumber || undefined,
        carrierName:          form.carrierName || undefined,
        estimatedDeliveryDate: form.estimatedDeliveryDate || undefined,
      });
      if (res.isSuccess) onSuccess(res.message || `Request moved to ${form.stage}.`);
      else setError(res.message);
    } catch {
      setError('Failed to update stage.');
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = !!nextStage;

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal ir-modal--lg" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="ir-modal__header">
          <h2 className="ir-modal__title">Update Shipment Stage</h2>
          <button className="ir-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ir-modal__body">
          {error && <div className="ir-alert ir-alert--error">{error}</div>}

          {/* Current status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600 }}>Current Status:</span>
            <span className={`ir-badge ir-badge--${request.status.toLowerCase()}`}>
              <span className="ir-badge__dot" />
              {request.status}
            </span>
            {canAdvance && (
              <>
                <span style={{ fontSize: 18, color: '#d1d5db' }}>→</span>
                <span className={`ir-badge ir-badge--${form.stage.toLowerCase()}`} style={{ opacity: form.stage ? 1 : 0.4 }}>
                  <span className="ir-badge__dot" />
                  {selectedStageMeta?.label ?? '…'}
                </span>
              </>
            )}
          </div>

          {!canAdvance ? (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: 10,
              padding: '16px 18px',
              fontSize: 13.5,
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>
                {request.status === 'Delivered' ? '🎉' : 'ℹ️'}
              </span>
              {request.status === 'Delivered'
                ? 'This shipment has already been delivered. No further updates needed.'
                : `The current status "${request.status}" cannot be advanced from this panel.`}
            </div>
          ) : (
            <>
              {/* Stage description card */}
              {selectedStageMeta && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #d1fae5',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{selectedStageMeta.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#14532d', fontSize: 13.5 }}>
                      Moving to: {selectedStageMeta.label}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#374151', marginTop: 3, lineHeight: 1.5 }}>
                      {selectedStageMeta.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage selector — shows only the valid next step, but allows skipping only if needed */}
              <div className="ir-form-group">
                <label className="ir-form-label">New Stage *</label>
                <select
                  className="ir-form-select"
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                >
                  582550
                  {STAGE_PIPELINE
                    .filter((s) => s.fromStatus === request.status)
                    .map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.icon} {s.label}
                      </option>
                    ))}
                </select>
                <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
                  The system only allows the next logical stage in the pipeline.
                </span>
              </div>

              <p className="ir-section-heading">Tracking Details (Optional)</p>

              <div className="ir-detail-grid">
                <div className="ir-form-group">
                  <label className="ir-form-label">Current Location</label>
                  <input
                    className="ir-form-input"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Port Said, Egypt"
                  />
                </div>

                <div className="ir-form-group">
                  <label className="ir-form-label">Tracking Number</label>
                  <input
                    className="ir-form-input"
                    value={form.trackingNumber}
                    onChange={(e) => setForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. MSC123456789"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                <div className="ir-form-group">
                  <label className="ir-form-label">Carrier / Shipping Line</label>
                  <input
                    className="ir-form-input"
                    value={form.carrierName}
                    onChange={(e) => setForm((f) => ({ ...f, carrierName: e.target.value }))}
                    placeholder="e.g. MSC, Maersk, CMA CGM"
                  />
                </div>

                <div className="ir-form-group">
                  <label className="ir-form-label">Estimated Delivery Date</label>
                  <input
                    className="ir-form-input"
                    type="date"
                    value={form.estimatedDeliveryDate}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedDeliveryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="ir-form-group">
                <label className="ir-form-label">Notes</label>
                <textarea
                  className="ir-form-textarea"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes for the customer or internal team..."
                  style={{ minHeight: 70 }}
                />
              </div>
            </>
          )}
        </div>

        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose} disabled={loading}>
            {canAdvance ? 'Cancel' : 'Close'}
          </button>
          {canAdvance && (
            <button
              className="ir-btn ir-btn--approve"
              onClick={handleSubmit}
              disabled={loading || !form.stage}
              style={{ padding: '8px 22px' }}
            >
              {loading
                ? 'Updating...'
                : `Move to ${selectedStageMeta?.label ?? '…'}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateStageModal;