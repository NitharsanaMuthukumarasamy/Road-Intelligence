import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('road_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unauthorized errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      localStorage.removeItem('road_auth_token');
      localStorage.removeItem('road_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // Trigger auth event or state update
        window.dispatchEvent(new Event('auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
};

export const inspectionsAPI = {
  list: (params) => api.get('/inspections', { params }),
  get: (id) => api.get(`/inspections/${id}`),
  getSummary: (id) => api.get(`/inspections/${id}/summary`),
  create: (data) => api.post('/inspections', data),
  delete: (id) => api.delete(`/inspections/${id}`),
};


export const uploadsAPI = {
  uploadImage: (formData) =>
    api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadVideo: (formData, onProgress) =>
    api.post('/uploads/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    }),
};

export const jobsAPI = {
  list: (params) => api.get('/jobs', { params }),
  get: (jobId) => api.get(`/jobs/${jobId}`),
};

export const detectionsAPI = {
  list: (params) => api.get('/detections', { params }),
  get: (id) => api.get(`/detections/${id}`),
};

export const roadSegmentsAPI = {
  list: (params) => api.get('/road-segments', { params }),
  get: (id) => api.get(`/road-segments/${id}`),
  create: (data) => api.post('/road-segments', data),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getTrends: () => api.get('/dashboard/trends'),
};

export const mapAPI = {
  getDetections: (params) => api.get('/map/detections', { params }),
};

export const aiAPI = {
  explainDefect: (data) => api.post('/ai/explanation', data),
  recommendAction: (data) => api.post('/ai/recommendation', data),
};

export const dispatchesAPI = {
  list: (params) => api.get('/dispatches', { params }),
  get: (id) => api.get(`/dispatches/${id}`),
  updateStatus: (id, data) => api.patch(`/dispatches/${id}/status`, data),
};

export const reportsAPI = {
  generate: (data) => api.post('/reports/generate', data),
  getDownloadUrl: (filename) => `/api/reports/download/${filename}`,
};

export const healthAPI = {
  check: () => axios.get('/health'),
};

export default api;
