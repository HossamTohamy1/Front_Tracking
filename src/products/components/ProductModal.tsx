import React, { useState, useEffect } from 'react';
import type { ProductDto, CreateProductCommand, UpdateProductCommand } from '../types/products';
import { ProductService } from '../ProductService';

type ModalMode = 'view' | 'create' | 'edit' | 'stock' | 'image';

interface ProductModalProps {
  mode: ModalMode;
  product?: ProductDto | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'];

const ProductModal: React.FC<ProductModalProps> = ({ mode, product, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create / Edit form
  const [form, setForm] = useState<CreateProductCommand>({
    name: '',
    description: '',
    category: '',
    countryOfOrigin: '',
    unitPrice: 0,
    currency: 'USD',
    weightPerUnitKg: 0,
    volumePerUnitCbm: 0,
    minOrderQuantity: 1,
    stockQuantity: 0,
  });

  // Stock form
  const [newStock, setNewStock] = useState(0);

  // Image form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (product && (mode === 'edit' || mode === 'view')) {
      setForm({
        name: product.name,
        description: product.description,
        category: product.category,
        countryOfOrigin: product.countryOfOrigin,
        unitPrice: product.unitPrice,
        currency: product.currency,
        weightPerUnitKg: product.weightPerUnitKg,
        volumePerUnitCbm: product.volumePerUnitCbm,
        minOrderQuantity: product.minOrderQuantity,
        stockQuantity: product.stockQuantity,
      });
    }
    if (product && mode === 'stock') {
      setNewStock(product.stockQuantity);
    }
  }, [product, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['unitPrice', 'weightPerUnitKg', 'volumePerUnitCbm', 'minOrderQuantity', 'stockQuantity'].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'create') {
        const res = await ProductService.create(form);
        if (res.isSuccess) onSuccess('Product created successfully!');
        else setError(res.message);
      } else if (mode === 'edit' && product) {
        const updateCmd: UpdateProductCommand = { ...form };
        const res = await ProductService.update(product.id, updateCmd);
        if (res.isSuccess) onSuccess('Product updated successfully!');
        else setError(res.message);
      } else if (mode === 'stock' && product) {
        const res = await ProductService.updateStock(product.id, { newStockQuantity: newStock });
        if (res.isSuccess) onSuccess('Stock updated successfully!');
        else setError(res.message);
      } else if (mode === 'image' && product && imageFile) {
        const res = await ProductService.uploadImage(product.id, imageFile);
        if (res.isSuccess) onSuccess('Image uploaded successfully!');
        else setError(res.message);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<ModalMode, string> = {
    view: 'Product Details',
    create: 'Add New Product',
    edit: 'Edit Product',
    stock: 'Update Stock',
    image: 'Upload Image',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{titles[mode]}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          {error && <div className="alert alert--error">{error}</div>}

          {/* ── View ── */}
          {mode === 'view' && product && (
            <div className="product-detail">
              {product.mainImageUrl && (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL ?? ''}${product.mainImageUrl}`}
                  alt={product.name}
                  className="product-detail__image"
                />
              )}
              <div className="detail-grid">
                {[
                  ['Name', product.name],
                  ['Category', product.category],
                  ['Country of Origin', product.countryOfOrigin],
                  ['Price', `${product.currency} ${product.unitPrice.toLocaleString()}`],
                  ['Stock', product.stockQuantity],
                  ['Min. Order Qty', product.minOrderQuantity],
                  ['Weight/Unit', `${product.weightPerUnitKg} kg`],
                  ['Volume/Unit', `${product.volumePerUnitCbm} cbm`],
                ].map(([label, val]) => (
                  <div key={label as string} className="detail-item">
                    <span className="detail-item__label">{label}</span>
                    <span className="detail-item__value">{val}</span>
                  </div>
                ))}
                <div className="detail-item detail-item--full">
                  <span className="detail-item__label">Description</span>
                  <span className="detail-item__value">{product.description}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Create / Edit ── */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Premium Cotton T-Shirt" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Textiles" />
              </div>
              <div className="form-group form-group--full">
                <label>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description..." />
              </div>
              <div className="form-group">
                <label>Country of Origin *</label>
                <input name="countryOfOrigin" value={form.countryOfOrigin} onChange={handleChange} placeholder="e.g. Egypt" />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select name="currency" value={form.currency} onChange={handleChange}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unit Price *</label>
                <input type="number" name="unitPrice" value={form.unitPrice} onChange={handleChange} min={0} />
              </div>
              <div className="form-group">
                <label>Min. Order Quantity</label>
                <input type="number" name="minOrderQuantity" value={form.minOrderQuantity} onChange={handleChange} min={1} />
              </div>
              {mode === 'create' && (
                <div className="form-group">
                  <label>Initial Stock</label>
                  <input type="number" name="stockQuantity" value={form.stockQuantity} onChange={handleChange} min={0} />
                </div>
              )}
              <div className="form-group">
                <label>Weight per Unit (kg)</label>
                <input type="number" name="weightPerUnitKg" value={form.weightPerUnitKg} onChange={handleChange} min={0} step={0.01} />
              </div>
              <div className="form-group">
                <label>Volume per Unit (cbm)</label>
                <input type="number" name="volumePerUnitCbm" value={form.volumePerUnitCbm} onChange={handleChange} min={0} step={0.001} />
              </div>
            </div>
          )}

          {/* ── Stock ── */}
          {mode === 'stock' && product && (
            <div className="stock-form">
              <p className="stock-form__product-name">{product.name}</p>
              <div className="form-group">
                <label>Current Stock: <strong>{product.stockQuantity}</strong></label>
                <label style={{ marginTop: 16 }}>New Stock Quantity *</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          )}

          {/* ── Image ── */}
          {mode === 'image' && product && (
            <div className="image-form">
              <p className="image-form__product-name">{product.name}</p>
              <div className="image-dropzone">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="image-preview" />
                ) : (
                  <div className="image-dropzone__placeholder">
                    <span>📷</span>
                    <p>Click to select image</p>
                    <small>JPG, PNG, WebP — max 5 MB</small>
                  </div>
                )}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="image-input" />
              </div>
            </div>
          )}
        </div>

        {mode !== 'view' && (
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button
              className="btn btn--primary"
              onClick={handleSubmit}
              disabled={loading || (mode === 'image' && !imageFile)}
            >
              {loading ? 'Saving…' : mode === 'create' ? 'Create Product' : mode === 'edit' ? 'Save Changes' : mode === 'stock' ? 'Update Stock' : 'Upload Image'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductModal;