import React, { useState, useEffect } from 'react';
import { ImportRequestService } from '../ImportRequestService';
import type { ImportRequestListDto } from '../types/importRequests';
import './ImportRequestsPage.css';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface AssignProps {
  request: ImportRequestListDto;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

interface OfficeUser {
  id: string;
  fullName: string;
  email: string;
  companyName?: string;
}

const AssignOfficeModal: React.FC<AssignProps> = ({ request, onClose, onSuccess }) => {
  const [officeId, setOfficeId]             = useState('');
  const [offices, setOffices]               = useState<OfficeUser[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [fetchError, setFetchError]         = useState('');

  useEffect(() => {
    const fetchOffices = async () => {
      setLoadingOffices(true);
      setFetchError('');
      try {
        const res = await api.get('/import-requests/offices');
        const data = res.data;
        const list: OfficeUser[] = data?.data ?? data ?? [];
        setOffices(Array.isArray(list) ? list : []);
      } catch {
        setFetchError('Network error. Enter the office ID manually.');
      } finally {
        setLoadingOffices(false);
      }
    };
    fetchOffices();
  }, []);

  const handleSubmit = async () => {
    if (!officeId.trim()) { setError('Please select an office.'); return; }
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

  const selectedOffice = offices.find((o) => o.id === officeId);

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal" onClick={(e) => e.stopPropagation()}>

        <div className="ir-modal__header">
          <h2 className="ir-modal__title">Assign Import Office</h2>
          <button className="ir-modal__close" onClick={onClose}>X</button>
        </div>

        <div className="ir-modal__body">
          {error && <div className="ir-alert ir-alert--error">{error}</div>}

          <p style={{ margin: 0, fontSize: 13.5, color: '#374151' }}>
            Assign an import office to handle the request for{' '}
            <strong>{request.productName ?? request.productId}</strong>.
          </p>

          <div className="ir-form-group">
            <label className="ir-form-label">Select Office *</label>

            {loadingOffices ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                border:'1.5px solid #d1d5db', borderRadius:9, color:'#9ca3af', fontSize:13 }}>
                <span style={{ display:'inline-block', width:14, height:14,
                  border:'2px solid rgba(22,163,74,0.25)', borderTopColor:'#16a34a',
                  borderRadius:'50%', animation:'irSpin 0.7s linear infinite' }} />
                Loading offices...
              </div>
            ) : fetchError ? (
              <>
                <div style={{ fontSize:12, color:'#dc2626', marginBottom:6 }}>
                  {fetchError}
                </div>
                <input className="ir-form-input" value={officeId}
                  onChange={(e) => setOfficeId(e.target.value)}
                  placeholder="Enter office UUID" />
              </>
            ) : offices.length === 0 ? (
              <div style={{ padding:'12px 14px', background:'#fef9c3', border:'1px solid #fde68a',
                borderRadius:9, fontSize:13, color:'#854d0e' }}>
                No active import offices found in the system.
              </div>
            ) : (
              <select className="ir-form-select" value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}>
                <option value="">- Select an office -</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.fullName}{o.companyName ? ` (${o.companyName})` : ''} - {o.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedOffice && (
            <div style={{ background:'#f0fdf4', border:'1px solid #d1fae5', borderRadius:10,
              padding:'12px 14px', display:'flex', flexDirection:'column', gap:4, fontSize:12.5 }}>
              <div style={{ fontWeight:700, color:'#14532d', fontSize:13 }}>
                {selectedOffice.fullName}
              </div>
              <div style={{ color:'#374151' }}>{selectedOffice.email}</div>
              {selectedOffice.companyName && (
                <div style={{ color:'#6b7280' }}>{selectedOffice.companyName}</div>
              )}
            </div>
          )}
        </div>

        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="ir-btn ir-btn--assign" onClick={handleSubmit}
            disabled={loading || !officeId} style={{ padding:'8px 20px' }}>
            {loading ? 'Assigning...' : 'Assign Office'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignOfficeModal;
export { AssignOfficeModal };