import { useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from './AuthContext';

export const AxiosInterceptor: React.FC = () => {
  useAxiosInterceptor();
  return null;
};

export const useAxiosInterceptor = () => {
  const { logout, token } = useAuth();

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout]);
};