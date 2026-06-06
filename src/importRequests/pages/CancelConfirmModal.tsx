import React from 'react';
import './ImportRequestsPage.css';

interface Props {
  productName?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

const CancelConfirmModal: React.FC<Props> = ({ productName, onConfirm, onClose, loading }) => {
  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div
        className="ir-modal"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px 8px',
          gap: 12,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
          }}>
            🚫
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
          }}>
            Cancel Request?
          </h2>
          <p style={{
            margin: 0,
            fontSize: 13.5,
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            Are you sure you want to cancel the request for{' '}
            <strong style={{ color: '#374151' }}>{productName ?? 'this product'}</strong>?
            <br />
            <span style={{ fontSize: 12.5 }}>This action cannot be undone.</span>
          </p>
        </div>

        <div className="ir-modal__footer" style={{ justifyContent: 'center', gap: 12, padding: '20px 24px 28px' }}>
          <button
            className="ir-btn ir-btn--cancel"
            onClick={onClose}
            disabled={loading}
            style={{ padding: '9px 28px', fontSize: 13.5 }}
          >
            Keep Request
          </button>
          <button
            className="ir-btn ir-btn--reject"
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '9px 28px', fontSize: 13.5 }}
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel It'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmModal;