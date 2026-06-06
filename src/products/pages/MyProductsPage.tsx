import React, { useState, useEffect, useCallback } from 'react';
import { ProductService } from '../ProductService';
import type { ProductDto } from '../types/products';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import './ProductsPage.css';

type ModalMode = 'view' | 'create' | 'edit' | 'stock' | 'image';

const MyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ProductService.getMine(page, PAGE_SIZE);
      if (res.isSuccess) setProducts(res.data ?? []);
      else setError(res.message);
    } catch {
      setError('Failed to load your products.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const openModal = (mode: ModalMode, product?: ProductDto) => {
    setSelectedProduct(product ?? null);
    setModalMode(mode);
  };

  const handleModalSuccess = (msg: string) => {
    setModalMode(null);
    setSelectedProduct(null);
    showToast(msg);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await ProductService.delete(deleteTarget.id);
      if (res.isSuccess) {
        showToast('Product deleted successfully.');
        setDeleteTarget(null);
        fetchProducts();
      } else {
        setError(res.message);
      }
    } catch {
      setError('Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="products-page">
      {/* Toast Notifications */}
      {toast && <div className="toast toast--success">{toast}</div>}

      {/* Header Section */}
      <div className="products-page__header">
        <div>
          <h1 className="products-page__title">My Products</h1>
          <p className="products-page__subtitle">Manage and monitor your product inventory</p>
        </div>
        <button className="btn btn--primary" onClick={() => openModal('create')}>
          + Add New Product
        </button>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="products-loading">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="product-skeleton" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="products-empty">
          <div className="empty-icon">📦</div>
          <p>No products found in your listings.</p>
          <button className="btn btn--primary" onClick={() => openModal('create')}>Add Your First Product</button>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showActions // هذا المتغير هو الذي يظهر الأزرار في ProductCard
              onView={(product) => openModal('view', product)}
              onEdit={(product) => openModal('edit', product)}
              onUpdateStock={(product) => openModal('stock', product)}
              onDelete={(product) => setDeleteTarget(product)}
            />
          ))}
        </div>
      )}

      {/* Pagination Section */}
      <div className="products-pagination">
        <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
        <span className="pagination-current">Page {page}</span>
        <button className="btn btn--ghost" disabled={products.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)}>Next →</button>
      </div>

      {/* Main Product Modal (Create/Edit/View/Stock) */}
      {modalMode && (
        <ProductModal
          mode={modalMode}
          product={selectedProduct}
          onClose={() => { setModalMode(null); setSelectedProduct(null); }}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Confirm Deletion</h2>
              <button className="modal__close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal__body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;