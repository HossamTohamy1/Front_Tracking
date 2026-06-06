import React, { useState, useEffect } from 'react';
import { ImportRequestService } from '../ImportRequestService';
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

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

interface Product {
  id: string;
  name: string;
  category?: string;
  minOrderQuantity: number;
  stockQuantity: number;
  weightPerUnitKg: number;
  pricePerUnit?: number;
}

const SubmitRequestModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    shippingAddress: '',
    specialInstructions: '',
    requestedDeliveryDate: '',
    shipmentType: 'FullContainer',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await api.get('/products');
        const data = res.data;
        const list = data?.data ?? data ?? [];
        setProducts(Array.isArray(list) ? list : []);
      } catch {
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (name === 'productId') {
      const found = products.find((p) => p.id === value);
      setSelectedProduct(found ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!form.productId.trim() || !form.quantity || !form.shippingAddress.trim()) {
      setError('Product, Quantity, and Shipping Address are required.');
      return;
    }
    const qty = Number(form.quantity);
    if (selectedProduct && qty < selectedProduct.minOrderQuantity) {
      setError(`Minimum order quantity is ${selectedProduct.minOrderQuantity} units.`);
      return;
    }
    if (selectedProduct && qty > selectedProduct.stockQuantity) {
      setError(`Only ${selectedProduct.stockQuantity} units available in stock.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await ImportRequestService.submit({
        productId: form.productId.trim(),
        quantity: qty,
        shippingAddress: form.shippingAddress.trim(),
        specialInstructions: form.specialInstructions || undefined,
        requestedDeliveryDate: form.requestedDeliveryDate || undefined,
        shipmentType: form.shipmentType as 'FullContainer' | 'LCL',
      });
      if (res.isSuccess) onSuccess('Import request submitted successfully!');
      else setError(res.message);
    } catch {
      setError('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ir-modal-overlay" onClick={onClose}>
      <div className="ir-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ir-modal__header">
          <h2 className="ir-modal__title">New Import Request</h2>
          <button className="ir-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="ir-modal__body">
          {error && <div className="ir-alert ir-alert--error">{error}</div>}

          {/* ── Shipment Type Selector ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Shipment Type *</label>
            <select
              className="ir-form-select"
              name="shipmentType"
              value={form.shipmentType}
              onChange={handle}
            >
              <option value="FullContainer">🚢 FCL — Full Container Load</option>
              <option value="LCL">📦 LCL — Less than Container Load (Shared)</option>
            </select>
            <span style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
              {form.shipmentType === 'LCL'
                ? 'شحنتك هتتجمع مع شحنات تانية في كونتنر مشترك — التكلفة بتتوزع بالحجم.'
                : 'شحنتك هتاخد كونتنر كامل لوحدها.'}
            </span>
          </div>

          {/* ── Shipment Type Info Card ── */}
          <div
            style={{
              background: form.shipmentType === 'LCL' ? '#f0f9ff' : '#f0fdf4',
              border: `1px solid ${form.shipmentType === 'LCL' ? '#bae6fd' : '#d1fae5'}`,
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12.5,
              color: form.shipmentType === 'LCL' ? '#0369a1' : '#166534',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1.2 }}>
              {form.shipmentType === 'LCL' ? '📦' : '🚢'}
            </span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {form.shipmentType === 'LCL'
                  ? 'LCL — Less than Container Load'
                  : 'FCL — Full Container Load'}
              </div>
              <div style={{ lineHeight: 1.5 }}>
                {form.shipmentType === 'LCL'
                  ? 'Ideal for smaller shipments. Your cargo shares space with others — cost is split proportionally by volume.'
                  : 'Ideal for large shipments. Your cargo occupies an entire container — faster processing and more control.'}
              </div>
            </div>
          </div>

          {/* ── Product Selector ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Product *</label>
            {loadingProducts ? (
              <div style={{ fontSize: 13, color: '#9ca3af', padding: '8px 0' }}>
                Loading products...
              </div>
            ) : products.length > 0 ? (
              <select
                className="ir-form-select"
                name="productId"
                value={form.productId}
                onChange={handle}
              >
                <option value="">— Select a product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.category ? `(${p.category})` : ''} — Stock: {p.stockQuantity}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="ir-form-input"
                name="productId"
                value={form.productId}
                onChange={handle}
                placeholder="Enter product UUID"
              />
            )}
          </div>

          {/* ── Product Info Card ── */}
          {selectedProduct && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #d1fae5',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Min Order: </span>
                <span style={{ color: '#14532d' }}>{selectedProduct.minOrderQuantity} units</span>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>In Stock: </span>
                <span style={{ color: '#14532d' }}>{selectedProduct.stockQuantity} units</span>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>Weight/Unit: </span>
                <span style={{ color: '#14532d' }}>{selectedProduct.weightPerUnitKg} kg</span>
              </div>
              {selectedProduct.pricePerUnit != null && (
                <div>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>Price/Unit: </span>
                  <span style={{ color: '#14532d' }}>${selectedProduct.pricePerUnit}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Quantity ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Quantity *</label>
            <input
              className="ir-form-input"
              name="quantity"
              type="number"
              min={selectedProduct?.minOrderQuantity ?? 1}
              max={selectedProduct?.stockQuantity}
              value={form.quantity}
              onChange={handle}
              placeholder={
                selectedProduct
                  ? `Min: ${selectedProduct.minOrderQuantity} — Max: ${selectedProduct.stockQuantity}`
                  : 'Number of units'
              }
            />
            {selectedProduct && form.quantity && (
              <span style={{ fontSize: 11.5, color: '#6b7280' }}>
                Estimated weight:{' '}
                {(Number(form.quantity) * selectedProduct.weightPerUnitKg).toFixed(2)} kg
              </span>
            )}
          </div>

          {/* ── Shipping Address ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Shipping Address *</label>
            <input
              className="ir-form-input"
              name="shippingAddress"
              value={form.shippingAddress}
              onChange={handle}
              placeholder="Full delivery address"
            />
          </div>

          {/* ── Requested Delivery Date ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Requested Delivery Date</label>
            <input
              className="ir-form-input"
              name="requestedDeliveryDate"
              type="date"
              value={form.requestedDeliveryDate}
              onChange={handle}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* ── Special Instructions ── */}
          <div className="ir-form-group">
            <label className="ir-form-label">Special Instructions</label>
            <textarea
              className="ir-form-textarea"
              name="specialInstructions"
              value={form.specialInstructions}
              onChange={handle}
              placeholder="Any special handling or notes..."
            />
          </div>

          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            ⚖️ Weight & volume are calculated automatically based on quantity.
          </p>
        </div>

        <div className="ir-modal__footer">
          <button className="ir-btn ir-btn--cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="ir-btn ir-btn--approve"
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '8px 20px' }}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitRequestModal;