import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useState, useEffect } from 'react';

const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000, 
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Types pour les requêtes
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Intercepteur de requête
apiClient.interceptors.request.use(
  (config) => {
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.status}`, response.data);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    console.error('[API Response Error]', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });

    if (
      !originalRequest._retry &&
      (!error.response || error.response.status >= 500) &&
      originalRequest._retryCount < API_CONFIG.RETRY_ATTEMPTS
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Attendre avant de réessayer
      await new Promise(resolve => 
        setTimeout(resolve, API_CONFIG.RETRY_DELAY * originalRequest._retryCount)
      );

      console.log(`[API Retry] Attempt ${originalRequest._retryCount} for ${originalRequest.url}`);
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Fonctions utilitaires pour les requêtes courantes
export const api = {
  get: <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, { params });
  },

  post: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data);
  },

  put: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data);
  },

  delete: <T = any>(url: string): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url);
  },

  patch: <T = any>(url: string, data?: any): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data);
  }
};

export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('[API Health Check] Failed:', error);
    return false;
  }
};

export const getApiConfig = () => {
  return {
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    environment: process.env.NODE_ENV,
    version: process.env.REACT_APP_VERSION || '1.0.0'
  };
};

export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await checkApiHealth();
      setIsHealthy(healthy);
    } catch (error) {
      setIsHealthy(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return { isHealthy, isChecking, checkHealth };
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

export default apiClient;