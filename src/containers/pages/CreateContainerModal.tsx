import React, { useState } from 'react';
import { ContainerService } from '../ContainerService';
import './ContainersPage.css';

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const CreateContainerModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    maxWeightKg: '',
    maxVolumeCbm: '',
    shipmentType: '1',   
    originPort: '',
    destinationPort: '',
    expectedArrival: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.maxWeightKg || Number(form.maxWeightKg) <= 0) {
      setError('Max weight must be greater than 0.');
      return;
    }
    if (!form.maxVolumeCbm || Number(form.maxVolumeCbm) <= 0) {
      setError('Max volume must be greater than 0.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await ContainerService.create({
        maxWeightKg: Number(form.maxWeightKg),
        maxVolumeCbm: Number(form.maxVolumeCbm),
        shipmentType: Number(form.shipmentType) as 0 | 1,  
        originPort: form.originPort || undefined,
        destinationPort: form.destinationPort || undefined,
        expectedArrival: form.expectedArrival || undefined,
      });
      if (res.isSuccess) onSuccess('Container created successfully.');
      else setError(res.message);
    } catch {
      setError('Failed to create container.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cn-modal-overlay" onClick={onClose}>
      <div className="cn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cn-modal__header">
          <h2 className="cn-modal__title">Create New Container</h2>
          <button className="cn-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="cn-modal__body">
          {error && <div className="cn-alert cn-alert--error">{error}</div>}

          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#15803d',
          }}>
            🔢 Container number will be generated automatically (e.g. CNT-000001)
          </div>

          {/* ✅ مضاف: Shipment Type Selector */}
          <div className="cn-form-group">
            <label className="cn-form-label">Container Type *</label>
            <select
              className="cn-form-select"
              value={form.shipmentType}
              onChange={(e) => set('shipmentType', e.target.value)}
            >
              <option value="1">📦 LCL — Shared Container (Less than Container Load)</option>
              <option value="0">🚢 FCL — Full Container Load</option>
            </select>
            <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
              {form.shipmentType === '1'
                ? 'Multiple shipments will share this container. Cost is split by volume.'
                : 'This container is dedicated to a single shipment.'}
            </span>
          </div>

          <div className="cn-form-row">
            <div className="cn-form-group">
              <label className="cn-form-label">Max Weight (kg) *</label>
              <input
                className="cn-form-input"
                type="number"
                min="0"
                value={form.maxWeightKg}
                onChange={(e) => set('maxWeightKg', e.target.value)}
                placeholder="e.g. 28000"
              />
            </div>
            <div className="cn-form-group">
              <label className="cn-form-label">Max Volume (CBM) *</label>
              <input
                className="cn-form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.maxVolumeCbm}
                onChange={(e) => set('maxVolumeCbm', e.target.value)}
                placeholder="e.g. 67.5"
              />
            </div>
          </div>

          <div className="cn-form-row">
            <div className="cn-form-group">
              <label className="cn-form-label">Origin Port</label>
              <input
                className="cn-form-input"
                value={form.originPort}
                onChange={(e) => set('originPort', e.target.value)}
                placeholder="e.g. Shanghai"
              />
            </div>
            <div className="cn-form-group">
              <label className="cn-form-label">Destination Port</label>
              <input
                className="cn-form-input"
                value={form.destinationPort}
                onChange={(e) => set('destinationPort', e.target.value)}
                placeholder="e.g. Alexandria"
              />
            </div>
          </div>

          <div className="cn-form-group">
            <label className="cn-form-label">Expected Arrival</label>
            <input
              className="cn-form-input"
              type="datetime-local"
              value={form.expectedArrival}
              onChange={(e) => set('expectedArrival', e.target.value)}
            />
          </div>
        </div>

        <div className="cn-modal__footer">
          <button className="cn-btn cn-btn--cancel-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="cn-btn cn-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create Container'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateContainerModal;