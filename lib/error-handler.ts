// lib/error-handler.ts
import { AxiosError } from 'axios';

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

export function extractErrorMessage(error: unknown): string {
  // Check if it's an Axios error
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiError>;
    
    // First, check if we have our custom error response structure
    if (axiosError.response?.data) {
      const data = axiosError.response.data;
      
      // Handle our custom ErrorResponse format
      if (typeof data === 'object' && 'message' in data) {
        return (data as ApiError).message;
      }
      
      // Handle plain string responses
      if (typeof data === 'string') {
        return data;
      }
    }
    
    // Fallback to status-based messages
    if (axiosError.response?.status) {
      switch (axiosError.response.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'You need to log in to perform this action.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'A conflict occurred. The resource may already exist.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `An error occurred (${axiosError.response.status})`;
      }
    }
  }
  
  // Handle non-Axios errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Final fallback
  return 'An unexpected error occurred';
}

export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.status === 400 && 
           axiosError.response?.data?.error === 'Validation Error';
  }
  return false;
}

export function getErrorDetails(error: unknown): ApiError | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data && 
        typeof axiosError.response.data === 'object' &&
        'status' in axiosError.response.data) {
      return axiosError.response.data as ApiError;
    }
  }
  return null;
}