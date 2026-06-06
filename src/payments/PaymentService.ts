import axios from 'axios';
import type {
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  PaymentDto,
} from './types/Payment';

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

// Backend always returns { isSuccess, message, data, ... }
function mapResponse<T>(raw: any): ApiResponse<T> {
  return {
    isSuccess: raw.isSuccess ?? false,
    message:   raw.message  ?? '',
    data:      raw.data,
    errors:    raw.validationErrors,
  };
}

export const PaymentService = {
  /**
   * Customer: create a Stripe PaymentIntent for an import request.
   * Returns clientSecret used by Stripe.js to confirm the payment on the
   * client side without sending card data to our backend.
   *
   * Endpoint: POST /api /create-intent
   */
  async createPaymentIntent(
    dto: CreatePaymentIntentRequest
  ): Promise<ApiResponse<PaymentIntentResponse>> {
    const res = await api.post('/create-intent', dto);
    return mapResponse<PaymentIntentResponse>(res.data);
  },

  /**
   * Get a single payment record by its ID (GUID).
   *
   * Endpoint: GET /api /{paymentId}
   */
  async getById(paymentId: string): Promise<ApiResponse<PaymentDto>> {
    const res = await api.get(`/${paymentId}`);
    return mapResponse<PaymentDto>(res.data);
  },

  /**
   * Get ALL payments for a specific import request.
   * ⚠️  Backend returns List<PaymentResponseDto> — use PaymentDto[] here.
   *
   * Endpoint: GET /api /request/{requestId}
   */
  async getByRequestId(requestId: string): Promise<ApiResponse<PaymentDto[]>> {
    const res = await api.get(`/request/${requestId}`);
    return mapResponse<PaymentDto[]>(res.data);
  },
};