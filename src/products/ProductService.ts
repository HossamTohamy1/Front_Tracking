import axios from 'axios';
import type { ApiResponse } from '../auth/types';
import type {
  ProductDto,
  GetAllProductsQuery,
  CreateProductCommand,
  UpdateProductCommand,
  UpdateStockCommand,
} from './types/products';

//const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://hotel7.runasp.net/';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({ baseURL: API_BASE_URL });

// Attach JWT from localStorage automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Products Service ────────────────────────────────────────────────────────

export const ProductService = {
  /** GET /api/products  (public) */
  getAll: async (params: GetAllProductsQuery = {}) => {
    const { data } = await api.get<ApiResponse<ProductDto[]>>('/products', { params });
    return data;
  },

  /** GET /api/products/my  (ImportOffice) */
  getMine: async (pageNumber = 1, pageSize = 10) => {
    const { data } = await api.get<ApiResponse<ProductDto[]>>('/products/my', {
      params: { pageNumber, pageSize },
    });
    return data;
  },

  /** GET /api/products/:id  (public) */
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<ProductDto>>(`/products/${id}`);
    return data;
  },

  /** POST /api/products  (ImportOffice) */
  create: async (command: CreateProductCommand) => {
    const { data } = await api.post<ApiResponse<ProductDto>>('/products', command);
    return data;
  },

  /** PUT /api/products/:id  (ImportOffice) */
  update: async (id: string, command: UpdateProductCommand) => {
    const { data } = await api.put<ApiResponse<ProductDto>>(`/products/${id}`, command);
    return data;
  },

  /** PATCH /api/products/:id/stock  (ImportOffice) */
  updateStock: async (id: string, command: UpdateStockCommand) => {
    const { data } = await api.patch<ApiResponse<boolean>>(`/products/${id}/stock`, command);
    return data;
  },

  /** POST /api/products/:id/image  (ImportOffice) */
  uploadImage: async (id: string, image: File) => {
    const formData = new FormData();
    formData.append('image', image);
    const { data } = await api.post<ApiResponse<string>>(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** DELETE /api/products/:id  (ImportOffice | Admin) */
  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<boolean>>(`/products/${id}`);
    return data;
  },
};