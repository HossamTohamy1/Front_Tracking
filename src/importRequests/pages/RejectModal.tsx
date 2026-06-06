import React, { useState } from 'react';
import { ImportRequestService } from '../ImportRequestService';
import type { ImportRequestListDto } from '../types/importRequests';
import './ImportRequestsPage.css';

/* ─── Reject Modal ─── */
interface RejectProps {
  request: ImportRequestListDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const RejectModal: React.FC<RejectProps> = ({ request, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Rejection reason is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await ImportRequestService.reject(request.id, { rejectionReason: reason.trim() });
      if (res.isSuccess) onSuccess('Request rejected.');
      else setError(res.message);
    } catch {
      setError('Failed to reject request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ir-modal__header">
          <h2 className="ir-modal__title">Reject Request</h2>
          <button className="ir-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ir-modal__body">
          {error && <div className="ir-alert ir-alert--error">{error}</div>}
          <p style={{ margin: 0, fontSize: 13.5, color: '#374151' }}>
            You are rejecting the request for <strong>{request.productName ?? request.productId}</strong>.
            Please provide a clear reason for the customer.
          </p>
          <div className="ir-form-group">
            <label className="ir-form-label">Rejection Reason *</label>
            <textarea
              className="ir-form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this request cannot be processed..."
            />
          </div>
        </div>
        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="ir-btn ir-btn--reject" onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px' }}>
            {loading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;


/* ─── Assign Office Modal ─── */
interface AssignProps {
  request: ImportRequestListDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const AssignOfficeModal: React.FC<AssignProps> = ({ request, onClose, onSuccess }) => {
  const [officeId, setOfficeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!officeId.trim()) { setError('Office ID is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await ImportRequestService.assignOffice(request.id, { officeId: officeId.trim() });
      if (res.isSuccess) onSuccess('Office assigned successfully.');
      else setError(res.message);
    } catch {
      setError('Failed to assign office.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ir-modal__header">
          <h2 className="ir-modal__title">Assign Import Office</h2>
          <button className="ir-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="ir-modal__body">
          {error && <div className="ir-alert ir-alert--error">{error}</div>}
          <p style={{ margin: 0, fontSize: 13.5, color: '#374151' }}>
            Assign an import office to handle the request for{' '}
            <strong>{request.productName ?? request.productId}</strong>.
          </p>
          <div className="ir-form-group">
            <label className="ir-form-label">Office ID *</label>
            <input
              className="ir-form-input"
              value={officeId}
              onChange={(e) => setOfficeId(e.target.value)}
              placeholder="Enter office UUID"
            />
            <span style={{ fontSize: 11.5, color: '#9ca3af' }}>The office must be active in the system.</span>
          </div>
        </div>
        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="ir-btn ir-btn--assign" onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px' }}>
            {loading ? 'Assigning...' : 'Assign Office'}
          </button>
        </div>
      </div>
    </div>
  );
};