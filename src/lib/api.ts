// API Client for Lume Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Set auth token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Remove auth token
export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// Base fetch function with auth
const fetchAPI = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (token expired/invalid)
  if (response.status === 401) {
    removeToken();
    localStorage.removeItem('user');
    // Redirect to login or handle as needed
    window.location.href = '/#/register?type=customer';
  }

  // Handle 403 Forbidden (insufficient permissions)
  if (response.status === 403) {
    const errorData = await response.json().catch(() => ({ error: 'Forbidden' }));
    throw new Error(errorData.error || 'Access denied. You do not have permission to access this resource.');
  }

  return response;
};

// API methods
export const api = {
  // GET request
  get: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetchAPI(endpoint, { method: 'GET' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = errorData.error || errorData.message || 'Request failed';
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }
    return response.json();
  },

  // POST request
  post: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetchAPI(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = errorData.error || errorData.message || 'Request failed';
      throw new Error(errorMessage);
    }
    return response.json();
  },

  // PUT request
  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetchAPI(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },

  // PATCH request
  patch: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetchAPI(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },

  // DELETE request
  delete: async <T = any>(endpoint: string): Promise<T> => {
    const response = await fetchAPI(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  },
};

// Auth API
export const authAPI = {
  registerCustomer: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    location?: string;
  }) => api.post('/auth/register/customer', data),

  registerSalon: (data: {
    email: string;
    password: string;
    salonName: string;
    contactName?: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    isIndividualStylist?: boolean;
    categories?: string[];
  }) => api.post('/auth/register/salon', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),
};

// Salons API
export const salonsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    category?: string;
    minRating?: number;
    priceRange?: string;
    partnersOnly?: boolean;
  }) => {
    if (params) {
      // Filter out undefined values
      const cleanParams: any = {};
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          cleanParams[key] = value;
        }
      });
      const queryString = Object.keys(cleanParams).length > 0
        ? '?' + new URLSearchParams(cleanParams).toString()
        : '';
      return api.get(`/salons${queryString}`);
    }
    return api.get(`/salons`);
  },

  getById: (id: number) => api.get(`/salons/${id}`),

  getMySalon: () => api.get('/salons/owner/my-salon'),

  updateMySalon: (data: any) => api.put('/salons/owner/my-salon', data),
};

// Services API
export const servicesAPI = {
  getBySalon: (salonId: number, activeOnly?: boolean) =>
    api.get(`/services/salon/${salonId}${activeOnly ? '?activeOnly=true' : ''}`),

  getById: (id: number) => api.get(`/services/${id}`),

  getMyServices: () => api.get('/services/owner/my-services'),

  create: (data: {
    name: string;
    category: string;
    duration: number;
    price: number;
    description?: string;
    image?: string;
    is_active?: boolean;
  }) => api.post('/services', data),

  update: (id: number, data: any) => api.put(`/services/${id}`, data),

  delete: (id: number) => api.delete(`/services/${id}`),
};

// Employees API
export const employeesAPI = {
  getBySalon: (salonId: number, activeOnly?: boolean) =>
    api.get(`/employees/salon/${salonId}${activeOnly ? '?activeOnly=true' : ''}`),

  getById: (id: number) => api.get(`/employees/${id}`),

  getMyEmployees: () => api.get('/employees/owner/my-employees'),

  create: (data: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    bio?: string;
    image?: string;
    experience?: number;
    specialties?: string[];
    schedule?: string[];
    is_active?: boolean;
  }) => api.post('/employees', data),

  update: (id: number, data: any) => api.put(`/employees/${id}`, data),

  delete: (id: number) => api.delete(`/employees/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params?: {
    status?: string;
    date?: string;
    salonId?: number;
    customerId?: number;
  }) => {
    if (params) {
      // Filter out undefined values
      const cleanParams: any = {};
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          cleanParams[key] = value;
        }
      });
      const queryString = Object.keys(cleanParams).length > 0
        ? '?' + new URLSearchParams(cleanParams).toString()
        : '';
      return api.get(`/appointments${queryString}`);
    }
    return api.get(`/appointments`);
  },

  getById: (id: number) => api.get(`/appointments/${id}`),

  create: (data: {
    salon_id: number;
    service_id: number;
    employee_id?: number;
    appointment_date: string;
    appointment_time: string;
    notes?: string;
  }) => api.post('/appointments', data),

  updateStatus: (id: number, status: string) =>
    api.patch(`/appointments/${id}/status`, { status }),

  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),

  cancel: (id: number) => api.delete(`/appointments/${id}`),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: any) => api.put('/users/profile', data),

  getDashboardStats: () => api.get('/users/dashboard/stats'),

  getSalonDashboardStats: () => api.get('/users/salon-dashboard/stats'),

  addFavorite: (salonId: number) => api.post(`/users/favorites/${salonId}`),

  removeFavorite: (salonId: number) => api.delete(`/users/favorites/${salonId}`),
};

// Verification API
export const verificationAPI = {
  sendEmailCode: (email: string) => api.post('/verification/send-email', { email }),

  sendPhoneCode: (phone: string) => api.post('/verification/send-phone', { phone }),

  verifyEmail: (email: string, code: string) =>
    api.post('/verification/verify-email', { email, code }),

  verifyPhone: (phone: string, code: string) =>
    api.post('/verification/verify-phone', { phone, code }),
};

// Admin API
export const adminAPI = {
  getPendingSalons: (params?: { page?: number; limit?: number }) => {
    if (params) {
      // Filter out undefined values
      const cleanParams: any = {};
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          cleanParams[key] = params[key as keyof typeof params];
        }
      });
      const queryString = Object.keys(cleanParams).length > 0
        ? '?' + new URLSearchParams(cleanParams).toString()
        : '';
      return api.get(`/admin/salons/pending${queryString}`);
    }
    return api.get(`/admin/salons/pending`);
  },

  getAllSalons: (params?: { page?: number; limit?: number; status?: string }) => {
    if (params) {
      // Filter out undefined values
      const cleanParams: any = {};
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] !== undefined) {
          cleanParams[key] = params[key as keyof typeof params];
        }
      });
      const queryString = Object.keys(cleanParams).length > 0
        ? '?' + new URLSearchParams(cleanParams).toString()
        : '';
      return api.get(`/admin/salons${queryString}`);
    }
    return api.get(`/admin/salons`);
  },

  approveSalon: (id: number) => api.patch(`/admin/salons/${id}/approve`),

  rejectSalon: (id: number, reason?: string) => 
    api.patch(`/admin/salons/${id}/reject`, { reason }),

  suspendSalon: (id: number, reason?: string) => 
    api.patch(`/admin/salons/${id}/suspend`, { reason }),

  getStats: () => api.get('/admin/stats'),
};

export default api;

