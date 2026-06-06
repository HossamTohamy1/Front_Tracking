import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductService } from '../ProductService';
import type { ProductDto, GetAllProductsQuery } from '../types/products';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import './ProductsPage.css';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');

  const [filters, setFilters] = useState<GetAllProductsQuery>({
    search: '',
    pageNumber: 1,
    pageSize: 12,
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [modalMode, setModalMode] = useState<'view' | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async (activeFilters: GetAllProductsQuery) => {
    setLoading(true);
    setError('');
    try {
      const res = await ProductService.getAll(activeFilters);
      if (res.isSuccess) setProducts(res.data ?? []);
      else setError(res.message);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search — fires 500ms after user stops typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const newFilters: GetAllProductsQuery = {
        search: value,
        pageNumber: 1,
        pageSize: 12,
      };
      setFilters(newFilters);
      fetchProducts(newFilters);
    }, 500);
  };

  const goToPage = (page: number) => {
    const newFilters = { ...filters, pageNumber: page };
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-page__header">
        <div>
          <h1 className="products-page__title">Browse Products</h1>
          <p className="products-page__subtitle">Discover quality products from global importers</p>
        </div>
      </div>

      {/* Single Search Input */}
      <div className="products-search-wrap">
        <svg className="products-search-ico" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6"/>
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <input
          className="products-search-input"
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search by name, category, or country of origin…"
          autoComplete="off"
        />
        {searchText && (
          <button
            className="products-search-clear"
            onClick={() => {
              setSearchText('');
              const newFilters = { search: '', pageNumber: 1, pageSize: 12 };
              setFilters(newFilters);
              fetchProducts(newFilters);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="products-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="products-empty">
          <span>📦</span>
          <p>No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onView={(product) => { setSelectedProduct(product); setModalMode('view'); }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="products-pagination">
        <button
          className="btn btn--ghost"
          disabled={(filters.pageNumber ?? 1) <= 1}
          onClick={() => goToPage((filters.pageNumber ?? 1) - 1)}
        >
          ← Prev
        </button>
        <span>Page {filters.pageNumber}</span>
        <button
          className="btn btn--ghost"
          disabled={products.length < (filters.pageSize ?? 12)}
          onClick={() => goToPage((filters.pageNumber ?? 1) + 1)}
        >
          Next →
        </button>
      </div>

      {/* Modal */}
      {modalMode && selectedProduct && (
        <ProductModal
          mode={modalMode}
          product={selectedProduct}
          onClose={() => { setModalMode(null); setSelectedProduct(null); }}
          onSuccess={() => { setModalMode(null); setSelectedProduct(null); fetchProducts(filters); }}
        />
      )}
    </div>
  );
};

export default ProductsPage;