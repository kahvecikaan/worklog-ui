import axios, { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { extractErrorMessage } from './error-handler';
import { 
  User, 
  LoginRequest, 
  WorklogType, 
  Worklog, 
  WorklogCreateRequest,
  DashboardStats,
  DashboardResponse,
  Employee
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Don't redirect to login if we're already on the login page
    // or if the failed request was a login attempt
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';
    
    if (error.response?.status === 401) {
      // Only redirect if we're not on login page and it wasn't a login request
      if (!isOnLoginPage && !isLoginRequest) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Don't toast here - let the component handle it for better context
      console.error('Access denied:', extractErrorMessage(error));
    } else if (error.response?.status && error.response.status >= 500) {
      // Only toast generic server errors here
      toast.error('Server error. Please try again later.');
    }
    
    // Always preserve the original error for component-level handling
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: async (data: LoginRequest): Promise<User> => {
    const response = await api.post<User>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Worklog APIs
export const worklogApi = {
  getMyWorklogs: async (startDate: string, endDate: string): Promise<Worklog[]> => {
    const response = await api.get<Worklog[]>('/worklogs/my', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getTeamWorklogs: async (startDate: string, endDate: string, employeeId?: number): Promise<Worklog[]> => {
    const response = await api.get<Worklog[]>('/worklogs/team', {
      params: { startDate, endDate, employeeId },
    });
    return response.data;
  },

  getDepartmentWorklogs: async (
    startDate: string, 
    endDate: string, 
    teamLeadId?: number,
    employeeId?: number
  ): Promise<Worklog[]> => {
    const response = await api.get<Worklog[]>('/worklogs/department', {
      params: { startDate, endDate, teamLeadId, employeeId },
    });
    return response.data;
  },

  createWorklog: async (data: WorklogCreateRequest): Promise<Worklog> => {
    const response = await api.post<Worklog>('/worklogs', data);
    return response.data;
  },

  getWorklog: async (id: number): Promise<Worklog> => {
    const { data } = await api.get<Worklog>(`/worklogs/${id}`);
    return data;
  },

  updateWorklog: async (id: number, data: WorklogCreateRequest): Promise<Worklog> => {
    const response = await api.put<Worklog>(`/worklogs/${id}`, data);
    return response.data;
  },

  deleteWorklog: async (id: number): Promise<void> => {
    await api.delete(`/worklogs/${id}`);
  },
};

// Worklog Type APIs
export const worklogTypeApi = {
  getActiveTypes: async (): Promise<WorklogType[]> => {
    const response = await api.get<WorklogType[]>('/worklog-types');
    return response.data;
  },
};

// Dashboard APIs
export const dashboardApi = {
  getDashboard: async (startDate?: string, endDate?: string): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/dashboard', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getQuickStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats/quick');
    return response.data;
  },

  getEmployeeDashboard: async (
    employeeId: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>(`/dashboard/employee/${employeeId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// Employee APIs
export const employeeApi = {
  getMe: async (): Promise<Employee> => {
    const response = await api.get<Employee>('/employees/me');
    return response.data;
  },

  getVisibleEmployees: async (): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('/employees/visible');
    return response.data;
  },

  getEmployee: async (id: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  getDepartmentEmployees: async (): Promise<Employee[]> => {
    const response = await api.get<Employee[]>('/employees/department');
    return response.data;
  },

  getTeamMembers: async (teamLeadId: number): Promise<Employee[]> => {
    const response = await api.get<Employee[]>(`/employees/team/${teamLeadId}`);
    return response.data;
  },
};

export default api;