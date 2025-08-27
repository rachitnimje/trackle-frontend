import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";
import { ApiResponse, PaginatedResponse, ErrorResponse } from "./types";
import { logger } from "@/utils/logger";
import { isValidUrl, RateLimiter } from "@/utils/security";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX;

// Rate limiter for API calls (1000 requests per minute)
const rateLimiter = new RateLimiter(1000, 60 * 1000);

// Validate API URL
if (API_BASE_URL === "" || !isValidUrl(API_BASE_URL)) {
  throw new Error(`Invalid API base URL: ${API_BASE_URL}`);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest", // Security header
    "Cache-Control": "no-cache", // Prevent caching sensitive data
  },
});

// Request interceptor to add authorization token and rate limiting
apiClient.interceptors.request.use((config) => {
  // Rate limiting check
  if (!rateLimiter.canMakeRequest("api")) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  const token = Cookies.get("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
interface BackendError {
  message?: string;
  error?: string;
  [key: string]: unknown;
}
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const response = error.response;
    const errorResponse: ErrorResponse = {
      success: false,
      message: "An error occurred",
      error: error.message,
      status: response?.status || 0,
    };

    if (response) {
      switch (response.status) {
        case 401:
          errorResponse.message = "You need to log in to access this resource";
          if (typeof window !== "undefined") {
            Cookies.remove("token");
            if (window.dispatchEvent) {
              window.dispatchEvent(
                new CustomEvent("show-toast", {
                  detail: { type: "error", message: errorResponse.message },
                })
              );
            }
            if (!window.location.pathname.startsWith("/auth/login")) {
              window.location.href = "/auth/login";
            }
          }
          break;
        case 404:
          errorResponse.message = "The requested resource was not found";
          logger.error("Resource not found", { url: error.config?.url }, "API");
          break;
        case 500:
          errorResponse.message =
            "A server error occurred, please try again later";
          logger.error(
            "Server error occurred",
            { message: error.message },
            "API"
          );
          break;
        default:
          // Use backend error message if available
          const backendData = response.data as BackendError;
          const backendMsg = backendData?.message || backendData?.error;
          errorResponse.message =
            backendMsg || `Error: ${response.status} - ${error.message}`;
          logger.error(
            `API Error (${response.status})`,
            { message: errorResponse.message },
            "API"
          );
      }
    } else {
      errorResponse.message = "Network error: Unable to connect to the server";
      logger.error("Network error", { message: error.message }, "API");
    }

    // Attach the error info to the error object for easier access in components
    // Use a symbol to avoid type errors
    (error as { errorInfo?: ErrorResponse }).errorInfo = errorResponse;

    return Promise.reject(error);
  }
);

// Generic API request methods
export const api = {
  get: async function <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    // Add API_PREFIX to all routes except login, register and other public endpoints
    const fullUrl =
      url.startsWith("/login") || url.startsWith("/register")
        ? url
        : `${API_PREFIX}${url}`;
    const response = await apiClient.get<ApiResponse<T>>(fullUrl, config);
    return response.data;
  },

  post: async function <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl =
      url.startsWith("/login") || url.startsWith("/register")
        ? url
        : `${API_PREFIX}${url}`;
    const response = await apiClient.post<ApiResponse<T>>(
      fullUrl,
      data,
      config
    );
    return response.data;
  },

  put: async function <T, D = Record<string, unknown>>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl =
      url.startsWith("/login") || url.startsWith("/register")
        ? url
        : `${API_PREFIX}${url}`;
    const response = await apiClient.put<ApiResponse<T>>(fullUrl, data, config);
    return response.data;
  },

  delete: async function <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const fullUrl =
      url.startsWith("/login") || url.startsWith("/register")
        ? url
        : `${API_PREFIX}${url}`;
    const response = await apiClient.delete<ApiResponse<T>>(fullUrl, config);
    return response.data;
  },

  // Helper method for paginated responses
  getPaginated: async function <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const fullUrl = `${API_PREFIX}${url}`;
    const response = await apiClient.get<PaginatedResponse<T>>(fullUrl, config);
    return response.data;
  },
};
