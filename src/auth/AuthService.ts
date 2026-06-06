import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//const API_BASE_URL = 'https://localhost:7099/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
  role: 'Customer' | 'ImportOffice' | 'Exporter';
  companyName?: string;
  address?: string;
  country?: string;
}

export interface AuthResponse {
  token: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt: string;
  message?: string;
}

// Shape the backend always returns: ResponseViewModel<T>
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.token = localStorage.getItem('authToken');

    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        request
      );
      // ✅ الـ actual data جوا .data.data
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.api.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        request
      );
      // ✅ نفس الموضوع هنا
      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as ApiResponse<unknown> | undefined;

      // ✅ بيجيب الـ message من جوا الـ ResponseViewModel
      const message =
        responseData?.message ||
        error.message ||
        'An unexpected error occurred';

      // لو في validation errors، بيعملهم flatten
      if (responseData?.errors) {
        const firstError = Object.values(responseData.errors).flat()[0];
        return new Error(firstError || message);
      }

      return new Error(message);
    }
    return error instanceof Error ? error : new Error('An unexpected error occurred');
  }
}

export const authService = new AuthService();