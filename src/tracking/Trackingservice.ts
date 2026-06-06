import axios from 'axios';

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

function mapResponse<T>(raw: any): ApiResponse<T> {
  return {
    isSuccess: raw.isSuccess ?? false,
    message: raw.message ?? '',
    data: raw.data,
    errors: raw.validationErrors,
  };
}

// ── DTOs matching backend TrackingDto ────────────────────────────────────────

export interface TrackingDto {
  id: string;
  importRequestId: string;
  currentStage: string;
  trackingNumber?: string;
  carrierName?: string;
  currentLocation?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  arrivedPortAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface TrackingHistoryDto {
  id: string;
  trackingId: string;
  stage: string;
  description: string;
  location?: string;
  occurredAt: string;
  updatedByUserId?: string;
  updatedByUserName?: string;
}

// Stage update DTO — matches UpdateStageRequestDto on backend
export interface UpdateStageRequestDto {
  stage: string;
  location?: string;
  description?: string;
}

export interface UpdateCarrierInfoDto {
  trackingNumber: string;
  carrierName: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const TrackingService = {
  /**
   * GET /api/tracking/{requestId}
   * Admin | Support | ImportOffice | Customer
   */
  async getByRequestId(requestId: string): Promise<ApiResponse<TrackingDto>> {
    const res = await api.get(`/tracking/${requestId}`);
    return mapResponse<TrackingDto>(res.data);
  },

  /**
   * GET /api/tracking/{requestId}/history
   * Admin | Support | ImportOffice | Customer
   */
  async getHistory(requestId: string): Promise<ApiResponse<TrackingHistoryDto[]>> {
    const res = await api.get(`/tracking/${requestId}/history`);
    return mapResponse<TrackingHistoryDto[]>(res.data);
  },

  /**
   * PATCH /api/tracking/{requestId}/stage
   * ImportOffice | Support
   */
  async updateStage(
    requestId: string,
    dto: UpdateStageRequestDto
  ): Promise<ApiResponse<TrackingDto>> {
    const res = await api.patch(`/tracking/${requestId}/stage`, dto);
    return mapResponse<TrackingDto>(res.data);
  },

  /**
   * PATCH /api/tracking/{requestId}/carrier
   * ImportOffice only
   */
  async updateCarrier(
    requestId: string,
    dto: UpdateCarrierInfoDto
  ): Promise<ApiResponse<TrackingDto>> {
    const res = await api.patch(`/tracking/${requestId}/carrier`, dto);
    return mapResponse<TrackingDto>(res.data);
  },

  /**
   * PATCH /api/tracking/{requestId}/location
   * ImportOffice | Support (per backend logic)
   */
  async updateLocation(
    requestId: string,
    location: string
  ): Promise<ApiResponse<TrackingDto>> {
    const res = await api.patch(`/tracking/${requestId}/location`, JSON.stringify(location));
    return mapResponse<TrackingDto>(res.data);
  },

  /**
   * PATCH /api/tracking/{requestId}/estimated-date
   * ImportOffice | Support
   */
  async updateEstimatedDate(
    requestId: string,
    estimatedDate: string
  ): Promise<ApiResponse<TrackingDto>> {
    const res = await api.patch(`/tracking/${requestId}/estimated-date`, JSON.stringify(estimatedDate));
    return mapResponse<TrackingDto>(res.data);
  },

  /**
   * GET /api/tracking/admin
   * Admin | Support — paginated list of all active shipments
   */
  async getAllActive(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResult<TrackingDto>>> {
    const res = await api.get('/tracking/admin', { params });
    return mapResponse<PaginatedResult<TrackingDto>>(res.data);
  },
};