// ============================================================
// Product Types
// ============================================================

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  category: string;
  countryOfOrigin: string;
  unitPrice: number;
  currency: string;
  weightPerUnitKg: number;
  volumePerUnitCbm: number;
  minOrderQuantity: number;
  stockQuantity: number;
  mainImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GetAllProductsQuery {
  search?: string;
  category?: string;
  countryOfOrigin?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface CreateProductCommand {
  name: string;
  description: string;
  category: string;
  countryOfOrigin: string;
  unitPrice: number;
  currency?: string;
  weightPerUnitKg: number;
  volumePerUnitCbm: number;
  minOrderQuantity?: number;
  stockQuantity?: number;
}

export interface UpdateProductCommand {
  name?: string;
  description?: string;
  category?: string;
  countryOfOrigin?: string;
  unitPrice?: number;
  currency?: string;
  weightPerUnitKg?: number;
  volumePerUnitCbm?: number;
  minOrderQuantity?: number;
}

export interface UpdateStockCommand {
  newStockQuantity: number;
}