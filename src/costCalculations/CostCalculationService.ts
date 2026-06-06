import axios from 'axios';
import type {
  CostCalculationDto,
  UpdateCostCalculationRequest,
  UpdateDiscountRequest,
  PaginatedResult,
} from './types/costCalculations';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function mapResponse<T>(data: {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: T;
}): ApiResponse<T> {
  return {
    isSuccess: data.success ?? data.isSuccess ?? false,
    message: data.message,
    data: data.data,
  };
}

export const CostCalculationService = {
  /** Admin | Support | ImportOffice: get all cost calculations (paginated) */
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    currency?: string;
  }): Promise<ApiResponse<PaginatedResult<CostCalculationDto>>> {
    const res = await api.get('/cost-calculations/admin', { params });
    return mapResponse(res.data);
  },

  /** Customer: get only MY cost calculations (paginated) */
  async getMy(params?: {
    page?: number;
    pageSize?: number;
    currency?: string;
  }): Promise<ApiResponse<PaginatedResult<CostCalculationDto>>> {
    const res = await api.get('/cost-calculations/my', { params });
    return mapResponse(res.data);
  },

  /** Admin | Support | ImportOffice | Customer: get by requestId */
  async getByRequestId(requestId: string): Promise<ApiResponse<CostCalculationDto>> {
    const res = await api.get(`/cost-calculations/${requestId}`);
    return mapResponse(res.data);
  },

  /** ImportOffice: update cost components */
  async updateCostComponents(
    requestId: string,
    dto: UpdateCostCalculationRequest
  ): Promise<ApiResponse<CostCalculationDto>> {
    const res = await api.put(`/cost-calculations/${requestId}`, dto);
    return mapResponse(res.data);
  },

  // create function to calculate total price with tax
     
  /** Admin | ImportOffice: apply/update discount */
  async updateDiscount(
    requestId: string,
    dto: UpdateDiscountRequest
  ): Promise<ApiResponse<CostCalculationDto>> {
    const res = await api.patch(`/cost-calculations/${requestId}/discount`, dto);
    return mapResponse(res.data);
  },
};