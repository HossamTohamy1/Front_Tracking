import axios from 'axios';
import type {
  ContainerListItemDto,
  ContainerDto,
  ContainerCostBreakdownDto,
  CreateContainerDto,
  UpdateContainerDto,
  PaginatedResult,
} from './types/containers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface UpdateContainerStatusRequest {
  status:       number;
  location?:    string;   
  description?: string;   
}

export interface ContainerSuggestionDto {
  containerId: string;
  containerNumber: string;
  availableWeightKg: number;
  availableVolumeCbm: number;
  currentWeightKg: number;
  currentVolumeCbm: number;
  maxWeightKg: number;
  maxVolumeCbm: number;
  destinationPort?: string;
  originPort?: string;
  itemCount: number;
  totalShippingCost: number;
  score: number;
  isBestMatch: boolean;
  weightUtilizationAfter: number;
  volumeUtilizationAfter: number;
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

export const ContainerService = {
  async getOfficeContainers(params?: {
    status?: number;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResult<ContainerListItemDto>>> {
    const res = await api.get('/Containers', { params });
    return mapResponse(res.data);
  },

  async getAllContainers(params?: {
    status?: number;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResult<ContainerListItemDto>>> {
    const res = await api.get('/Containers/admin/all', { params });
    return mapResponse(res.data);
  },

  async getContainerSuggestions(requestId: string): Promise<ApiResponse<ContainerSuggestionDto[]>> {
    const res = await api.get('/containers/suggestions', { params: { requestId } });
    return mapResponse(res.data);
  },

  async assignContainer(importRequestId: string, containerId: string): Promise<ApiResponse<boolean>> {
    const res = await api.post('/containers/assign', { importRequestId, containerId });
    return mapResponse(res.data);
  },

  async getById(id: string): Promise<ApiResponse<ContainerDto>> {
    const res = await api.get(`/Containers/${id}`);
    return mapResponse(res.data);
  },

  async create(dto: CreateContainerDto): Promise<ApiResponse<ContainerDto>> {
    const res = await api.post('/Containers', dto);
    return mapResponse(res.data);
  },

  async update(id: string, dto: UpdateContainerDto): Promise<ApiResponse<ContainerDto>> {
    const res = await api.put(`/Containers/${id}`, dto);
    return mapResponse(res.data);
  },

  async close(id: string): Promise<ApiResponse<ContainerDto>> {
    const res = await api.patch(`/Containers/${id}/close`);
    return mapResponse(res.data);
  },

  /**

   *
   * @param id        
   * @param status    
   * @param extra     
   */
async updateStatus(
    id: string,
    status: number,
    extra?: { location?: string; description?: string }
): Promise<ApiResponse<ContainerDto>> {
    const body = {
        status,
        location: extra?.location,
        description: extra?.description,
    };
    const res = await api.patch(`/Containers/${id}/status`, body);
    return mapResponse(res.data);
},

  async updateShippingCost(
    id: string,
    totalShippingCost: number
  ): Promise<ApiResponse<ContainerDto>> {
    const res = await api.patch(`/Containers/${id}/shipping-cost`, { totalShippingCost });
    return mapResponse(res.data);
  },

  async removeItem(containerId: string, itemId: string): Promise<ApiResponse<ContainerDto>> {
    const res = await api.delete(`/Containers/${containerId}/items/${itemId}`);
    return mapResponse(res.data);
  },

  async getCostBreakdown(id: string): Promise<ApiResponse<ContainerCostBreakdownDto>> {
    const res = await api.get(`/Containers/${id}/cost-breakdown`);
    return mapResponse(res.data);
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    const res = await api.delete(`/Containers/${id}`);
    return mapResponse(res.data);
  },
};