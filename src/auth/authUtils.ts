import { useCallback } from 'react';
import { useAuth } from './AuthContext';

/**
 * Hook to check if user has required role
 */
export const useHasRole = (roles: string | string[]) => {
  const { user } = useAuth();
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return user && requiredRoles.includes(user.role);
};

/**
 * Hook to check if user can perform an action
 */
export const useCanAccess = (requiredRoles?: string[]) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return false;
  if (!requiredRoles) return true;
  if (!user) return false;

  return requiredRoles.includes(user.role);
};

/**
 * Format token for API header
 */
export const formatAuthHeader = (token: string): Record<string, string> => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (expiresAt: string): boolean => {
  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = new Date().getTime();
  return currentTime > expirationTime;
};

/**
 * Parse JWT token (without verification - frontend only)
 */
export const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

/**
 * Hook for logout with confirmation
 */
export const useLogoutConfirm = () => {
  const { logout } = useAuth();

  return useCallback(() => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/login';
    }
  }, [logout]);
};

/**
 * Hook to persist form data to localStorage
 */
export const useFormStorage = (formId: string) => {
  const saveForm = useCallback(
    (data: any) => {
      localStorage.setItem(`form_${formId}`, JSON.stringify(data));
    },
    [formId]
  );

  const loadForm = useCallback(() => {
    const data = localStorage.getItem(`form_${formId}`);
    return data ? JSON.parse(data) : null;
  }, [formId]);

  const clearForm = useCallback(() => {
    localStorage.removeItem(`form_${formId}`);
  }, [formId]);

  return { saveForm, loadForm, clearForm };
};

/**
 * Hook to handle API errors
 */
export const useApiError = () => {
  const { logout } = useAuth();

  const handleError = useCallback(
    (error: any) => {
      if (error.response?.status === 401) {
        logout();
        window.location.href = '/login';
      }

      const message = error.response?.data?.message || error.message;
      return message;
    },
    [logout]
  );

  return { handleError };
};

/**
 * Validation utilities
 */
export const ValidationRules = {
  email: (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  password: (value: string): boolean => {
    return value.length >= 8;
  },

  phone: (value: string): boolean => {
    const regex = /^[\d\s\-\+\(\)]{10,}$/;
    return regex.test(value.replace(/\s/g, ''));
  },

  passwordStrength: (
    password: string
  ): { score: number; level: 'weak' | 'fair' | 'good' | 'strong' } => {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels: Array<'weak' | 'fair' | 'good' | 'strong'> = [
      'weak',
      'weak',
      'fair',
      'fair',
      'good',
      'good',
      'strong',
    ];

    return {
      score,
      level: levels[score],
    };
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Local storage helpers with type safety
 */
export const StorageHelper = {
  setUser: (user: any) => {
    localStorage.setItem('authUser', JSON.stringify(user));
  },

  getUser: () => {
    const data = localStorage.getItem('authUser');
    return data ? JSON.parse(data) : null;
  },

  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  clearAuth: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  },

  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};

/**
 * Time helpers
 */
export const TimeHelper = {
  minutesUntilExpiry: (expiresAt: string): number => {
    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    return Math.floor((expiry - now) / 1000 / 60);
  },

  isExpiringSoon: (expiresAt: string, minutes: number = 5): boolean => {
    return TimeHelper.minutesUntilExpiry(expiresAt) < minutes;
  },

  formatTime: (date: string): string => {
    return new Date(date).toLocaleString();
  },
};

/**
 * Role helper
 */
export const RoleHelper = {
  canEditShipment: (role: string): boolean => {
    return ['ImportOffice', 'Admin'].includes(role);
  },

  canApproveRequest: (role: string): boolean => {
    return ['ImportOffice', 'Admin'].includes(role);
  },

  canViewPayments: (role: string): boolean => {
    return ['Customer', 'ImportOffice', 'Admin'].includes(role);
  },

  canManageUsers: (role: string): boolean => {
    return role === 'Admin';
  },

  getRoleDisplayName: (role: string): string => {
    const names: Record<string, string> = {
      Customer: 'Customer',
      ImportOffice: 'Import Office',
      Exporter: 'Exporter',
      Admin: 'Administrator',
    };
    return names[role] || role;
  },
};