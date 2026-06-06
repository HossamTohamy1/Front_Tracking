import React from 'react';
import type { ProductDto } from '../types/products';

interface ProductCardProps {
  product: ProductDto;
  onView?: (product: ProductDto) => void;
  onEdit?: (product: ProductDto) => void;
  onDelete?: (product: ProductDto) => void;
  onUpdateStock?: (product: ProductDto) => void;
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onView,
  onEdit,
  onDelete,
  onUpdateStock,
  showActions = false,
}) => {
  const placeholderImg = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=166534&color=fff&size=200&bold=true`;

  return (
    <div className="product-card" onClick={() => onView?.(product)}>
      <div className="product-card__image-wrap">
        <img
          src={product.mainImageUrl ? `${import.meta.env.VITE_API_BASE_URL ?? ''}${product.mainImageUrl}` : placeholderImg}
          alt={product.name}
          className="product-card__image"
          onError={(e) => { (e.target as HTMLImageElement).src = placeholderImg; }}
        />
        <span className={`product-card__stock-badge ${product.stockQuantity === 0 ? 'out' : product.stockQuantity < 10 ? 'low' : 'in'}`}>
          {product.stockQuantity === 0 ? 'Out of Stock' : product.stockQuantity < 10 ? `Low Stock (${product.stockQuantity})` : `In Stock (${product.stockQuantity})`}
        </span>
      </div>

      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__desc">{product.description}</p>

        <div className="product-card__meta">
          <span className="product-card__origin">🌍 {product.countryOfOrigin}</span>
          <span className="product-card__moq">MOQ: {product.minOrderQuantity}</span>
        </div>

        <div className="product-card__footer">
          <span className="product-card__price">
            {product.currency} {product.unitPrice.toLocaleString()}
          </span>

          {showActions && (
            <div className="product-card__actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn-icon btn-edit" title="Edit" onClick={() => onEdit?.(product)}>✏️</button>
              <button className="btn-icon btn-stock" title="Update Stock" onClick={() => onUpdateStock?.(product)}>📦</button>
              <button className="btn-icon btn-delete" title="Delete" onClick={() => onDelete?.(product)}>🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;