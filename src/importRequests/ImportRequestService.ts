import axios from 'axios';
import type {
  ImportRequestListDto,
  ImportRequestDto,
  SubmitImportRequestDto,
  RejectImportRequestDto,
  AssignOfficeDto,
  UpdateStageDto,
} from './types/importRequests';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//const API_BASE_URL = 'https://localhost:7099/api';

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

function mapResponse<T>(data: { success?: boolean; isSuccess?: boolean; message: string; data: T }): ApiResponse<T> {
  return {
    isSuccess: data.success ?? data.isSuccess ?? false,
    message: data.message,
    data: data.data,
  };
}

export const ImportRequestService = {
  /** Customer: get own requests */
  async getMy(status?: string): Promise<ApiResponse<ImportRequestListDto[]>> {
    const res = await api.get('/import-requests', { params: { status } });
    return mapResponse(res.data);
  },

  /** Admin/Support: get all requests */
  async getAll(params?: { status?: string; officeId?: string; userId?: string }): Promise<ApiResponse<ImportRequestListDto[]>> {
    const res = await api.get('/import-requests/admin', { params });
    return mapResponse(res.data);
  },

  /** ImportOffice: get assigned requests */
  async getOffice(status?: string): Promise<ApiResponse<ImportRequestListDto[]>> {
    const res = await api.get('/import-requests/office', { params: { status } });
    return mapResponse(res.data);
  },

  /** Get single request by ID */
  async getById(id: string): Promise<ApiResponse<ImportRequestDto>> {
    const res = await api.get(`/import-requests/${id}`);
    return mapResponse(res.data);
  },

  /** Customer: submit new request */
  async submit(dto: SubmitImportRequestDto): Promise<ApiResponse<ImportRequestDto>> {
    const res = await api.post('/import-requests', dto);
    return mapResponse(res.data);
  },

  /** Customer/Admin: cancel request */
  async cancel(id: string): Promise<ApiResponse<boolean>> {
    const res = await api.delete(`/import-requests/${id}`);
    return mapResponse(res.data);
  },

  /** ImportOffice: approve request */
  async approve(
    id: string,
    dto?: { originPort?: string; destinationPort?: string; expectedArrival?: string }
  ): Promise<ApiResponse<boolean>> {
    const res = await api.patch(`/import-requests/${id}/approve`, dto ?? {});
    return mapResponse(res.data);
  },

  /** ImportOffice: reject request */
  async reject(id: string, dto: RejectImportRequestDto): Promise<ApiResponse<boolean>> {
    const res = await api.patch(`/import-requests/${id}/reject`, dto);
    return mapResponse(res.data);
  },

  /** Admin: assign office */
  async assignOffice(id: string, dto: AssignOfficeDto): Promise<ApiResponse<boolean>> {
    const res = await api.patch(`/import-requests/${id}/assign-office`, dto);
    return mapResponse(res.data);
  },

  /** ImportOffice: advance shipment stage */
  async updateStage(id: string, dto: UpdateStageDto): Promise<ApiResponse<boolean>> {
    const res = await api.patch(`/import-requests/${id}/update-stage`, dto);
    return mapResponse(res.data);
  },
};